import { toLocalDate } from '../../domain/dates'
import {
  answer,
  cardId,
  newCard,
  unlockedDirections,
  type Grade,
  type QueueWord,
} from '../../domain/srs'
import type {
  EpochMs,
  LocalDate,
  StudyDay,
  VocabCard,
} from '../../domain/types'
import { db } from '../db'

export const listCards = (): Promise<VocabCard[]> => db.cards.toArray()

export async function getStudyDay(date: LocalDate): Promise<StudyDay> {
  return (await db.studyDays.get(date)) ?? { date, reviews: 0, newWords: 0 }
}

async function bumpDay(
  date: LocalDate,
  change: Partial<Pick<StudyDay, 'reviews' | 'newWords'>>,
) {
  const day = await getStudyDay(date)
  await db.studyDays.put({
    date,
    reviews: day.reviews + (change.reviews ?? 0),
    newWords: day.newWords + (change.newWords ?? 0),
  })
}

/**
 * Starts a word: its Swedish-to-English card, due now. Counts as one new word
 * today. Starting a word twice changes nothing.
 */
export async function startWord(
  word: QueueWord,
  now: EpochMs,
): Promise<VocabCard> {
  // The scheduler runs outside the transaction, which can only wait on the database.
  const fresh = await newCard(word.wordId, word.packId, 'sv-en', now)
  return db.transaction('rw', db.cards, db.studyDays, async () => {
    const existing = await db.cards.get(fresh.id)
    if (existing) return existing
    await db.cards.add(fresh)
    await bumpDay(toLocalDate(now), { newWords: 1 })
    return fresh
  })
}

/**
 * Stores an answer: the card's next due time, any direction it unlocks, and
 * one more review today, all in one transaction. A card answered meanwhile
 * (a double tap, another tab) is left as it is, and that answer is returned.
 */
export async function answerCard(
  card: VocabCard,
  grade: Grade,
  now: EpochMs,
): Promise<VocabCard> {
  const answered = await answer(card, grade, now)
  const opened = await Promise.all(
    unlockedDirections(answered).map((direction) =>
      newCard(card.wordId, card.packId, direction, now),
    ),
  )
  return db.transaction('rw', db.cards, db.studyDays, async () => {
    const stored = await db.cards.get(card.id)
    // The number of answers is the card's version: any answer adds one.
    if (!stored || stored.reps !== card.reps) return stored ?? card
    await db.cards.put(answered)
    for (const extra of opened)
      if (!(await db.cards.get(extra.id))) await db.cards.add(extra)
    await bumpDay(toLocalDate(now), { reviews: 1 })
    return answered
  })
}

export interface VocabStatus {
  /** Cards due now, of words still offered. */
  due: number
  /** Words never started. */
  unstarted: number
  /** Words whose recognition card has graduated to review. */
  known: number
}

export async function vocabStatus(
  words: QueueWord[],
  now: EpochMs,
): Promise<VocabStatus> {
  const offered = new Set(words.map((w) => w.wordId))
  const cards = (await listCards()).filter((c) => offered.has(c.wordId))
  const started = new Set(cards.map((c) => c.wordId))
  return {
    due: cards.filter((c) => c.dueAt <= now).length,
    unstarted: words.filter((w) => !started.has(w.wordId)).length,
    known: cards.filter(
      (c) => c.id === cardId(c.wordId, 'sv-en') && c.state === 2,
    ).length,
  }
}
