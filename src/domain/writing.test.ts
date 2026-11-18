import { describe, expect, it } from 'vitest'
import {
  RUBRIC_MAX,
  rubricPercent,
  rubricPoints,
  selfAssessedReadiness,
  type Rubric,
} from './writing.ts'

const all = (score: 0 | 1 | 2): Rubric => ({
  task: score,
  register: score,
  structure: score,
  linking: score,
  grammar: score,
  variation: score,
})

describe('rubric', () => {
  it('scores 0 to 12, as a percent rounded down', () => {
    expect(RUBRIC_MAX).toBe(12)
    expect(rubricPoints(all(2))).toBe(12)
    expect(rubricPercent(all(2))).toBe(100)
    expect(rubricPercent({ ...all(1), task: 2 })).toBe(58) // 7 of 12
    expect(rubricPercent(all(0))).toBe(0)
  })
})

const task = (percent: number, assessedAt: number) => ({ percent, assessedAt })

describe('selfAssessedReadiness', () => {
  it('needs three tasks', () => {
    expect(selfAssessedReadiness([task(100, 1), task(100, 2)])).toEqual({
      status: 'insufficient',
      count: 2,
      needed: 3,
    })
  })

  it.each([
    [[59, 59, 60], 'not-yet', 59],
    [[60, 60, 60], 'almost', 60],
    [[74, 75, 75], 'almost', 74],
    [[75, 75, 75], 'ready', 75],
  ] as const)('%j is %s at %i%%', (percents, status, percent) => {
    expect(
      selfAssessedReadiness(percents.map((p, i) => task(p, i))),
    ).toMatchObject({ status, percent })
  })

  it('uses the latest five only', () => {
    const old = [0, 0, 0].map((p, i) => task(p, i))
    const recent = [100, 100, 100, 100, 100].map((p, i) => task(p, 10 + i))
    expect(selfAssessedReadiness([...old, ...recent])).toMatchObject({
      status: 'ready',
      percent: 100,
      count: 5,
    })
  })
})
