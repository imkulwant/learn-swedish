import { db } from '../db'
import type { Backup } from './schema'

export interface BackupSummary {
  answers: number
  /** Words started. */
  words: number
  /** Texts written. */
  writings: number
  /** First and last day an answer was given, or null with none. */
  firstAt: number | null
  lastAt: number | null
  exportedAt: number
  appVersion: string
}

/** What a file holds, shown before anything is written. */
export function summariseBackup(backup: Backup): BackupSummary {
  const times = backup.data.attempts
    .map((a) => a.answeredAt)
    .sort((a, b) => a - b)
  return {
    answers: times.length,
    words: new Set(backup.data.cards.map((c) => c.wordId)).size,
    writings: backup.data.writings.length,
    firstAt: times[0] ?? null,
    lastAt: times[times.length - 1] ?? null,
    exportedAt: backup.exportedAt,
    appVersion: backup.appVersion,
  }
}

/**
 * Adds a backup to what is stored. Answers never change once given, so only
 * answers this device lacks are added. For a setting in both, the newer one
 * wins, and a tie keeps the stored one. The time of the last backup is never
 * taken from the file. A written text keeps its latest change. One transaction: if any write fails,
 * nothing changes. Returns how many records were written.
 */
export async function mergeBackup(backup: Backup): Promise<number> {
  const tables = [db.attempts, db.settings, db.cards, db.studyDays, db.writings]
  return db.transaction('rw', tables, async () => {
    const { attempts, settings, cards, studyDays, writings } = backup.data
    const stored = await db.attempts.bulkGet(attempts.map((a) => a.id))
    const missing = attempts.filter((_, i) => !stored[i])
    await db.attempts.bulkAdd(missing)

    // This device's own last backup stays: another device's backup says
    // nothing about the answers given here.
    const incoming = settings.filter((s) => s.key !== 'lastBackupAt')
    const storedSettings = await db.settings.bulkGet(incoming.map((s) => s.key))
    const newer = incoming.filter(
      (s, i) =>
        !storedSettings[i] || s.updatedAt > storedSettings[i]!.updatedAt,
    )
    await db.settings.bulkPut(newer)

    // A word card with more answers knows more; a tie keeps the stored one.
    const storedCards = await db.cards.bulkGet(cards.map((c) => c.id))
    const moreAnswered = cards.filter(
      (c, i) => !storedCards[i] || c.reps > storedCards[i]!.reps,
    )
    await db.cards.bulkPut(moreAnswered)

    // Study days keep the larger count of each, so no day loses practice.
    const storedDays = await db.studyDays.bulkGet(studyDays.map((d) => d.date))
    const days = studyDays.map((d, i) => {
      const here = storedDays[i]
      return here
        ? {
            date: d.date,
            reviews: Math.max(d.reviews, here.reviews),
            newWords: Math.max(d.newWords, here.newWords),
          }
        : d
    })
    await db.studyDays.bulkPut(days)

    // A text changes until it is assessed: the later change wins, and a tie
    // keeps the stored one.
    const storedWritings = await db.writings.bulkGet(writings.map((w) => w.id))
    const laterWritings = writings.filter(
      (w, i) =>
        !storedWritings[i] || w.updatedAt > storedWritings[i]!.updatedAt,
    )
    await db.writings.bulkPut(laterWritings)
    return (
      missing.length + newer.length + moreAnswered.length + laterWritings.length
    )
  })
}

/** Swaps everything stored for the contents of a backup, in one transaction. */
export async function replaceWithBackup(backup: Backup): Promise<void> {
  const tables = [db.attempts, db.settings, db.cards, db.studyDays, db.writings]
  await db.transaction('rw', tables, async () => {
    for (const table of tables) await table.clear()
    await db.attempts.bulkAdd(backup.data.attempts)
    await db.settings.bulkPut(backup.data.settings)
    await db.cards.bulkAdd(backup.data.cards)
    await db.studyDays.bulkAdd(backup.data.studyDays)
    await db.writings.bulkAdd(backup.data.writings)
  })
}
