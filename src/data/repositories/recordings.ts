import type { Level } from '../../domain/content/schema'
import type { SpeakingRubric } from '../../domain/speaking'
import type { Recording } from '../../domain/types'
import { db } from '../db'

export type RecordingSource = Pick<
  Recording,
  'taskId' | 'packId' | 'packVersion' | 'level'
>

/** Stores a recording and its sound together. */
export async function saveRecording(
  source: RecordingSource,
  audio: { bytes: ArrayBuffer; mimeType: string; durationMs: number },
  now: number = Date.now(),
): Promise<Recording> {
  const row: Recording = {
    ...source,
    id: crypto.randomUUID(),
    createdAt: now,
    durationMs: audio.durationMs,
    mimeType: audio.mimeType,
    byteLength: audio.bytes.byteLength,
    starred: false,
    rubric: null,
    assessedAt: null,
  }
  await db.transaction('rw', db.recordings, db.audio, async () => {
    await db.recordings.add(row)
    await db.audio.add({ id: row.id, audio: audio.bytes })
  })
  return row
}

/** The sound of a recording or a pair answer, or null when it is gone. */
export async function getAudio(id: string): Promise<ArrayBuffer | null> {
  return (await db.audio.get(id))?.audio ?? null
}

export const getRecording = (id: string) => db.recordings.get(id)

/** The recordings of one task, newest first. */
export async function listRecordings(taskId: string): Promise<Recording[]> {
  const rows = await db.recordings.where('taskId').equals(taskId).toArray()
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}

/** The latest recording of every task, by task id. */
export async function latestRecordings(): Promise<Map<string, Recording>> {
  const latest = new Map<string, Recording>()
  for (const row of await db.recordings.toArray()) {
    const before = latest.get(row.taskId)
    if (!before || row.createdAt > before.createdAt) latest.set(row.taskId, row)
  }
  return latest
}

export async function setStarred(id: string, starred: boolean): Promise<void> {
  await db.recordings.update(id, { starred })
}

export async function deleteRecording(id: string): Promise<void> {
  await db.transaction('rw', db.recordings, db.audio, async () => {
    await db.recordings.delete(id)
    await db.audio.delete(id)
  })
}

export async function assessRecording(
  id: string,
  rubric: SpeakingRubric,
  now: number = Date.now(),
): Promise<void> {
  const updated = await db.recordings.update(id, { rubric, assessedAt: now })
  if (!updated) throw new Error('This recording is no longer stored.')
}

/** Every assessed recording of one level, for readiness. */
export async function assessedRecordings(
  level: Level,
): Promise<Pick<Recording, 'rubric' | 'assessedAt'>[]> {
  return (await db.recordings.toArray()).filter(
    (r) => r.level === level && r.rubric && r.assessedAt !== null,
  )
}

export interface RecordingUsage {
  count: number
  bytes: number
}

/** Solo recordings and pair discussions together. */
export async function recordingUsage(): Promise<RecordingUsage> {
  const solo = await db.recordings.toArray()
  const pairs = await db.pairSessions.toArray()
  return {
    count: solo.length + pairs.length,
    bytes:
      solo.reduce((n, r) => n + r.byteLength, 0) +
      pairs.reduce(
        (n, s) => n + s.turns.reduce((m, t) => m + t.byteLength, 0),
        0,
      ),
  }
}

/**
 * Deletes recordings and pair discussions made before `before`, except
 * starred ones, with their sound, and says how many went. Nothing else ever
 * deletes a recording without being asked.
 */
export async function deleteOldRecordings(before: number): Promise<number> {
  return db.transaction(
    'rw',
    [db.recordings, db.pairSessions, db.audio],
    async () => {
      const solo = await db.recordings
        .where('createdAt')
        .below(before)
        .filter((r) => !r.starred)
        .toArray()
      const pairs = await db.pairSessions
        .where('createdAt')
        .below(before)
        .filter((s) => !s.starred)
        .toArray()
      await db.recordings.bulkDelete(solo.map((r) => r.id))
      await db.pairSessions.bulkDelete(pairs.map((s) => s.id))
      await db.audio.bulkDelete([
        ...solo.map((r) => r.id),
        ...pairs.flatMap((s) => s.turns.map((t) => t.audioId)),
      ])
      return solo.length + pairs.length
    },
  )
}
