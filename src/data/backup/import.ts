import { db } from '../db'
import type { Backup } from './schema'

export interface BackupSummary {
  answers: number
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
 * taken from the file. One transaction: if any write fails,
 * nothing changes. Returns how many records were written.
 */
export async function mergeBackup(backup: Backup): Promise<number> {
  return db.transaction('rw', [db.attempts, db.settings], async () => {
    const { attempts, settings } = backup.data
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
    return missing.length + newer.length
  })
}

/** Swaps everything stored for the contents of a backup, in one transaction. */
export async function replaceWithBackup(backup: Backup): Promise<void> {
  await db.transaction('rw', [db.attempts, db.settings], async () => {
    await db.attempts.clear()
    await db.settings.clear()
    await db.attempts.bulkAdd(backup.data.attempts)
    await db.settings.bulkPut(backup.data.settings)
  })
}
