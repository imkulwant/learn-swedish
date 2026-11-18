import { useRef, useState } from 'react'
import {
  mergeBackup,
  replaceWithBackup,
  summariseBackup,
} from '../../data/backup/import'
import {
  MAX_BACKUP_BYTES,
  parseBackup,
  type Backup,
} from '../../data/backup/schema'
import { toLocalDate } from '../../domain/dates'
import { formatDayWithYear } from '../../domain/format'
import { dataMarker } from '../../platform/dataMarker'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/Toast'
import { SaveBackupButton } from './SaveBackupButton'

export interface ImportBackupProps {
  /** Called after a merge or replace succeeded. */
  onImported?: () => void
  /** Label of the button that picks the file. */
  label?: string
}

/**
 * Pick a backup file, look at what is in it, then merge or replace. The file
 * is checked completely before the preview, and nothing is written until a
 * button is tapped.
 */
export function ImportBackup({
  onImported,
  label = 'Import backup',
}: ImportBackupProps) {
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [backup, setBackup] = useState<Backup | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [busy, setBusy] = useState(false)

  const summary = backup ? summariseBackup(backup) : null

  async function choose(file: File | undefined) {
    if (!file) return
    setError(null)
    if (file.size > MAX_BACKUP_BYTES) {
      setError('This file is too large to be a backup. Nothing was changed.')
      return
    }
    let text: string
    try {
      text = await file.text()
    } catch {
      setError('The file could not be read. Nothing was changed.')
      return
    }
    const result = parseBackup(text)
    if (!result.ok) {
      setError(`${result.error} Nothing was changed.`)
      return
    }
    setBackup(result.backup)
  }

  function close() {
    setBackup(null)
    setConfirmReplace(false)
  }

  async function apply(mode: 'merge' | 'replace') {
    if (!backup) return
    setBusy(true)
    try {
      if (mode === 'merge') {
        const written = await mergeBackup(backup)
        toast.show({ message: `Merged: ${written} records added or updated` })
      } else {
        await replaceWithBackup(backup)
        toast.show({ message: 'Backup restored' })
      }
      // The marker says "this device held progress". After a replace with an
      // empty backup it holds none, so an empty database is not a loss.
      if (summary && summary.answers + summary.words > 0) dataMarker.mark()
      else if (mode === 'replace') dataMarker.clear()
      close()
      onImported?.()
    } catch (caught) {
      close()
      setError(
        `The backup could not be applied, and nothing was changed (${
          caught instanceof Error ? caught.message : 'unknown error'
        }).`,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant="secondary" onClick={() => input.current?.click()}>
        {label}
      </Button>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        aria-label="Backup file"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          void choose(event.target.files?.[0])
          // The same file can then be chosen again.
          event.target.value = ''
        }}
      />
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}

      <Sheet open={summary !== null} onClose={close} title="Import backup">
        {summary && (
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-2 gap-2">
              <Count label="Answers" value={summary.answers} />
              <Count label="Words" value={summary.words} />
            </dl>
            <p className="text-muted">
              {summary.firstAt !== null && summary.lastAt !== null
                ? `Practice from ${formatDayWithYear(toLocalDate(summary.firstAt))} to ${formatDayWithYear(toLocalDate(summary.lastAt))}. `
                : 'No practice yet. '}
              Saved {formatDayWithYear(toLocalDate(summary.exportedAt))} by
              version {summary.appVersion}.
            </p>
            <Button disabled={busy} onClick={() => void apply('merge')}>
              Merge with what is here
            </Button>
            <p className="-mt-2 text-sm text-muted">
              Keeps both. For a record in both, the newer edit wins.
            </p>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => setConfirmReplace(true)}
            >
              Replace everything
            </Button>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
          </div>
        )}
      </Sheet>

      <Dialog
        open={confirmReplace}
        onClose={() => setConfirmReplace(false)}
        title="Replace everything?"
      >
        <p className="mb-4 text-muted">
          All progress on this device is deleted, and the backup takes its
          place. Save a copy of what is here first if you may want it back.
        </p>
        <div className="flex flex-col gap-2">
          <SaveBackupButton label="Save a copy first" variant="secondary" />
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => void apply('replace')}
          >
            Replace
          </Button>
          <Button variant="ghost" onClick={() => setConfirmReplace(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </>
  )
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col rounded-card bg-surface-2 p-3">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  )
}
