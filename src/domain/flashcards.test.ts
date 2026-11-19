import { describe, expect, it } from 'vitest'
import { shuffled } from './flashcards.ts'

describe('shuffled', () => {
  it('keeps every item exactly once and leaves the input alone', () => {
    const input = [1, 2, 3, 4, 5, 6]
    const out = shuffled(input)
    expect([...out].sort()).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('follows the random numbers it is given', () => {
    // 0 always picks the first remaining slot, which rotates the list.
    expect(shuffled(['a', 'b', 'c', 'd'], () => 0)).toEqual([
      'b',
      'c',
      'd',
      'a',
    ])
    // Just under 1 always picks the last slot, which changes nothing.
    expect(shuffled(['a', 'b', 'c', 'd'], () => 0.999)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ])
  })

  it('handles an empty list and a single item', () => {
    expect(shuffled([])).toEqual([])
    expect(shuffled(['a'])).toEqual(['a'])
  })
})
