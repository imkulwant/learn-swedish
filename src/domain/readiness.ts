/**
 * How ready the learner looks for one part of the test at one level. These
 * are the app's own thresholds, tuned by hand. The official cut scores are not
 * public, so readiness is an estimate and the UI must say so.
 */
export const READINESS = {
  /** Only the most recent items count. */
  window: 40,
  /** Fewer items than this say nothing reliable. */
  minItems: 15,
  /** A mock item weighs this many times a drill item. */
  mockWeight: 2,
  /** Percent from which a part is "almost" ready. */
  almost: 60,
  /** Percent from which a part is "ready". */
  ready: 75,
} as const

export interface ScoredAttempt {
  score: number
  maxScore: number
  mode: 'drill' | 'mock' | 'placement'
  answeredAt: number
}

export type Readiness =
  | { status: 'insufficient'; count: number; needed: number }
  | { status: 'not-yet' | 'almost' | 'ready'; percent: number; count: number }

/** Readiness from the attempts of one level and one part, in any order. */
export function readiness(attempts: ScoredAttempt[]): Readiness {
  const recent = [...attempts]
    .sort((a, b) => b.answeredAt - a.answeredAt)
    .slice(0, READINESS.window)

  if (recent.length < READINESS.minItems) {
    return {
      status: 'insufficient',
      count: recent.length,
      needed: READINESS.minItems,
    }
  }

  let points = 0
  let max = 0
  for (const a of recent) {
    const weight = a.mode === 'mock' ? READINESS.mockWeight : 1
    points += a.score * weight
    max += a.maxScore * weight
  }
  const exact = max === 0 ? 0 : (points / max) * 100
  const status =
    exact >= READINESS.ready
      ? 'ready'
      : exact >= READINESS.almost
        ? 'almost'
        : 'not-yet'
  // Rounded down, so the number shown never reaches a band the value has not.
  return { status, percent: Math.floor(exact), count: recent.length }
}
