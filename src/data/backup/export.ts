import { toLocalDate } from '../../domain/dates'
import { db } from '../db'
import { BACKUP_FORMAT, BACKUP_SCHEMA_VERSION, type Backup } from './schema'

/**
 * Everything the app stores so far, as one object, read in one transaction.
 * The file records itself as the last backup, so a device restored from it
 * does not ask for a backup of answers the file already holds.
 */
export async function buildBackup(
  appVersion: string,
  now: number = Date.now(),
): Promise<Backup> {
  const data = await db.transaction(
    'r',
    [db.attempts, db.settings, db.cards, db.studyDays, db.writings],
    async () => ({
      attempts: await db.attempts.toArray(),
      settings: [
        ...(await db.settings.toArray()).filter(
          (s) => s.key !== 'lastBackupAt',
        ),
        { key: 'lastBackupAt', value: now, updatedAt: now },
      ],
      cards: await db.cards.toArray(),
      studyDays: await db.studyDays.toArray(),
      writings: await db.writings.toArray(),
    }),
  )
  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now,
    appVersion,
    data,
  }
}

export const serializeBackup = (backup: Backup): string =>
  JSON.stringify(backup)

/** `sfi-prep-2026-11-17.json`, dated on the device's clock. */
export function backupFileName(now: number = Date.now()): string {
  return `sfi-prep-${toLocalDate(now)}.json`
}
