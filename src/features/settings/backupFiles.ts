import { APP_VERSION } from '../../app/version'
import {
  backupFileName,
  buildBackup,
  serializeBackup,
} from '../../data/backup/export'
import { setSetting } from '../../data/repositories/settings'

/** The whole database as a `.json` file, ready to hand to the learner. */
export async function makeBackupFile(now: number = Date.now()): Promise<File> {
  const backup = await buildBackup(APP_VERSION, now)
  return new File([serializeBackup(backup)], backupFileName(now), {
    type: 'application/json',
  })
}

/** Remembers that a backup reached the learner, for the overdue reminder. */
export function recordBackupSaved(now: number = Date.now()): Promise<void> {
  return setSetting('lastBackupAt', now)
}
