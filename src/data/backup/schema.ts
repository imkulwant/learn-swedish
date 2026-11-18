import { z } from 'zod'
import { ATTEMPT_SKILLS, LEVELS } from '../../domain/content/schema'
import { isLocalDate } from '../../domain/dates'
import type {
  Attempt,
  Setting,
  StudyDay,
  VocabCard,
  Writing,
} from '../../domain/types'
import { RUBRIC } from '../../domain/writing'

// Importing the content schema also sets Zod to jitless mode, which the
// Content-Security-Policy needs.

export const BACKUP_FORMAT = 'sfi-prep-backup'
/**
 * Version 2 adds word cards and study days, version 3 written texts. Older
 * files still import.
 */
export const BACKUP_SCHEMA_VERSION = 3

// The largest time a JavaScript Date can hold.
const MAX_DATE_MS = 8.64e15
const DAY_MS = 86_400_000
const epochMs = z.number().int().nonnegative().max(MAX_DATE_MS)
const shortId = z.string().min(1).max(200)
const localDate = z.string().refine(isLocalDate, 'Not a date (YYYY-MM-DD)')

const attempt = z
  .strictObject({
    id: shortId,
    itemId: shortId,
    packId: shortId,
    packVersion: z.number().int().min(1),
    level: z.enum(LEVELS),
    skill: z.enum(ATTEMPT_SKILLS),
    mode: z.enum(['drill', 'mock', 'placement']),
    score: z.number().nonnegative(),
    maxScore: z.number().positive(),
    selfMarked: z.boolean(),
    response: z.union([
      z.number(),
      z.string().max(2000),
      z.array(z.number().int().nonnegative().nullable()).max(50),
    ]),
    answeredAt: epochMs,
  })
  .refine((a) => a.score <= a.maxScore, 'score is above maxScore')

const setting = z.discriminatedUnion('key', [
  z.strictObject({
    key: z.literal('targetLevel'),
    value: z.enum(LEVELS),
    updatedAt: epochMs,
  }),
  z.strictObject({
    key: z.literal('examDate'),
    value: localDate.nullable(),
    updatedAt: epochMs,
  }),
  z.strictObject({
    key: z.literal('onboarded'),
    value: z.boolean(),
    updatedAt: epochMs,
  }),
  z.strictObject({
    key: z.literal('lastBackupAt'),
    value: epochMs.nullable(),
    updatedAt: epochMs,
  }),
  z.strictObject({
    key: z.literal('playbackRate'),
    value: z.union([z.literal(0.75), z.literal(1)]),
    updatedAt: epochMs,
  }),
])

const count = z.number().int().nonnegative().max(1_000_000)

/** Scheduler fields a card cannot be scheduled without. */
const MEMORY_NUMBERS = [
  'stability',
  'stabilityFast',
  'difficulty',
  'scheduledDays',
]

const card = z
  .strictObject({
    id: shortId,
    wordId: shortId,
    packId: shortId,
    direction: z.enum(['sv-en', 'audio', 'en-sv']),
    // A due time is meant to be in the future, so it is only bounded.
    dueAt: epochMs,
    lastReviewAt: epochMs.nullable(),
    state: z.number().int().min(0).max(3),
    reps: count,
    lapses: count,
    correct: count,
    memory: z
      .record(
        z.string().max(40),
        z.union([z.number(), z.string().max(100), z.null()]),
      )
      .refine((m) => Object.keys(m).length <= 30, 'too many fields'),
    createdAt: epochMs,
    updatedAt: epochMs,
  })
  .refine(
    (c) => c.id === `${c.wordId}:${c.direction}`,
    'card id does not match its word',
  )
  .refine(
    (c) =>
      MEMORY_NUMBERS.every((key) => {
        const value = c.memory[key]
        return typeof value === 'number' && Number.isFinite(value) && value >= 0
      }),
    'card memory is incomplete',
  )

const studyDay = z.strictObject({
  date: localDate,
  reviews: count,
  newWords: count,
})

const rubricScore = z.union([z.literal(0), z.literal(1), z.literal(2)])

const writing = z.strictObject({
  id: shortId,
  promptId: shortId,
  packId: shortId,
  packVersion: z.number().int().min(1),
  level: z.enum(LEVELS),
  text: z.string().max(20_000),
  createdAt: epochMs,
  updatedAt: epochMs,
  submittedAt: epochMs.nullable(),
  rubric: z
    .strictObject(
      Object.fromEntries(RUBRIC.map((c) => [c.id, rubricScore])) as Record<
        (typeof RUBRIC)[number]['id'],
        typeof rubricScore
      >,
    )
    .nullable(),
  assessedAt: epochMs.nullable(),
})

const header = {
  format: z.literal(BACKUP_FORMAT),
  exportedAt: epochMs,
  appVersion: z.string().min(1).max(50),
}

const backupV1 = z.strictObject({
  ...header,
  schemaVersion: z.literal(1),
  data: z.strictObject({
    attempts: z.array(attempt),
    settings: z.array(setting),
  }),
})

const backupV2 = z.strictObject({
  ...header,
  schemaVersion: z.literal(2),
  data: z.strictObject({
    attempts: z.array(attempt),
    settings: z.array(setting),
    cards: z.array(card),
    studyDays: z.array(studyDay),
  }),
})

export const backupSchema = z.strictObject({
  ...header,
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  data: z.strictObject({
    attempts: z.array(attempt),
    settings: z.array(setting),
    cards: z.array(card),
    studyDays: z.array(studyDay),
    writings: z.array(writing),
  }),
})

export interface BackupData {
  attempts: Attempt[]
  settings: Setting[]
  cards: VocabCard[]
  studyDays: StudyDay[]
  writings: Writing[]
}

export interface Backup {
  format: typeof BACKUP_FORMAT
  schemaVersion: typeof BACKUP_SCHEMA_VERSION
  exportedAt: number
  appVersion: string
  data: BackupData
}

export type ParseResult =
  { ok: true; backup: Backup } | { ok: false; error: string }

/** Larger files are refused before they are read. A year of practice is far smaller. */
export const MAX_BACKUP_BYTES = 20 * 1024 * 1024

/**
 * Reads the text of a backup file. Nothing is written here: the result says
 * whether the file is one this app wrote and holds together, and why not.
 */
/** The latest time a file may name: a clock a day fast still passes. */
const latestAllowed = (now: number) => now + DAY_MS

/** Keeps text from the file short when it is echoed in a message. */
const clip = (text: string) =>
  text.length > 120 ? `${text.slice(0, 117)}…` : text

export function parseBackup(
  text: string,
  now: number = Date.now(),
): ParseResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This is not a backup file (it is not JSON).' }
  }
  const version = (json as { schemaVersion?: unknown } | null)?.schemaVersion
  const parsed =
    version === 1
      ? backupV1
          .transform((v1) => ({
            ...v1,
            schemaVersion: BACKUP_SCHEMA_VERSION,
            data: { ...v1.data, cards: [], studyDays: [], writings: [] },
          }))
          .safeParse(json)
      : version === 2
        ? backupV2
            .transform((v2) => ({
              ...v2,
              schemaVersion: BACKUP_SCHEMA_VERSION,
              data: { ...v2.data, writings: [] },
            }))
            .safeParse(json)
        : backupSchema.safeParse(json)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const where = issue?.path.length ? ` at ${issue.path.join('.')}` : ''
    return {
      ok: false,
      error: clip(
        `This is not a valid backup${where}: ${issue?.message ?? 'unknown problem'}.`,
      ),
    }
  }
  const backup = parsed.data as Backup
  // A time in the future would show as a wrong date, hide the backup reminder
  // or win every later merge.
  const times = [
    backup.exportedAt,
    ...backup.data.attempts.map((a) => a.answeredAt),
    ...backup.data.cards.flatMap((c) => [
      c.createdAt,
      c.updatedAt,
      c.lastReviewAt ?? 0,
    ]),
    ...backup.data.writings.flatMap((w) => [
      w.createdAt,
      w.updatedAt,
      w.submittedAt ?? 0,
      w.assessedAt ?? 0,
    ]),
    ...backup.data.settings.flatMap((s) =>
      s.key === 'lastBackupAt' && s.value !== null
        ? [s.updatedAt, s.value as number]
        : [s.updatedAt],
    ),
  ]
  if (times.some((t) => t > latestAllowed(now)))
    return { ok: false, error: 'The backup has dates in the future.' }
  const ids = new Set<string>()
  for (const a of backup.data.attempts) {
    if (ids.has(a.id))
      return {
        ok: false,
        error: clip(`The backup repeats the answer id ${a.id}.`),
      }
    ids.add(a.id)
  }
  const keys = backup.data.settings.map((s) => s.key)
  if (new Set(keys).size !== keys.length)
    return { ok: false, error: 'The backup repeats a setting.' }
  const cardIds = backup.data.cards.map((c) => c.id)
  if (new Set(cardIds).size !== cardIds.length)
    return { ok: false, error: 'The backup repeats a word card.' }
  const writingIds = backup.data.writings.map((w) => w.id)
  if (new Set(writingIds).size !== writingIds.length)
    return { ok: false, error: 'The backup repeats a text.' }
  const dates = backup.data.studyDays.map((d) => d.date)
  if (new Set(dates).size !== dates.length)
    return { ok: false, error: 'The backup repeats a study day.' }
  return { ok: true, backup }
}
