import { useEffect, useRef, useState } from 'react'
import { appUrl, type PartnerScript } from '../../data/content'
import {
  deletePairSession,
  setPairStarred,
} from '../../data/repositories/pairs'
import { getAudio } from '../../data/repositories/recordings'
import { toLocalDate } from '../../domain/dates'
import { formatDayWithYear } from '../../domain/format'
import { formatDuration, rubricShare } from '../../domain/speaking'
import type { PairSession } from '../../domain/types'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'

const revoke = (url: string) =>
  url.startsWith('blob:') && URL.revokeObjectURL(url)

interface Part {
  who: 'partner' | 'you'
  text: string
  /** A served file, or the stored sound of a recorded answer. */
  src: string | { audioId: string; mimeType: string }
}

/** The discussion in order: each partner line, then the answer to it. */
function partsOf(script: PartnerScript, session: PairSession): Part[] {
  const parts: Part[] = []
  script.partner.forEach((line, i) => {
    parts.push({
      who: 'partner',
      text: line.text,
      src: appUrl(script.turnAudio[i]!),
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
      text: script.closing.text,
      src: appUrl(script.closingAudio),
    })
  return parts
}

/** Plays the whole discussion, one part after another. */
export function ConversationPlayer({
  script,
  session,
}: {
  script: PartnerScript
  session: PairSession
}) {
  const parts = partsOf(script, session)
  const audio = useRef<HTMLAudioElement>(null)
  const urlsRef = useRef<string[]>([])
  const [playing, setPlaying] = useState<number | null>(null)

  // The answers' sound is read once per set of answers, not again when the
  // session is starred or assessed. Their object URLs live as long as that.
  const answersKey = `${session.id}:${session.turns.length}:${session.finishedAt}`
  useEffect(() => {
    let gone = false
    let made: string[] = []
    void Promise.all(
      parts.map(async (p) => {
        if (typeof p.src === 'string') return p.src
        const bytes = await getAudio(p.src.audioId)
        return bytes
          ? URL.createObjectURL(new Blob([bytes], { type: p.src.mimeType }))
          : ''
      }),
    ).then((urls) => {
      made = urls
      if (gone) urls.forEach(revoke)
      else urlsRef.current = urls
    })
    return () => {
      gone = true
      made.forEach(revoke)
    }
    // The parts change only with the answers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answersKey])

  function play(index: number) {
    const element = audio.current
    // An answer whose sound is gone is skipped.
    while (index < urlsRef.current.length && !urlsRef.current[index]) index++
    if (!element || index >= urlsRef.current.length) {
      setPlaying(null)
      return
    }
    element.src = urlsRef.current[index]!
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
              playing === i ? 'border-accent-fg' : 'border-border'
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
  assessed = true,
}: {
  sessions: PairSession[]
  onOpen: (id: string) => void
  /** False for role-plays, which have no self-assessment. */
  assessed?: boolean
}) {
  const [deleting, setDeleting] = useState<PairSession | null>(null)
  if (!sessions.length) return null
  return (
    <section aria-labelledby="sessions" className="flex flex-col gap-3">
      <h2 id="sessions" className="text-lg font-semibold">
        {assessed ? 'Your discussions' : 'Your role-plays'}
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
                {assessed && (
                  <span className="text-muted">
                    {s.rubric
                      ? `Assessed · ${rubricShare(s.rubric)}%`
                      : 'Not assessed'}
                  </span>
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => onOpen(s.id)}
                >
                  {s.rubric || !assessed ? 'Listen' : 'Listen and assess'}
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
        title="Delete this conversation?"
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
