import type { EpochMs } from './types.ts'

/** Progress left unsaved for longer than this makes a backup overdue. */
export const BACKUP_OVERDUE_DAYS = 14

const DAY_MS = 86_400_000

/**
 * A backup is overdue when the oldest answer not in any backup is more than
 * 14 days old. Nothing unsaved means nothing to nag about, however long ago
 * the last backup was.
 */
export function backupOverdue(options: {
  /** The oldest answer given after the last backup, or null with none. */
  oldestUnsavedAt: EpochMs | null
  now: EpochMs
}): boolean {
  const { oldestUnsavedAt, now } = options
  return (
    oldestUnsavedAt !== null &&
    now - oldestUnsavedAt > BACKUP_OVERDUE_DAYS * DAY_MS
  )
}
