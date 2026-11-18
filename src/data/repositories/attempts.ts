import type { Level, Skill } from '../../domain/content/schema'
import type { Attempt } from '../../domain/types'
import { db } from '../db'

export type NewAttempt = Omit<Attempt, 'id' | 'answeredAt'>

/** Stores one answer at once, so nothing is lost if iOS closes the app. */
export async function recordAttempt(attempt: NewAttempt): Promise<Attempt> {
  if (
    attempt.maxScore <= 0 ||
    attempt.score < 0 ||
    attempt.score > attempt.maxScore
  )
    throw new RangeError(
      `score ${attempt.score} of ${attempt.maxScore} is not possible`,
    )
  const row: Attempt = {
    ...attempt,
    id: crypto.randomUUID(),
    answeredAt: Date.now(),
  }
  await db.attempts.add(row)
  return row
}

/** Every attempt of one level and part, newest first. */
export async function listAttempts(
  level: Level,
  skill: Skill,
): Promise<Attempt[]> {
  const rows = await db.attempts
    .where('[level+skill]')
    .equals([level, skill])
    .toArray()
  return rows.sort((a, b) => b.answeredAt - a.answeredAt)
}

export const countAttempts = (): Promise<number> => db.attempts.count()

/**
 * When the oldest answer given after `since` was given, or null with none.
 * With `since` null, every answer counts.
 */
export async function oldestAttemptSince(
  since: number | null,
): Promise<number | null> {
  const first = await db.attempts
    .where('answeredAt')
    .above(since ?? -1)
    .first()
  return first?.answeredAt ?? null
}

/** Whether this device holds any progress: answers or words started. */
export async function hasProgress(): Promise<boolean> {
  return (await db.attempts.count()) + (await db.cards.count()) > 0
}
