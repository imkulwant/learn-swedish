import { gradeShort, scoreMatch, scoreMc } from './answerCheck.ts'
import type { Item, Skill } from './content/schema.ts'
import { EXAM_FORMAT, EXAM_ORDER } from './examFormat.ts'

/** What a learner gave for one item in a mock, before it is scored. */
export type MockResponse = number | string | (number | null)[]

export interface MockPartState {
  startedAt: number | null
  /** When the part's time runs out: stored, so a resumed mock keeps it. */
  endsAt: number | null
  finishedAt: number | null
}

export interface ItemScore {
  score: number
  maxScore: number
  /** An open answer that matched nothing waits for the learner's own mark. */
  needsMark: boolean
}

/**
 * Scores one item at the end of a mock. Nothing is scored while the mock
 * runs, so the learner sees no feedback until the end.
 */
export function scoreItem(
  item: Item,
  response: MockResponse | undefined,
  mark: boolean | undefined,
): ItemScore {
  if (item.type === 'mc')
    return {
      ...(typeof response === 'number'
        ? scoreMc(item, response)
        : { score: 0, maxScore: 1 }),
      needsMark: false,
    }
  if (item.type === 'match')
    return {
      ...scoreMatch(
        item,
        Array.isArray(response) ? response : item.pairs.map(() => null),
      ),
      needsMark: false,
    }
  const text = typeof response === 'string' ? response : ''
  if (!text.trim()) return { score: 0, maxScore: 1, needsMark: false }
  if (gradeShort(item, text) === 'correct')
    return { score: 1, maxScore: 1, needsMark: false }
  if (mark === undefined) return { score: 0, maxScore: 1, needsMark: true }
  return { score: mark ? 1 : 0, maxScore: 1, needsMark: false }
}

export interface PartResult {
  score: number
  maxScore: number
  /** Rounded down, like readiness. */
  percent: number
  /** Items still waiting for the learner's own mark. */
  pending: string[]
}

export function partResult(
  items: Item[],
  responses: Record<string, MockResponse>,
  marks: Record<string, boolean>,
): PartResult {
  let score = 0
  let maxScore = 0
  const pending: string[] = []
  for (const item of items) {
    const s = scoreItem(item, responses[item.id], marks[item.id])
    score += s.score
    maxScore += s.maxScore
    if (s.needsMark) pending.push(item.id)
  }
  return {
    score,
    maxScore,
    percent: maxScore ? Math.floor((score / maxScore) * 100) : 0,
    pending,
  }
}

/** How long a part runs, in milliseconds. */
export const partDurationMs = (skill: Skill) =>
  EXAM_FORMAT.parts[skill].minutes * 60_000

/** The time left in a started part, never below zero. */
export const remainingMs = (part: MockPartState, now: number) =>
  part.endsAt === null ? 0 : Math.max(0, part.endsAt - now)

/** The part being worked on, or null when every part is finished. */
export function currentPart(parts: Record<Skill, MockPartState>): Skill | null {
  return EXAM_ORDER.find((s) => parts[s].finishedAt === null) ?? null
}

/** A started part whose time ran out while the app was closed or open. */
export function expiredPart(
  parts: Record<Skill, MockPartState>,
  now: number,
): Skill | null {
  const part = currentPart(parts)
  if (!part) return null
  const state = parts[part]
  return state.endsAt !== null && state.endsAt <= now ? part : null
}
