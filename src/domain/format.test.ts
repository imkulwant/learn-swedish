import { describe, expect, it } from 'vitest'
import { formatBytes, formatDayWithYear } from './format.ts'

describe('format', () => {
  it('spells out a date with its year', () => {
    expect(formatDayWithYear('2027-01-18')).toBe('18 Jan 2027')
  })
  it.each([
    [512, '512 B'],
    [1536, '1.5 KB'],
    [5 * 1024 * 1024, '5.0 MB'],
  ])('formats %i bytes as %s', (bytes, text) => {
    expect(formatBytes(bytes)).toBe(text)
  })
})
