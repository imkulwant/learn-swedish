import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { oldestAttemptSince } from '../../data/repositories/attempts'
import { getSetting } from '../../data/repositories/settings'
import { backupOverdue } from '../../domain/backupReminder'

/** Asks for a backup once an answer has gone unsaved for two weeks. */
export function BackupReminder() {
  const overdue = useLiveQuery(async () =>
    backupOverdue({
      oldestUnsavedAt: await oldestAttemptSince(
        await getSetting('lastBackupAt'),
      ),
      now: Date.now(),
    }),
  )
  if (!overdue) return null
  return (
    <section
      aria-label="Backup reminder"
      className="flex flex-col gap-1 rounded-card border border-warning bg-surface p-4"
    >
      <p className="font-semibold">Time for a backup</p>
      <p className="text-sm text-muted">
        Your progress is only on this device.{' '}
        <Link to="/settings" className="font-semibold text-accent">
          Save a backup in Settings
        </Link>
      </p>
    </section>
  )
}
