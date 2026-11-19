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

/**
 * A finished mock's result for each part: Läsa and Höra from the answers
 * (null while open answers wait for a mark), Skriva and Tala from the
 * learner's self-assessments (null until every one is made).
 */
/**
 * Whether a learner looks ready for a level (docs/PLAN.md, Key definitions):
 * every part Ready, and a finished mock of that level with every part at the
 * Ready mark or above.
 */
export function readyFor(
  level: string,
  partsReady: boolean,
  mocks: { level: string; percents: Record<Skill, number | null> | null }[],
  mark: number,
): { ready: boolean; partsReady: boolean; mockReady: boolean } {
  const mockReady = mocks.some(
    (m) =>
      m.level === level &&
      m.percents !== null &&
      EXAM_ORDER.every((s) => (m.percents![s] ?? -1) >= mark),
  )
  return { ready: partsReady && mockReady, partsReady, mockReady }
}

export function mockPercents(
  parts: {
    lasa: Item[]
    hora: Item[]
    /** The ids of the writing prompts, and of the speaking task and topic. */
    skriva: string[]
    tala: string[]
  },
  run: {
    responses: Record<string, MockResponse>
    marks: Record<string, boolean>
    assessments: Record<string, Record<string, 0 | 1 | 2>>
  },
): Record<Skill, number | null> {
  const scored = (items: Item[]) => {
    const r = partResult(items, run.responses, run.marks)
    return r.pending.length ? null : r.percent
  }
  const assessed = (ids: string[]) => {
    const all = ids.map((id) => run.assessments[id])
    if (!all.length || all.some((a) => !a)) return null
    // Each task is rounded down first, as the result screen shows it.
    const share = (a: Record<string, 0 | 1 | 2>) => {
      const v = Object.values(a)
      return Math.floor(
        (v.reduce<number>((n, x) => n + x, 0) / (v.length * 2)) * 100,
      )
    }
    return Math.floor(all.reduce((n, a) => n + share(a!), 0) / all.length)
  }
  return {
    lasa: scored(parts.lasa),
    hora: scored(parts.hora),
    skriva: assessed(parts.skriva),
    tala: assessed(parts.tala),
  }
}
