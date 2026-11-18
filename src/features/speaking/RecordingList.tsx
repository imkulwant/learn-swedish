import { useEffect, useRef, useState } from 'react'
import {
  deleteRecording,
  getAudio,
  setStarred,
} from '../../data/repositories/recordings'
import { formatDayWithYear } from '../../domain/format'
import { toLocalDate } from '../../domain/dates'
import { formatDuration, speakingPercent } from '../../domain/speaking'
import type { Recording } from '../../domain/types'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'

/** Plays a stored recording, reading its sound only when shown. */
export function RecordingPlayer({ recording }: { recording: Recording }) {
  const audio = useRef<HTMLAudioElement>(null)
  const { id, mimeType } = recording
  useEffect(() => {
    let url: string | null = null
    let gone = false
    void getAudio(id).then((bytes) => {
      if (gone || !bytes || !audio.current) return
      url = URL.createObjectURL(new Blob([bytes], { type: mimeType }))
      audio.current.src = url
    })
    return () => {
      gone = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [id, mimeType])
  return (
    <audio
      ref={audio}
      controls
      preload="metadata"
      aria-label={`Your recording, ${formatDuration(recording.durationMs)}`}
      className="w-full"
    />
  )
}

/** Every recording of one task: play, star, delete, or open its review. */
export function RecordingList({
  recordings,
  onOpen,
}: {
  recordings: Recording[]
  onOpen: (id: string) => void
}) {
  const [deleting, setDeleting] = useState<Recording | null>(null)
  if (!recordings.length) return null
  return (
    <section aria-labelledby="recordings" className="flex flex-col gap-3">
      <h2 id="recordings" className="text-lg font-semibold">
        Your recordings
      </h2>
      <p className="text-sm text-muted">
        Recordings stay on this phone and are not in backups. Star the ones you
        want to keep: the clean-up in Settings never deletes them.
      </p>
      <ul className="flex flex-col gap-3">
        {recordings.map((r) => {
          const when = formatDayWithYear(toLocalDate(r.createdAt))
          return (
            <li
              key={r.id}
              aria-label={`Recording of ${when}`}
              className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3"
            >
              <p className="flex justify-between text-sm">
                <span>
                  {when} · {formatDuration(r.durationMs)}
                </span>
                <span className="text-muted">
                  {r.rubric
                    ? `Assessed · ${speakingPercent(r.rubric)}%`
                    : 'Not assessed'}
                </span>
              </p>
              <RecordingPlayer recording={r} />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  aria-pressed={r.starred}
                  onClick={() => void setStarred(r.id, !r.starred)}
                >
                  {r.starred ? '★ Starred' : '☆ Star'}
                </Button>
                {!r.rubric && (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => onOpen(r.id)}
                  >
                    Assess
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setDeleting(r)}>
                  Delete
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      <Dialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete this recording?"
      >
        <p className="text-muted">It cannot be brought back.</p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              if (deleting) void deleteRecording(deleting.id)
              setDeleting(null)
            }}
          >
            Delete
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setDeleting(null)}
          >
            Keep
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
