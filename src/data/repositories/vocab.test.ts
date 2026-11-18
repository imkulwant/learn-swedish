import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { toLocalDate } from '../../domain/dates'
import { resetDb } from '../../test/db'
import { DB_NAME, SfiDb, db } from '../db'
import {
  answerCard,
  getStudyDay,
  listCards,
  startWord,
  vocabStatus,
} from './vocab'

const NOW = new Date(2026, 10, 18, 10, 0).getTime()
const word = { wordId: 'lon', packId: 'd-ord-arbete' }

beforeEach(resetDb)

describe('vocabulary', () => {
  it('starting a word makes one card and counts one new word, once', async () => {
    const card = await startWord(word, NOW)
    expect(card.id).toBe('lon:sv-en')
    expect(await startWord(word, NOW + 1)).toEqual(card)
    expect(await listCards()).toHaveLength(1)
    expect(await getStudyDay(toLocalDate(NOW))).toEqual({
      date: toLocalDate(NOW),
      reviews: 0,
      newWords: 1,
    })
  })

  it('answers unlock listening, then English to Swedish, and count reviews', async () => {
    let card = await startWord(word, NOW)
    card = await answerCard(card, 'good', NOW)
    expect((await listCards()).map((c) => c.id).sort()).toEqual([
      'lon:audio',
      'lon:sv-en',
    ])
    await answerCard(card, 'good', card.dueAt)
    expect((await listCards()).map((c) => c.id).sort()).toEqual([
      'lon:audio',
      'lon:en-sv',
      'lon:sv-en',
    ])
    expect((await getStudyDay(toLocalDate(NOW))).reviews).toBe(1)
  })

  it('an answer given twice to the same card counts once', async () => {
    const card = await startWord(word, NOW)
    const first = await answerCard(card, 'good', NOW)
    const again = await answerCard(card, 'again', NOW)
    expect(again).toEqual(first)
    expect((await getStudyDay(toLocalDate(NOW))).reviews).toBe(1)
  })

  it('reports what is due, unstarted and known', async () => {
    const words = [word, { wordId: 'chef', packId: 'd-ord-arbete' }]
    expect(await vocabStatus(words, NOW)).toEqual({
      due: 0,
      unstarted: 2,
      known: 0,
    })
    const card = await startWord(word, NOW)
    expect(await vocabStatus(words, NOW)).toEqual({
      due: 1,
      unstarted: 1,
      known: 0,
    })
    await answerCard(card, 'good', NOW)
    expect(await vocabStatus(words, NOW)).toMatchObject({ due: 1, known: 1 })
  })
})

describe('database upgrades', () => {
  it('opens a version 1 database at the current version and keeps its answers', async () => {
    db.close()
    await Dexie.delete(DB_NAME)
    const v1 = new Dexie(DB_NAME)
    v1.version(1).stores({
      attempts: 'id, itemId, [level+skill], answeredAt',
      cards: 'id, wordId, due, state',
      writings: 'id, promptId, updatedAt',
      recordings: 'id, taskId, createdAt, starred',
      mocks: 'id, examId, status, startedAt',
      studyDays: 'date',
      settings: 'key',
    })
    await v1
      .table('attempts')
      .add({ id: 'a1', itemId: 'i', level: 'D', skill: 'lasa', answeredAt: 1 })
    v1.close()

    const current = new SfiDb()
    await current.open()
    expect(current.verno).toBe(4)
    expect(await current.attempts.get('a1')).toMatchObject({ itemId: 'i' })
    expect(await current.cards.where('dueAt').below(1).count()).toBe(0)
    expect(await current.pairSessions.count()).toBe(0)
    current.close()
    await db.open()
  })
})
