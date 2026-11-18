import { describe, expect, it } from 'vitest'
import type { Item } from './content/schema.ts'
import {
  currentPart,
  expiredPart,
  partResult,
  remainingMs,
  scoreItem,
  type MockPartState,
} from './mock.ts'

const mc: Item = {
  type: 'mc',
  id: 'mc',
  prompt: '?',
  options: ['a', 'b'],
  answer: 1,
  explain: '-',
}
const short: Item = {
  type: 'short',
  id: 'short',
  prompt: '?',
  accept: ['spår tre'],
  model: 'Spår tre.',
  explain: '-',
}
const match: Item = {
  type: 'match',
  id: 'match',
  prompt: '?',
  pairs: [
    { q: 'x', answer: 0 },
    { q: 'y', answer: 1 },
  ],
  options: ['A', 'B'],
  explain: '-',
}

describe('scoreItem', () => {
  it.each([
    [mc, 1, undefined, 1, false],
    [mc, 0, undefined, 0, false],
    [mc, undefined, undefined, 0, false],
    [short, 'Spår tre.', undefined, 1, false],
    [short, 'tredje spåret', undefined, 0, true],
    [short, 'tredje spåret', true, 1, false],
    [short, 'tredje spåret', false, 0, false],
    [short, '  ', undefined, 0, false],
  ] as const)('%#: %j scores %i', (item, response, mark, score, needsMark) => {
    expect(scoreItem(item, response, mark)).toMatchObject({ score, needsMark })
  })

  it('scores a match by pair, and an unanswered one as nothing', () => {
    expect(scoreItem(match, [0, 0], undefined)).toMatchObject({
      score: 1,
      maxScore: 2,
    })
    expect(scoreItem(match, undefined, undefined)).toMatchObject({
      score: 0,
      maxScore: 2,
    })
  })
})

describe('partResult', () => {
  it('adds up a part and lists open answers waiting for a mark', () => {
    expect(
      partResult(
        [mc, short, match],
        { mc: 1, short: 'något annat', match: [0, 1] },
        {},
      ),
    ).toEqual({ score: 3, maxScore: 4, percent: 75, pending: ['short'] })
  })
})

const state = (s: Partial<MockPartState>): MockPartState => ({
  startedAt: null,
  endsAt: null,
  finishedAt: null,
  ...s,
})

describe('part timing', () => {
  const parts = {
    lasa: state({ startedAt: 0, endsAt: 100, finishedAt: 90 }),
    hora: state({ startedAt: 200, endsAt: 300 }),
    skriva: state({}),
    tala: state({}),
  }

  it('finds the current part and what is left of it', () => {
    expect(currentPart(parts)).toBe('hora')
    expect(remainingMs(parts.hora, 250)).toBe(50)
    expect(remainingMs(parts.hora, 400)).toBe(0)
  })

  it('finds a part whose time ran out, as after the app was killed', () => {
    expect(expiredPart(parts, 299)).toBeNull()
    expect(expiredPart(parts, 300)).toBe('hora')
  })
})
