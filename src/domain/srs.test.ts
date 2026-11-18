import { describe, expect, it } from 'vitest'
import {
  SRS,
  answer,
  dueToday,
  formatInterval,
  newCard,
  nextUp,
  preview,
  unlockedDirections,
  type QueueWord,
} from './srs.ts'
import type { VocabCard } from './types.ts'

const NOW = Date.UTC(2026, 10, 18, 10, 0)
const MIN = 60_000
const DAY = 86_400_000

describe('cards', () => {
  it('a new card is due now and survives a JSON round trip', async () => {
    const card = await newCard('lon', 'd-ord-arbete', 'sv-en', NOW)
    expect(card).toMatchObject({
      id: 'lon:sv-en',
      dueAt: NOW,
      lastReviewAt: null,
      reps: 0,
      correct: 0,
    })
    const stored = JSON.parse(JSON.stringify(card)) as VocabCard
    const answered = await answer(stored, 'good', NOW)
    expect(answered.lastReviewAt).toBe(NOW)
    expect(answered.reps).toBe(1)
  })

  it('schedules a new card further out for a better answer', async () => {
    const card = await newCard('lon', 'p', 'sv-en', NOW)
    const next = await preview(card, NOW)
    expect(next.again).toBeLessThan(next.good)
    expect(next.hard).toBeLessThanOrEqual(next.good)
    expect(next.good).toBeLessThan(next.easy)
    const good = await answer(card, 'good', NOW)
    expect(good.dueAt - NOW).toBe(next.good)
  })

  it('counts correct answers, and Again forgets a known card', async () => {
    let card = await newCard('lon', 'p', 'sv-en', NOW)
    card = await answer(card, 'good', NOW)
    card = await answer(card, 'good', card.dueAt)
    expect(card.correct).toBe(2)
    const wrong = await answer(card, 'again', card.dueAt)
    expect(wrong.correct).toBe(2)
    expect(wrong.lapses).toBe(1)
    expect(wrong.dueAt - card.dueAt).toBeLessThan(DAY)
  })

  it('answering never changes the card passed in', async () => {
    const card = await newCard('lon', 'p', 'sv-en', NOW)
    const copy = structuredClone(card)
    await answer(card, 'easy', NOW)
    expect(card).toEqual(copy)
  })
})

describe('unlockedDirections', () => {
  const recognition = (
    correct: number,
    direction: VocabCard['direction'] = 'sv-en',
  ) => ({ direction, correct }) as VocabCard
  it('opens listening after one correct recognition and English to Swedish after two', () => {
    expect(unlockedDirections(recognition(0))).toEqual([])
    expect(unlockedDirections(recognition(SRS.audioAfter))).toEqual(['audio'])
    expect(unlockedDirections(recognition(SRS.englishToSwedishAfter))).toEqual([
      'audio',
      'en-sv',
    ])
  })
  it('only recognitions open anything', () => {
    expect(unlockedDirections(recognition(5, 'audio'))).toEqual([])
  })
})

describe('formatInterval', () => {
  it.each([
    [30_000, '<1 min'],
    [10 * MIN, '10 min'],
    [5 * 60 * MIN, '5 h'],
    [DAY, '1 day'],
    [4.6 * DAY, '5 days'],
    [90 * DAY, '3 mo'],
    [400 * DAY, '1.1 yr'],
  ])('%i ms reads %s', (ms, text) => expect(formatInterval(ms)).toBe(text))
})

describe('nextUp', () => {
  const words: QueueWord[] = [
    { wordId: 'a', packId: 'p' },
    { wordId: 'b', packId: 'p' },
  ]
  const card = (wordId: string, dueAt: number, state = 2) =>
    ({ id: `${wordId}:sv-en`, wordId, dueAt, state }) as VocabCard
  const base = {
    words,
    now: NOW,
    today: { reviews: 0, newWords: 0 },
    endOfDay: NOW + 10 * 60 * MIN,
  }

  it('takes the card due longest ago first', () => {
    const next = nextUp({
      ...base,
      cards: [card('a', NOW - MIN), card('b', NOW - DAY)],
    })
    expect(next).toMatchObject({ kind: 'review', card: { wordId: 'b' } })
  })

  it('then a word never seen, in pack order', () => {
    expect(nextUp({ ...base, cards: [card('a', NOW + DAY)] })).toEqual({
      kind: 'new',
      word: { wordId: 'b', packId: 'p' },
    })
  })

  it('starts no new word once the answers of the day are used up', () => {
    const today = { reviews: SRS.reviewsPerDay, newWords: 0 }
    expect(nextUp({ ...base, today, cards: [] })).toEqual({ kind: 'done' })
  })

  it('leaves out cards that cannot be practised now, such as unstored audio', () => {
    const audio = {
      ...card('a', NOW - DAY),
      id: 'a:audio',
      direction: 'audio',
    } as VocabCard
    const next = nextUp({
      ...base,
      words: [words[0]!],
      cards: [audio, card('a', NOW + DAY)],
      playable: (c) => c.direction !== 'audio',
    })
    expect(next).toEqual({ kind: 'done' })
  })

  it('caps what is shown as due at the answers left today', () => {
    expect(dueToday(40, { reviews: SRS.reviewsPerDay - 5 })).toBe(5)
    expect(dueToday(3, { reviews: 0 })).toBe(3)
  })

  it('keeps to the daily limits', () => {
    const today = { reviews: SRS.reviewsPerDay, newWords: SRS.newWordsPerDay }
    expect(nextUp({ ...base, today, cards: [card('a', NOW - MIN)] })).toEqual({
      kind: 'done',
    })
  })

  it('waits for a card in learning that comes back later today', () => {
    const learning = card('a', NOW + 10 * MIN, 1)
    const next = nextUp({ ...base, words: [words[0]!], cards: [learning] })
    expect(next).toEqual({ kind: 'wait', at: NOW + 10 * MIN })
  })

  it('ignores cards of words that are no longer offered', () => {
    expect(
      nextUp({ ...base, words: [], cards: [card('gone', NOW - DAY)] }),
    ).toEqual({ kind: 'done' })
  })
})
