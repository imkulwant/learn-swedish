import { z } from 'zod'
import { LEVELS, SKILLS } from '../../domain/content/schema'
import { isLocalDate } from '../../domain/dates'
import type { Attempt, Setting } from '../../domain/types'

// Importing the content schema also sets Zod to jitless mode, which the
// Content-Security-Policy needs.

export const BACKUP_FORMAT = 'sfi-prep-backup'
export const BACKUP_SCHEMA_VERSION = 1

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
    skill: z.enum(SKILLS),
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
])

export const backupSchema = z.strictObject({
  format: z.literal(BACKUP_FORMAT),
  schemaVersion: z.literal(BACKUP_SCHEMA_VERSION),
  exportedAt: epochMs,
  appVersion: z.string().min(1).max(50),
  data: z.strictObject({
    attempts: z.array(attempt),
    settings: z.array(setting),
  }),
})

export interface BackupData {
  attempts: Attempt[]
  settings: Setting[]
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
  const parsed = backupSchema.safeParse(json)
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
  return { ok: true, backup }
}
