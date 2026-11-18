import type { Level } from '../../domain/content/schema'
import type { SpeakingRubric } from '../../domain/speaking'
import type { Recording } from '../../domain/types'
import { db } from '../db'

export type RecordingSource = Pick<
  Recording,
  'taskId' | 'packId' | 'packVersion' | 'level'
>

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
    audio: audio.bytes,
    starred: false,
    rubric: null,
    assessedAt: null,
  }
  await db.recordings.add(row)
  return row
}

/** The recordings of one task, newest first. */
export async function listRecordings(taskId: string): Promise<Recording[]> {
  const rows = await db.recordings.where('taskId').equals(taskId).toArray()
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}

/** The latest recording of every task, by task id. */
export async function latestRecordings(): Promise<Map<string, Recording>> {
  const latest = new Map<string, Recording>()
  await db.recordings.each((row) => {
    const before = latest.get(row.taskId)
    if (!before || row.createdAt > before.createdAt)
      latest.set(row.taskId, { ...row, audio: new ArrayBuffer(0) })
  })
  return latest
}

export async function setStarred(id: string, starred: boolean): Promise<void> {
  await db.recordings.update(id, { starred })
}

export async function deleteRecording(id: string): Promise<void> {
  await db.recordings.delete(id)
}

export async function assessRecording(
  id: string,
  rubric: SpeakingRubric,
  now: number = Date.now(),
): Promise<void> {
  const updated = await db.recordings.update(id, { rubric, assessedAt: now })
  if (!updated) throw new Error('This recording is no longer stored.')
}

/** Every assessed recording of one level, for readiness, without the audio. */
export async function assessedRecordings(
  level: Level,
): Promise<Pick<Recording, 'rubric' | 'assessedAt'>[]> {
  const found: Pick<Recording, 'rubric' | 'assessedAt'>[] = []
  await db.recordings.each((r) => {
    if (r.level === level && r.rubric && r.assessedAt !== null)
      found.push({ rubric: r.rubric, assessedAt: r.assessedAt })
  })
  return found
}

export interface RecordingUsage {
  count: number
  bytes: number
}

/** Solo recordings and pair discussions together. */
export async function recordingUsage(): Promise<RecordingUsage> {
  let count = 0
  let bytes = 0
  await db.recordings.each((r) => {
    count++
    bytes += r.audio.byteLength
  })
  await db.pairSessions.each((s) => {
    count++
    bytes += s.turns.reduce((n, t) => n + t.audio.byteLength, 0)
  })
  return { count, bytes }
}

/**
 * Deletes recordings and pair discussions made before `before`, except
 * starred ones, and says how many went. Nothing else ever deletes a recording without being asked.
 */
export async function deleteOldRecordings(before: number): Promise<number> {
  return db.transaction('rw', db.recordings, db.pairSessions, async () => {
    const solo = await db.recordings
      .where('createdAt')
      .below(before)
      .filter((r) => !r.starred)
      .delete()
    const pairs = await db.pairSessions
      .where('createdAt')
      .below(before)
      .filter((s) => !s.starred)
      .delete()
    return solo + pairs
  })
}
