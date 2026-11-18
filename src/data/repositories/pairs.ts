import type { Level } from '../../domain/content/schema'
import type { PairRubric } from '../../domain/speaking'
import type { PairSession, PairTurn } from '../../domain/types'
import { db } from '../db'

export type PairSource = Pick<
  PairSession,
  'topicId' | 'packId' | 'packVersion' | 'level'
>

/**
 * Stores one answer of a discussion at once, so a force-quit keeps every
 * answer given so far. The first answer creates the session.
 */
export interface RecordedTurn {
  turn: number
  audio: ArrayBuffer
  mimeType: string
  durationMs: number
}

export async function addPairTurn(
  source: PairSource,
  sessionId: string | null,
  recorded: RecordedTurn,
  now: number = Date.now(),
): Promise<string> {
  const { audio, ...rest } = recorded
  const turn: PairTurn = {
    ...rest,
    audioId: crypto.randomUUID(),
    byteLength: audio.byteLength,
  }
  return db.transaction('rw', db.pairSessions, db.audio, async () => {
    await db.audio.add({ id: turn.audioId, audio })
    if (sessionId) {
      const row = await db.pairSessions.get(sessionId)
      if (!row) throw new Error('This discussion is no longer stored.')
      await db.pairSessions.update(sessionId, { turns: [...row.turns, turn] })
      return sessionId
    }
    const row: PairSession = {
      ...source,
      id: crypto.randomUUID(),
      createdAt: now,
      turns: [turn],
      finishedAt: null,
      starred: false,
      rubric: null,
      assessedAt: null,
    }
    await db.pairSessions.add(row)
    return row.id
  })
}

export async function finishPairSession(
  id: string,
  now: number = Date.now(),
): Promise<void> {
  await db.pairSessions.update(id, { finishedAt: now })
}

export const getPairSession = (id: string) => db.pairSessions.get(id)

/** The discussions of one topic, newest first. */
export async function listPairSessions(
  topicId: string,
): Promise<PairSession[]> {
  const rows = await db.pairSessions.where('topicId').equals(topicId).toArray()
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}

/** The latest discussion of every topic. */
export async function latestPairSessions(): Promise<Map<string, PairSession>> {
  const latest = new Map<string, PairSession>()
  for (const row of await db.pairSessions.toArray()) {
    const before = latest.get(row.topicId)
    if (!before || row.createdAt > before.createdAt)
      latest.set(row.topicId, row)
  }
  return latest
}

export async function setPairStarred(
  id: string,
  starred: boolean,
): Promise<void> {
  await db.pairSessions.update(id, { starred })
}

export async function deletePairSession(id: string): Promise<void> {
  await db.transaction('rw', db.pairSessions, db.audio, async () => {
    const row = await db.pairSessions.get(id)
    await db.pairSessions.delete(id)
    if (row) await db.audio.bulkDelete(row.turns.map((t) => t.audioId))
  })
}

export async function assessPairSession(
  id: string,
  rubric: PairRubric,
  now: number = Date.now(),
): Promise<void> {
  const updated = await db.pairSessions.update(id, {
    rubric,
    assessedAt: now,
  })
  if (!updated) throw new Error('This discussion is no longer stored.')
}

export async function assessedPairSessions(
  level: Level,
): Promise<Pick<PairSession, 'rubric' | 'assessedAt'>[]> {
  return (await db.pairSessions.toArray()).filter(
    (s) => s.level === level && s.rubric && s.assessedAt !== null,
  )
}
