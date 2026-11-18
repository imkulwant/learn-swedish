import { describe, expect, it } from 'vitest'
import {
  formatDuration,
  rubricShare,
  speakingPercent,
  type SpeakingRubric,
} from './speaking.ts'

describe('speakingPercent', () => {
  it('is the share of 12 points, rounded down', () => {
    const rubric: SpeakingRubric = {
      task: 2,
      understandable: 2,
      connected: 1,
      listener: 1,
      language: 1,
      flow: 0,
    }
    expect(speakingPercent(rubric)).toBe(58) // 7 of 12
  })
})

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [999, '0:00'],
    [65_000, '1:05'],
    [240_000, '4:00'],
    [-5, '0:00'],
  ])('%i ms is %s', (ms, text) => {
    expect(formatDuration(ms)).toBe(text)
  })
})

describe('rubricShare', () => {
  it('works for any rubric of 0–2 scores', () => {
    expect(rubricShare({ a: 2, b: 2 })).toBe(100)
    expect(rubricShare({ a: 1, b: 0, c: 0 })).toBe(16)
  })
})
