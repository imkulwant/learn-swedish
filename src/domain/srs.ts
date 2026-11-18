import { DefaultScheduler, Rating } from 'ts-fsrs'
import type { CardDirection, EpochMs, VocabCard } from './types.ts'

/** Spaced repetition settings, from docs/PLAN.md "Key definitions". */
export const SRS = {
  desiredRetention: 0.9,
  newWordsPerDay: 15,
  reviewsPerDay: 150,
  /** Correct recognitions of a word before the next direction opens. */
  audioAfter: 1,
  englishToSwedishAfter: 2,
} as const

/** The four answers, as the scheduler numbers them. */
export const GRADES = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
} as const
export type Grade = keyof typeof GRADES

type Scheduler = DefaultScheduler<'FSRS-7'>
type FsrsCard = Parameters<Scheduler['review']>[0]['card']

let scheduler: Promise<Scheduler> | null = null
// Fuzz is off, so the same answers always give the same schedule.
const getScheduler = () =>
  (scheduler ??= DefaultScheduler<'FSRS-7'>({
    version: 'FSRS-7',
    desiredRetention: SRS.desiredRetention,
    enableFuzz: false,
  }))

function toFsrs(card: VocabCard): FsrsCard {
  return {
    ...card.memory,
    state: card.state,
    reps: card.reps,
    lapses: card.lapses,
    dueAt: new Date(card.dueAt),
    lastReviewAt:
      card.lastReviewAt === null ? null : new Date(card.lastReviewAt),
  } as unknown as FsrsCard
}

function fromFsrs(
  fsrs: FsrsCard,
  base: Omit<
    VocabCard,
    'dueAt' | 'lastReviewAt' | 'state' | 'reps' | 'lapses' | 'memory'
  >,
): VocabCard {
  const { dueAt, lastReviewAt, state, reps, lapses, ...rest } =
    fsrs as unknown as {
      dueAt: Date
      lastReviewAt: Date | null
      state: number
      reps: number
      lapses: number
    } & Record<string, number | string | null>
  return {
    ...base,
    dueAt: dueAt.getTime(),
    lastReviewAt: lastReviewAt === null ? null : lastReviewAt.getTime(),
    state,
    reps,
    lapses,
    memory: rest,
  }
}

export const cardId = (wordId: string, direction: CardDirection) =>
  `${wordId}:${direction}`

/** A card never answered, due now. */
export async function newCard(
  wordId: string,
  packId: string,
  direction: CardDirection,
  now: EpochMs,
): Promise<VocabCard> {
  const fsrs = (await getScheduler()).newCard({ now: new Date(now) })
  return fromFsrs(fsrs, {
    id: cardId(wordId, direction),
    wordId,
    packId,
    direction,
    correct: 0,
    createdAt: now,
    updatedAt: now,
  })
}

/** The card after answering it with `grade` at `now`. The input is not changed. */
export async function answer(
  card: VocabCard,
  grade: Grade,
  now: EpochMs,
): Promise<VocabCard> {
  const result = (await getScheduler()).review({
    card: toFsrs(card),
    grade: GRADES[grade],
    now: new Date(now),
  })
  return fromFsrs(result.card as FsrsCard, {
    ...card,
    correct: card.correct + (grade === 'again' ? 0 : 1),
    updatedAt: now,
  })
}

/** When the card would next be due for each answer, as milliseconds from now. */
export async function preview(
  card: VocabCard,
  now: EpochMs,
): Promise<Record<Grade, number>> {
  const result = {} as Record<Grade, number>
  for (const item of (await getScheduler()).preview({
    card: toFsrs(card),
    now: new Date(now),
  })) {
    const grade = (Object.keys(GRADES) as Grade[]).find(
      (g) => GRADES[g] === item.grade,
    )
    const due = (item.card as unknown as { dueAt: Date }).dueAt
    if (grade) result[grade] = due.getTime() - now
  }
  return result
}

/**
 * The directions a word should have once this card is answered: listening
 * opens after the first correct recognition, English to Swedish after two.
 */
export function unlockedDirections(recognition: VocabCard): CardDirection[] {
  if (recognition.direction !== 'sv-en') return []
  const open: CardDirection[] = []
  if (recognition.correct >= SRS.audioAfter) open.push('audio')
  if (recognition.correct >= SRS.englishToSwedishAfter) open.push('en-sv')
  return open
}

/** "<1 min", "10 min", "5 h", "4 days", "3 mo", for the answer buttons. */
export function formatInterval(ms: number): string {
  const minutes = ms / 60_000
  if (minutes < 1) return '<1 min'
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = minutes / 60
  if (hours < 24) return `${Math.round(hours)} h`
  const days = hours / 24
  if (days < 31)
    return `${Math.round(days)} ${Math.round(days) === 1 ? 'day' : 'days'}`
  const months = days / 30
  if (months < 12) return `${Math.round(months)} mo`
  return `${(days / 365).toFixed(1)} yr`
}

export interface QueueWord {
  wordId: string
  packId: string
}

export type Next =
  | { kind: 'review'; card: VocabCard }
  | { kind: 'new'; word: QueueWord }
  /** Nothing now, but a card in learning is due again at `at`. */
  | { kind: 'wait'; at: EpochMs }
  | { kind: 'done' }

/**
 * What to practise next. Every card answered counts towards the daily limit
 * of answers, new words included, so nothing is shown once it is reached.
 * Due cards come first, oldest due first. Then words never seen, in pack
 * order, within the daily new-word limit. A card in learning that is due
 * later today is waited for. `playable` leaves out cards that cannot be
 * practised right now, such as a listening card whose audio is not stored.
 */
export function nextUp(options: {
  cards: VocabCard[]
  /** Every word that may be practised, in order. */
  words: QueueWord[]
  now: EpochMs
  /** Today so far. */
  today: { reviews: number; newWords: number }
  /** When today ends, for learning cards. */
  endOfDay: EpochMs
  playable?: (card: VocabCard) => boolean
}): Next {
  const { cards, words, now, today, endOfDay, playable = () => true } = options
  if (today.reviews >= SRS.reviewsPerDay) return { kind: 'done' }
  const known = new Set(words.map((w) => w.wordId))
  const live = cards.filter((c) => known.has(c.wordId) && playable(c))
  const due = live
    .filter((c) => c.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt)
  if (due[0]) return { kind: 'review', card: due[0] }
  if (today.newWords < SRS.newWordsPerDay) {
    const started = new Set(cards.map((c) => c.wordId))
    const fresh = words.find((w) => !started.has(w.wordId))
    if (fresh) return { kind: 'new', word: fresh }
  }
  const later = live
    .filter((c) => c.dueAt > now && c.dueAt <= endOfDay && c.state !== 2)
    .sort((a, b) => a.dueAt - b.dueAt)[0]
  if (later) return { kind: 'wait', at: later.dueAt }
  return { kind: 'done' }
}

/** How many cards could still be practised today, within the answer limit. */
export function dueToday(dueCount: number, today: { reviews: number }): number {
  return Math.min(dueCount, Math.max(0, SRS.reviewsPerDay - today.reviews))
}
