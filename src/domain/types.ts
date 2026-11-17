import type { Level, Skill } from './content/schema.ts'

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
  skill: Skill
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
