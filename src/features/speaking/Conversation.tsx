import { useEffect, useRef, useState } from 'react'
import { appUrl, type OfferedPair } from '../../data/content'
import {
  deletePairSession,
  setPairStarred,
} from '../../data/repositories/pairs'
import { toLocalDate } from '../../domain/dates'
import { formatDayWithYear } from '../../domain/format'
import { formatDuration, rubricShare } from '../../domain/speaking'
import type { PairSession } from '../../domain/types'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'

interface Part {
  who: 'partner' | 'you'
  text: string
  /** A served file, or the bytes of a recorded answer. */
  src: string | { audio: ArrayBuffer; mimeType: string }
}

/** The discussion in order: each partner line, then the answer to it. */
function partsOf(offered: OfferedPair, session: PairSession): Part[] {
  const parts: Part[] = []
  offered.topic.partner.forEach((line, i) => {
    parts.push({
      who: 'partner',
      text: line.text,
      src: appUrl(offered.turnAudio[i]!),
    })
    const answer = session.turns.find((t) => t.turn === i)
    if (answer)
      parts.push({
        who: 'you',
        text: `Your answer (${formatDuration(answer.durationMs)})`,
        src: answer,
      })
  })
  if (session.finishedAt !== null)
    parts.push({
      who: 'partner',
      text: offered.topic.closing.text,
      src: appUrl(offered.closingAudio),
    })
  return parts
}

/** Plays the whole discussion, one part after another. */
export function ConversationPlayer({
  offered,
  session,
}: {
  offered: OfferedPair
  session: PairSession
}) {
  const parts = partsOf(offered, session)
  const audio = useRef<HTMLAudioElement>(null)
  const urls = useRef<string[]>([])
  const [playing, setPlaying] = useState<number | null>(null)

  // Object URLs of the recorded answers live as long as the player.
  useEffect(() => {
    const made = parts.map((p) =>
      typeof p.src === 'string'
        ? p.src
        : URL.createObjectURL(
            new Blob([p.src.audio], { type: p.src.mimeType }),
          ),
    )
    urls.current = made
    return () =>
      made.forEach((u) => u.startsWith('blob:') && URL.revokeObjectURL(u))
    // The parts change only with the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  function play(index: number) {
    const element = audio.current
    if (!element || index >= urls.current.length) {
      setPlaying(null)
      return
    }
    element.src = urls.current[index]!
    setPlaying(index)
    element.play().catch(() => setPlaying(null))
  }

  return (
    <section aria-labelledby="conversation" className="flex flex-col gap-2">
      <h2 id="conversation" className="text-lg font-semibold">
        The conversation
      </h2>
      <audio
        ref={audio}
        onEnded={() => playing !== null && play(playing + 1)}
        className="hidden"
      />
      {playing === null ? (
        <Button onClick={() => play(0)}>Play the conversation</Button>
      ) : (
        <Button
          variant="secondary"
          onClick={() => {
            audio.current?.pause()
            setPlaying(null)
          }}
        >
          Stop
        </Button>
      )}
      <ol className="flex flex-col gap-2">
        {parts.map((part, i) => (
          <li
            key={i}
            aria-current={playing === i ? 'true' : undefined}
            className={`rounded-control border p-2 text-sm ${
              playing === i ? 'border-accent' : 'border-border'
            } ${part.who === 'you' ? 'ml-6' : 'mr-6'}`}
          >
            <span className="font-semibold">
              {part.who === 'partner' ? 'Partner: ' : 'You: '}
            </span>
            <span lang={part.who === 'partner' ? 'sv' : undefined}>
              {part.text}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Earlier discussions of a topic: listen, star, delete, assess. */
export function PairSessionList({
  sessions,
  onOpen,
}: {
  sessions: PairSession[]
  onOpen: (id: string) => void
}) {
  const [deleting, setDeleting] = useState<PairSession | null>(null)
  if (!sessions.length) return null
  return (
    <section aria-labelledby="sessions" className="flex flex-col gap-3">
      <h2 id="sessions" className="text-lg font-semibold">
        Your discussions
      </h2>
      <p className="text-sm text-muted">
        They stay on this phone and are not in backups. Starred ones are never
        deleted by the clean-up.
      </p>
      <ul className="flex flex-col gap-3">
        {sessions.map((s) => {
          const when = formatDayWithYear(toLocalDate(s.createdAt))
          return (
            <li
              key={s.id}
              aria-label={`Discussion of ${when}`}
              className="flex flex-col gap-2 rounded-card border border-border bg-surface p-3"
            >
              <p className="flex justify-between text-sm">
                <span>
                  {when} · {s.turns.length} answer
                  {s.turns.length === 1 ? '' : 's'}
                  {s.finishedAt === null && ' · stopped early'}
                </span>
                <span className="text-muted">
                  {s.rubric
                    ? `Assessed · ${rubricShare(s.rubric)}%`
                    : 'Not assessed'}
                </span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => onOpen(s.id)}
                >
                  {s.rubric ? 'Listen' : 'Listen and assess'}
                </Button>
                <Button
                  variant="secondary"
                  aria-pressed={s.starred}
                  onClick={() => void setPairStarred(s.id, !s.starred)}
                >
                  {s.starred ? '★ Starred' : '☆ Star'}
                </Button>
                <Button variant="ghost" onClick={() => setDeleting(s)}>
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
        title="Delete this discussion?"
      >
        <p className="text-muted">It cannot be brought back.</p>
        <div className="mt-4 flex gap-2">
          <Button
            variant="danger"
            className="flex-1"
            onClick={() => {
              if (deleting) void deletePairSession(deleting.id)
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
