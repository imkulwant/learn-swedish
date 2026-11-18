import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import {
  deleteOldRecordings,
  recordingUsage,
} from '../../data/repositories/recordings'
import { formatBytes } from '../../domain/format'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'

/** How long a recording stays before the clean-up offers to delete it. */
export const KEEP_RECORDINGS_DAYS = 30

/** Recordings take the most space; they can be cleaned up here. */
export function RecordingsSection() {
  const usage = useLiveQuery(() => recordingUsage())
  const [asking, setAsking] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function cleanUp() {
    setAsking(false)
    const deleted = await deleteOldRecordings(
      Date.now() - KEEP_RECORDINGS_DAYS * 86_400_000,
    )
    setMessage(
      deleted
        ? `${deleted} recording${deleted === 1 ? '' : 's'} deleted.`
        : 'There were no old recordings to delete.',
    )
  }

  return (
    <section
      aria-labelledby="recordings-heading"
      className="flex flex-col gap-2 rounded-card bg-surface p-4"
    >
      <h2 id="recordings-heading" className="text-sm text-muted">
        Recordings
      </h2>
      <p>
        {usage
          ? `${usage.count} recording${usage.count === 1 ? '' : 's'} · ${formatBytes(usage.bytes)}`
          : '…'}
      </p>
      <p className="text-sm text-muted">
        Recordings stay on this phone and are not in backups. The clean-up
        deletes recordings older than {KEEP_RECORDINGS_DAYS} days, except
        starred ones.
      </p>
      <Button
        variant="secondary"
        disabled={!usage?.count}
        onClick={() => setAsking(true)}
      >
        Delete old recordings
      </Button>
      {message && <p role="status">{message}</p>}
      <Dialog
        open={asking}
        onClose={() => setAsking(false)}
        title="Delete old recordings?"
      >
        <p className="text-muted">
          Recordings older than {KEEP_RECORDINGS_DAYS} days are deleted for
          good. Starred recordings are kept.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => void cleanUp()}
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setAsking(false)}
          >
            Cancel
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
