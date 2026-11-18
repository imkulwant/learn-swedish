import { useEffect, useRef, useState } from 'react'
import { appUrl, type PartnerScript } from '../../data/content'
import { addPairTurn, finishPairSession } from '../../data/repositories/pairs'
import { formatDuration } from '../../domain/speaking'
import {
  RecorderFailure,
  startRecording,
  type ActiveRecording,
} from '../../platform/recorder'
import { reportStorageFailure } from '../../platform/storageFailure'
import { dataMarker } from '../../platform/dataMarker'
import { Button } from '../../ui/Button'
import { useNow } from '../../ui/useNow'

type Phase =
  | { name: 'idle' }
  | { name: 'partner'; turn: number }
  | { name: 'answer'; turn: number }
  | { name: 'starting'; turn: number }
  | { name: 'recording'; turn: number; active: ActiveRecording }
  | { name: 'saving'; turn: number }
  | { name: 'closing' }

const MIC_ERRORS: Record<RecorderFailure['reason'], string> = {
  denied:
    'The app may not use the microphone. Allow it in your phone’s settings for this app or for Safari, then try again.',
  unsupported: 'This browser cannot record sound.',
  failed: 'Recording could not start. Try again.',
}

/** What the learner might say now, for role-plays. */
function Hint({ script, turn }: { script: PartnerScript; turn: number }) {
  const hint = script.hints?.[turn]
  if (!hint) return null
  return (
    <p className="text-sm text-muted">
      {hint.en} For example:{' '}
      <span lang="sv" className="italic">
        {hint.example}
      </span>
    </p>
  )
}

/**
 * A discussion with a scripted partner. The partner says a line, the learner
 * taps to answer and taps when done, and the next line plays. One audio
 * element plays every line: once the first tap has started it, iOS lets it
 * play the following lines too.
 */
export function ScriptedPartner({
  script,
  onFinished,
  onStarted,
}: {
  script: PartnerScript
  onFinished: (sessionId: string) => void
  /** Called once the first answer is stored, so a mock can link the session at once. */
  onStarted?: (sessionId: string) => void
}) {
  const { pack } = script
  const [phase, setPhase] = useState<Phase>({ name: 'idle' })
  const [showText, setShowText] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  // A line that cannot be loaded, for example offline before its audio was
  // downloaded: its text is shown instead, and the discussion goes on.
  const [unplayable, setUnplayable] = useState(false)
  const audio = useRef<HTMLAudioElement>(null)
  const session = useRef<string | null>(null)
  const active = useRef<ActiveRecording | null>(null)
  const now = useNow(250)

  useEffect(() => () => active.current?.cancel(), [])

  const rolePlay = script.hints !== undefined
  const last = script.partner.length - 1
  const lineOf = (p: Phase) =>
    p.name === 'closing'
      ? script.closing
      : 'turn' in p
        ? script.partner[p.turn]!
        : null

  function speak(next: Phase & ({ name: 'partner' } | { name: 'closing' })) {
    const element = audio.current!
    element.src = appUrl(
      next.name === 'closing'
        ? script.closingAudio
        : script.turnAudio[next.turn]!,
    )
    setPhase(next)
    setBlocked(false)
    setUnplayable(false)
    element.play().catch(() => setBlocked(true))
  }

  function partnerDone() {
    if (phase.name === 'partner') setPhase({ name: 'answer', turn: phase.turn })
    else if (phase.name === 'closing' && session.current) {
      const id = session.current
      // The answers are already stored, so the review opens even if marking
      // the end fails; the failure is still reported.
      void finishPairSession(id)
        .catch((error: unknown) => reportStorageFailure(error))
        .finally(() => onFinished(id))
    }
  }

  async function answer(turn: number) {
    setError(null)
    // Until the microphone is ready the button is gone, so a second tap
    // cannot start a second recorder.
    setPhase({ name: 'starting', turn })
    try {
      const recording = await startRecording()
      active.current = recording
      setPhase({ name: 'recording', turn, active: recording })
    } catch (caught) {
      setError(
        MIC_ERRORS[
          caught instanceof RecorderFailure ? caught.reason : 'failed'
        ],
      )
      setPhase({ name: 'answer', turn })
    }
  }

  async function done(turn: number, recording: ActiveRecording) {
    setPhase({ name: 'saving', turn })
    active.current = null
    try {
      const recorded = await recording.stop()
      const first = session.current === null
      session.current = await addPairTurn(
        {
          topicId: script.id,
          packId: pack.id,
          packVersion: pack.version,
          level: pack.level,
        },
        session.current,
        {
          turn,
          audio: recorded.bytes,
          mimeType: recorded.mimeType,
          durationMs: recorded.durationMs,
        },
      )
      dataMarker.mark()
      if (first) onStarted?.(session.current)
      speak(
        turn < last ? { name: 'partner', turn: turn + 1 } : { name: 'closing' },
      )
    } catch (caught) {
      reportStorageFailure(caught)
      setError('Your answer could not be saved. Try again.')
      setPhase({ name: 'answer', turn })
    }
  }

  const line = lineOf(phase)
  return (
    <section aria-label="Discussion" className="flex flex-col gap-3">
      <audio
        ref={audio}
        onEnded={partnerDone}
        onError={() => {
          setUnplayable(true)
          setShowText(true)
        }}
        className="hidden"
      />
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {phase.name === 'idle' && (
        <>
          <p className="text-sm text-muted">
            The partner speaks first. After each line, tap Answer, speak, and
            tap Done.{' '}
            {rolePlay
              ? 'Each turn has a hint.'
              : 'Use the mind map and the phrases.'}
          </p>
          <Button onClick={() => speak({ name: 'partner', turn: 0 })}>
            {rolePlay ? 'Start the role-play' : 'Start the discussion'}
          </Button>
        </>
      )}
      {(phase.name === 'partner' || phase.name === 'closing') && (
        <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
          <p className="font-semibold">
            {phase.name === 'closing'
              ? 'The partner ends the conversation'
              : `The partner speaks (${phase.turn + 1} of ${script.partner.length})`}
          </p>
          {unplayable && (
            <>
              <p role="alert" className="text-danger">
                This line could not be played. Read it below, then go on.
              </p>
              <Button onClick={partnerDone}>Go on</Button>
            </>
          )}
          {blocked && !unplayable && (
            <Button onClick={() => void audio.current?.play()}>
              Play the partner
            </Button>
          )}
        </div>
      )}
      {phase.name === 'answer' && (
        <div className="flex flex-col gap-2 rounded-card border border-accent bg-surface p-4">
          <p className="font-semibold">Your turn</p>
          <Hint script={script} turn={phase.turn} />
          <Button onClick={() => void answer(phase.turn)}>Answer</Button>
          <Button
            variant="secondary"
            onClick={() => speak({ name: 'partner', turn: phase.turn })}
          >
            Hear it again
          </Button>
        </div>
      )}
      {phase.name === 'recording' && (
        <div className="flex flex-col items-center gap-2 rounded-card border border-danger bg-surface p-4">
          <p className="text-sm text-danger">● Recording your answer</p>
          <Hint script={script} turn={phase.turn} />
          <p className="text-3xl font-bold tabular-nums" role="timer">
            {formatDuration(now - phase.active.startedAt)}
          </p>
          <Button
            className="w-full"
            onClick={() => void done(phase.turn, phase.active)}
          >
            Done
          </Button>
        </div>
      )}
      {(phase.name === 'saving' || phase.name === 'starting') && (
        <p className="text-muted">
          {phase.name === 'saving' ? 'Saving…' : 'Starting the microphone…'}
        </p>
      )}
      {line && (
        <div className="flex flex-col gap-1">
          <Button variant="ghost" onClick={() => setShowText((s) => !s)}>
            {showText
              ? 'Hide what the partner said'
              : 'Show what the partner said'}
          </Button>
          {showText && (
            <p lang="sv" className="rounded-control bg-surface p-3">
              {line.text}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
