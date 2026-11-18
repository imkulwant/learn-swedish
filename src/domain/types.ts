import type { AttemptSkill, Level } from './content/schema.ts'
import type { SpeakingRubric } from './speaking.ts'
import type { Rubric } from './writing.ts'

export type Id = string
export type EpochMs = number
export type LocalDate = string

export type AttemptMode = 'drill' | 'mock' | 'placement'

/** One scored answer to one content item. */
export interface Attempt {
  id: Id
  itemId: string
  packId: string
  /** The pack version the item came from, so later content edits never rewrite history. */
  packVersion: number
  level: Level
  skill: AttemptSkill
  mode: AttemptMode
  score: number
  maxScore: number
  /** True when the learner judged an open answer against the model answer. */
  selfMarked: boolean
  /** What was answered, kept for review: an option index, text, or one index per pair. */
  response: number | string | (number | null)[]
  answeredAt: EpochMs
}

export interface Setting {
  key: string
  value: unknown
  updatedAt: EpochMs
}

/** The three ways a word is practised, unlocked in this order. */
export type CardDirection = 'sv-en' | 'audio' | 'en-sv'

/**
 * One word practised one way, with its spaced-repetition memory. Times are
 * epoch milliseconds, so the row can be stored and backed up as is; the
 * scheduler's own fields are kept in `memory` without its dates.
 */
export interface VocabCard {
  /** `<word id>:<direction>`. */
  id: string
  wordId: string
  packId: string
  direction: CardDirection
  dueAt: EpochMs
  lastReviewAt: EpochMs | null
  /** FSRS state: 0 new, 1 learning, 2 review, 3 relearning. */
  state: number
  reps: number
  lapses: number
  /** Answers rated Hard, Good or Easy. Unlocks the next direction. */
  correct: number
  /** The rest of the scheduler's card, minus its dates. */
  memory: Record<string, number | string | null>
  createdAt: EpochMs
  updatedAt: EpochMs
}

/** What happened on one local day, for daily limits and streaks. */
export interface StudyDay {
  date: LocalDate
  /** Cards answered. */
  reviews: number
  /** Words seen for the first time. */
  newWords: number
}

/**
 * One text written for one writing prompt. It is a draft until submitted;
 * after that the text is fixed and the learner assesses it against the rubric.
 */
export interface Writing {
  id: Id
  promptId: string
  packId: string
  packVersion: number
  level: Level
  text: string
  createdAt: EpochMs
  /** The last change of any kind: text, submission or assessment. */
  updatedAt: EpochMs
  submittedAt: EpochMs | null
  rubric: Rubric | null
  assessedAt: EpochMs | null
}

/**
 * One spoken answer to a speaking task, kept on this device only: recordings
 * are not in backups. The audio is stored as bytes, not as a Blob, because
 * WebKit cannot store a Blob in IndexedDB in a private session.
 */
export interface Recording {
  id: Id
  taskId: string
  packId: string
  packVersion: number
  level: Level
  createdAt: EpochMs
  durationMs: number
  mimeType: string
  audio: ArrayBuffer
  /** A starred recording is never deleted by the clean-up. */
  starred: boolean
  rubric: SpeakingRubric | null
  assessedAt: EpochMs | null
}
