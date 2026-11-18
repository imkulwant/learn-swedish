import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { appUrl, type OfferedVocab } from '../../data/content'
import {
  answerCard,
  getStudyDay,
  listCards,
  startWord,
} from '../../data/repositories/vocab'
import { toLocalDate } from '../../domain/dates'
import { formatInterval, nextUp, preview, type Grade } from '../../domain/srs'
import type { VocabCard } from '../../domain/types'
import { cachedSet, storeAll } from '../../platform/audioCache'
import { dataMarker } from '../../platform/dataMarker'
import { reportStorageFailure } from '../../platform/storageFailure'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useOfferedVocab } from './useOfferedVocab'
import { WordCard } from './WordCard'

const GRADE_LABELS: [Grade, string][] = [
  ['again', 'Again'],
  ['hard', 'Hard'],
  ['good', 'Good'],
  ['easy', 'Easy'],
]

interface Current {
  card: VocabCard
  isNew: boolean
  intervals: Record<Grade, number>
}

/** The time, read in event handlers only; never during render. */
const clock = () => Date.now()

const endOfDay = (now: number) => {
  const d = new Date(now)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

/** Works through due and new words one card at a time. */
function Session({ vocab }: { vocab: OfferedVocab }) {
  const [current, setCurrent] = useState<Current | null>(null)
  // What to show when no card is up. A wait carries its length, found when
  // the session advanced, so render never reads the clock.
  const [after, setAfter] = useState<
    { kind: 'done' } | { kind: 'wait'; inMs: number } | null
  >(null)
  const [revealed, setRevealed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [answered, setAnswered] = useState(0)
  // Focus follows the card, so keyboard and screen-reader users stay with it.
  const cardRef = useRef<HTMLDivElement>(null)
  const gradesRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (revealed)
      gradesRef.current
        ?.querySelector<HTMLElement>('[data-grade="good"]')
        ?.focus()
    else if (current) cardRef.current?.focus()
  }, [current, revealed])

  /**
   * Stores every word's audio, so listening cards work offline later. Waits
   * at most a few seconds, so a slow connection never holds practice up.
   */
  async function fetchAudio() {
    const stored = storeAll(vocab.words.map((w) => appUrl(w.audioPath))).catch(
      () => {},
    )
    await Promise.race([
      stored,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ])
  }

  // Reads the database each time, so the next card is always the true one.
  async function advance() {
    setBusy(true)
    setFailed(false)
    try {
      const now = clock()
      const [cards, today, stored] = await Promise.all([
        listCards(),
        getStudyDay(toLocalDate(now)),
        cachedSet(vocab.words.map((w) => appUrl(w.audioPath))).catch(
          () => new Set<string>(),
        ),
      ])
      const next = nextUp({
        cards,
        words: vocab.words,
        now,
        today,
        endOfDay: endOfDay(now),
        // A listening card waits until its audio is on the device.
        playable: (c) =>
          c.direction !== 'audio' ||
          stored.has(appUrl(vocab.byId.get(c.wordId)?.audioPath ?? '')),
      })
      if (next.kind === 'review' || next.kind === 'new') {
        const card =
          next.kind === 'new' ? await startWord(next.word, now) : next.card
        dataMarker.mark()
        setCurrent({
          card,
          isNew: next.kind === 'new',
          intervals: await preview(card, now),
        })
        setAfter(null)
      } else {
        setCurrent(null)
        setAfter(
          next.kind === 'wait'
            ? { kind: 'wait', inMs: next.at - now }
            : { kind: 'done' },
        )
      }
      setRevealed(false)
    } catch (error) {
      reportStorageFailure(error)
      // The card on screen may already be answered: offer a fresh start.
      setCurrent(null)
      setAfter(null)
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  async function grade(g: Grade) {
    if (!current || busy) return
    setBusy(true)
    setFailed(false)
    try {
      const saved = await answerCard(current.card, g, clock())
      // Counted only when this answer was the one stored, not a repeat.
      if (saved.reps === current.card.reps + 1) setAnswered((n) => n + 1)
    } catch (error) {
      reportStorageFailure(error)
      setFailed(true)
      setBusy(false)
      return
    }
    await advance()
  }

  const error = failed && (
    <p role="alert" className="text-danger">
      That could not be saved. Try again.
    </p>
  )

  if (!current) {
    return (
      <div className="flex flex-col gap-4">
        {after?.kind === 'done' && (
          <EmptyState
            title={answered ? 'Done for today' : 'Nothing to practise now'}
            description={
              answered
                ? `You answered ${answered} ${answered === 1 ? 'card' : 'cards'}. New words and reviews come back tomorrow.`
                : 'All words are learned for today. Come back tomorrow.'
            }
            action={
              <Link to="/learn" className="font-semibold text-accent">
                Back to Learn
              </Link>
            }
          />
        )}
        {after?.kind === 'wait' && (
          <EmptyState
            title="Take a short break"
            description={`A word you are learning comes back in ${formatInterval(after.inMs)}.`}
            action={
              <Button disabled={busy} onClick={() => void advance()}>
                Check again
              </Button>
            }
          />
        )}
        {!after && (
          <>
            <p className="text-muted">
              Words are shown in Swedish first. Once you know one, you also hear
              it, then say it from English. Rate how well you knew each card:
              the app brings it back just before you would forget it.
            </p>
            <Button
              disabled={busy}
              onClick={() => {
                setBusy(true)
                void fetchAudio().then(advance)
              }}
            >
              {failed ? 'Try again' : 'Start'}
            </Button>
          </>
        )}
        {error}
      </div>
    )
  }

  const offered = vocab.byId.get(current.card.wordId)!
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {current.isNew ? 'New word' : 'Review'} · {answered} answered
      </p>
      <div ref={cardRef} tabIndex={-1} className="outline-none">
        <WordCard
          key={current.card.id}
          word={offered.word}
          direction={current.card.direction}
          audioPath={offered.audioPath}
          revealed={revealed}
        />
      </div>
      {revealed ? (
        <div
          ref={gradesRef}
          role="group"
          aria-label="How well did you know it?"
          className="grid grid-cols-4 gap-2"
        >
          {GRADE_LABELS.map(([g, label]) => (
            <Button
              key={g}
              data-grade={g}
              variant={
                g === 'again'
                  ? 'danger'
                  : g === 'good'
                    ? 'primary'
                    : 'secondary'
              }
              disabled={busy}
              onClick={() => void grade(g)}
              className="flex-col !gap-0 px-1"
            >
              <span>{label}</span>
              <span className="text-xs font-normal">
                {formatInterval(current.intervals[g])}
              </span>
            </Button>
          ))}
        </div>
      ) : (
        <Button disabled={busy} onClick={() => setRevealed(true)}>
          Show answer
        </Button>
      )}
      {error}
    </div>
  )
}

export function VocabScreen() {
  const offered = useOfferedVocab()
  return (
    <Screen title="Words" back="/learn">
      {offered.status === 'loading' && <Loading />}
      {offered.status === 'error' && (
        <EmptyState
          title="Words could not be loaded"
          description={offered.message}
        />
      )}
      {offered.status === 'ready' &&
        (offered.value.words.length ? (
          <Session vocab={offered.value} />
        ) : (
          <EmptyState
            title="No words yet"
            description="Word packs appear here once a reviewer has checked them."
          />
        ))}
    </Screen>
  )
}
