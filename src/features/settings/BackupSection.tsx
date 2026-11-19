import { useLiveQuery } from 'dexie-react-hooks'
import { getSetting } from '../../data/repositories/settings'
import { toLocalDate } from '../../domain/dates'
import { formatDayWithYear } from '../../domain/format'
import { ImportBackup } from './ImportBackup'
import { SaveBackupButton } from './SaveBackupButton'

/** Save and restore progress. The only copy of it is on this device. */
export function BackupSection() {
  const lastBackupAt = useLiveQuery(() => getSetting('lastBackupAt'))

  return (
    <section
      aria-labelledby="backup-heading"
      className="flex flex-col gap-3 rounded-card bg-surface p-4"
    >
      <h2 id="backup-heading" className="text-sm text-muted">
        Backup
      </h2>
      <p className="text-lg font-semibold">
        {lastBackupAt === undefined
          ? 'Checking…'
          : lastBackupAt === null
            ? 'Never backed up'
            : `Last backup ${formatDayWithYear(toLocalDate(lastBackupAt))}`}
      </p>
      <p className="text-muted">
        Your progress lives only on this device. Save a backup to Files now and
        then, and use it to move to a new phone. The file holds your answers,
        words, texts and mock exams as readable text. Recordings are not
        included.
      </p>
      <SaveBackupButton />
      <ImportBackup />
    </section>
  )
}
