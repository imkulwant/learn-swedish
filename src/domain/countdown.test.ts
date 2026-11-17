import { describe, expect, it } from 'vitest'
import { examCountdown } from './countdown.ts'

describe('examCountdown', () => {
  it('counts whole calendar days, across the change to winter time', () => {
    expect(examCountdown('2026-10-20', '2026-11-03')).toEqual({
      kind: 'future',
      days: 14,
    })
    expect(examCountdown('2027-01-17', '2027-01-18')).toEqual({
      kind: 'future',
      days: 1,
    })
  })
  it('knows the day itself and a date gone by', () => {
    expect(examCountdown('2027-01-18', '2027-01-18')).toEqual({ kind: 'today' })
    expect(examCountdown('2027-01-19', '2027-01-18')).toEqual({ kind: 'past' })
  })
})
