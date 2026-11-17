import { describe, expect, it } from 'vitest'
import { READINESS, readiness, type ScoredAttempt } from './readiness.ts'

const make = (
  n: number,
  correct: number,
  mode: ScoredAttempt['mode'] = 'drill',
  start = 0,
): ScoredAttempt[] =>
  Array.from({ length: n }, (_, i) => ({
    score: i < correct ? 1 : 0,
    maxScore: 1,
    mode,
    answeredAt: start + i,
  }))

describe('readiness', () => {
  it('needs a minimum number of items before it judges', () => {
    expect(readiness(make(READINESS.minItems - 1, 14))).toEqual({
      status: 'insufficient',
      count: READINESS.minItems - 1,
      needed: READINESS.minItems,
    })
  })

  it.each([
    [20, 11, 'not-yet', 55],
    [20, 12, 'almost', 60],
    [20, 14, 'almost', 70],
    [20, 15, 'ready', 75],
    [20, 20, 'ready', 100],
  ] as const)(
    '%i items with %i right is %s at %i%%',
    (n, right, status, percent) => {
      expect(readiness(make(n, right))).toEqual({ status, percent, count: n })
    },
  )

  it('uses only the most recent items in the window', () => {
    // 40 old wrong answers, then 40 newer right ones.
    const attempts = [...make(40, 0, 'drill', 0), ...make(40, 40, 'drill', 100)]
    expect(readiness(attempts)).toMatchObject({
      status: 'ready',
      percent: 100,
      count: 40,
    })
  })

  it('counts a mock item double', () => {
    // 10 wrong drill items and 10 right mock items: 20 of 30 weighted points.
    const attempts = [...make(10, 0, 'drill'), ...make(10, 10, 'mock', 50)]
    expect(readiness(attempts)).toMatchObject({ percent: 66, status: 'almost' })
  })

  it('weighs an item by its own points, so a match item counts by pairs', () => {
    const attempts: ScoredAttempt[] = [
      ...make(14, 14),
      { score: 0, maxScore: 4, mode: 'drill', answeredAt: 99 },
    ]
    // 14 of 18 points.
    expect(readiness(attempts)).toMatchObject({ percent: 77, status: 'ready' })
  })

  it('bands on the exact value, not the rounded one', () => {
    // 40 match items of 5 pairs, 119 of 200 points: 59.5% must not round up into "almost".
    const attempts: ScoredAttempt[] = Array.from({ length: 40 }, (_, i) => ({
      score: i < 23 ? 5 : i === 23 ? 4 : 0,
      maxScore: 5,
      mode: 'drill',
      answeredAt: i,
    }))
    expect(readiness(attempts)).toMatchObject({
      status: 'not-yet',
      percent: 59,
    })
  })
})
