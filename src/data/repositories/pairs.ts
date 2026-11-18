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
export async function addPairTurn(
  source: PairSource,
  sessionId: string | null,
  turn: PairTurn,
  now: number = Date.now(),
): Promise<string> {
  if (sessionId) {
    await db.transaction('rw', db.pairSessions, async () => {
      const row = await db.pairSessions.get(sessionId)
      if (!row) throw new Error('This discussion is no longer stored.')
      await db.pairSessions.update(sessionId, { turns: [...row.turns, turn] })
    })
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
}

export async function finishPairSession(
  id: string,
  now: number = Date.now(),
): Promise<void> {
  await db.pairSessions.update(id, { finishedAt: now })
}

/** The discussions of one topic, newest first. */
export async function listPairSessions(
  topicId: string,
): Promise<PairSession[]> {
  const rows = await db.pairSessions.where('topicId').equals(topicId).toArray()
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}

/** The latest discussion of every topic, without its audio. */
export async function latestPairSessions(): Promise<
  Map<string, Pick<PairSession, 'rubric' | 'finishedAt'>>
> {
  const latest = new Map<string, PairSession>()
  await db.pairSessions.each((row) => {
    const before = latest.get(row.topicId)
    if (!before || row.createdAt > before.createdAt)
      latest.set(row.topicId, { ...row, turns: [] })
  })
  return latest
}

export async function setPairStarred(
  id: string,
  starred: boolean,
): Promise<void> {
  await db.pairSessions.update(id, { starred })
}

export async function deletePairSession(id: string): Promise<void> {
  await db.pairSessions.delete(id)
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
  const found: Pick<PairSession, 'rubric' | 'assessedAt'>[] = []
  await db.pairSessions.each((s) => {
    if (s.level === level && s.rubric && s.assessedAt !== null)
      found.push({ rubric: s.rubric, assessedAt: s.assessedAt })
  })
  return found
}
