import { useEffect, useRef, useState } from 'react'
import { appUrl, type OfferedMock } from '../../data/content'
import {
  addPlay,
  finishPart,
  setMockSpeaking,
  setMockText,
  setResponse,
} from '../../data/repositories/mocks'
import type { Skill } from '../../domain/content/schema'
import { PART_NAMES } from '../../domain/examFormat'
import { EXAM_FORMAT } from '../../domain/examFormat'
import { formatDuration } from '../../domain/speaking'
import type { MockRun } from '../../domain/types'
import type { OfferedPair } from '../../data/content'
import { countWords } from '../../domain/writingChecks'
import { reportStorageFailure } from '../../platform/storageFailure'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { useNow } from '../../ui/useNow'
import { AudioPlayer } from '../exam/AudioPlayer'
import { ReadingTextView } from '../exam/ReadingTextView'
import { MindMap, PhraseCards } from '../speaking/PairScreen'
import { ScriptedPartner } from '../speaking/ScriptedPartner'
import { Speak } from '../speaking/SpeakingTaskScreen'
import { MockQuestion } from './MockQuestion'

/** Tells the open part that a write failed, so it never looks saved when it is not. */
const WRITE_FAILED = 'sfi-mock-write-failed'

const store = (write: Promise<void>) =>
  void write.catch((error: unknown) => {
    reportStorageFailure(error)
    window.dispatchEvent(new Event(WRITE_FAILED))
  })

/** A writing task's text, stored shortly after typing pauses and when left. */
function MockText({
  run,
  promptId,
  disabled,
}: {
  run: MockRun
  promptId: string
  disabled: boolean
}) {
  const [text, setText] = useState(run.texts[promptId] ?? '')
  const latest = useRef(text)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const save = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    store(setMockText(run.id, promptId, latest.current))
  }
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && save()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', save)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', save)
      save()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col gap-1">
      <textarea
        lang="sv"
        aria-label="Your text"
        value={text}
        disabled={disabled}
        maxLength={20_000}
        rows={10}
        onChange={(e) => {
          setText(e.target.value)
          latest.current = e.target.value
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(save, 400)
        }}
        onBlur={save}
        className="min-h-56 rounded-control border border-border bg-surface p-3 text-text"
      />
      <p className="text-sm text-muted">{countWords(text)} words</p>
    </div>
  )
}

/**
 * The pair discussion of a mock. The session is linked to the mock at its
 * first answer, so a mock resumed after the app closed keeps what was said.
 */
function MockPair({ pair, run }: { pair: OfferedPair; run: MockRun }) {
  const id = pair.topic.id
  const [linkedBefore] = useState(() => id in run.speaking)
  const [done, setDone] = useState(false)
  if (linkedBefore || done)
    return (
      <p role="status" className="text-accent">
        ✓ Your discussion is recorded.
      </p>
    )
  return (
    <ScriptedPartner
      script={pair.script}
      onStarted={(sessionId) => store(setMockSpeaking(run.id, id, sessionId))}
      onFinished={(sessionId) => {
        store(setMockSpeaking(run.id, id, sessionId))
        setDone(true)
      }}
    />
  )
}

/** One part of a running mock: its timer, its content, and handing it in. */
export function MockPart({
  offered,
  run,
  skill,
}: {
  offered: OfferedMock
  run: MockRun
  skill: Skill
}) {
  const { mock } = offered
  const now = useNow(1000)
  const [confirming, setConfirming] = useState(false)
  const [writeFailed, setWriteFailed] = useState(false)
  useEffect(() => {
    const failed = () => setWriteFailed(true)
    window.addEventListener(WRITE_FAILED, failed)
    return () => window.removeEventListener(WRITE_FAILED, failed)
  }, [])
  const left = Math.max(0, (run.parts[skill].endsAt ?? now) - now)
  const over = left === 0
  const answer =
    (itemId: string) => (value: Parameters<typeof setResponse>[3]) =>
      store(setResponse(run.id, skill, itemId, value))

  return (
    <div className="flex flex-col gap-5">
      <div className="sticky top-16 z-10 -mx-4 flex items-center justify-between border-b border-border bg-bg px-4 py-2">
        <p className="font-semibold">{PART_NAMES[skill]}</p>
        <p
          role="timer"
          aria-label="Time left"
          className={`font-bold tabular-nums ${left < 5 * 60_000 ? 'text-danger' : ''}`}
        >
          {formatDuration(left)}
        </p>
      </div>

      {skill === 'lasa' &&
        mock.lasa.map((text) => (
          <section key={text.id} className="flex flex-col gap-4">
            <ReadingTextView text={text} />
            {text.items.map((item) => (
              <MockQuestion
                key={item.id}
                item={item}
                value={run.responses[item.id]}
                onChange={answer(item.id)}
                disabled={over}
              />
            ))}
          </section>
        ))}

      {skill === 'hora' &&
        mock.hora.map((clip) => (
          <section key={clip.id} className="flex flex-col gap-4">
            <p lang="sv" className="italic text-muted">
              {clip.instruction}
            </p>
            <AudioPlayer
              src={appUrl(mock.audio[clip.id]!)}
              label={clip.title}
              limit={{
                max: EXAM_FORMAT.parts.hora.plays,
                used: run.plays[clip.id] ?? 0,
                onPlayed: () => store(addPlay(run.id, clip.id)),
              }}
            />
            {clip.items.map((item) => (
              <MockQuestion
                key={item.id}
                item={item}
                value={run.responses[item.id]}
                onChange={answer(item.id)}
                disabled={over}
              />
            ))}
          </section>
        ))}

      {skill === 'skriva' &&
        mock.skriva.map((prompt, i) => (
          <section
            key={prompt.id}
            aria-label={`Writing task ${i + 1}`}
            className="flex flex-col gap-3"
          >
            <h2 className="text-lg font-semibold">
              Task {i + 1} ·{' '}
              {prompt.register === 'formal' ? 'Formal' : 'Informal'}
            </h2>
            <div
              lang="sv"
              className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
            >
              {prompt.task.map((line, j) => (
                <p key={j}>{line}</p>
              ))}
              <p className="font-semibold">Skriv om:</p>
              <ul className="flex list-disc flex-col gap-1 pl-5">
                {prompt.points.map((p, j) => (
                  <li key={j}>{p}</li>
                ))}
              </ul>
            </div>
            <MockText run={run} promptId={prompt.id} disabled={over} />
          </section>
        ))}

      {skill === 'tala' && (
        <>
          {offered.tasks.map((t) => (
            <section
              key={t.task.id}
              aria-label="Solo task"
              className="flex flex-col gap-3"
            >
              <h2 className="text-lg font-semibold">
                Alone: berätta och ge råd
              </h2>
              <div
                lang="sv"
                className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
              >
                {t.task.task.map((line, j) => (
                  <p key={j}>{line}</p>
                ))}
                <ul className="flex list-disc flex-col gap-1 pl-5">
                  {t.task.points.map((p, j) => (
                    <li key={j}>{p}</li>
                  ))}
                </ul>
              </div>
              {run.speaking[t.task.id] && (
                <p role="status" className="text-accent">
                  ✓ Recorded. Record again to replace it.
                </p>
              )}
              <Speak
                offered={t}
                saveOnLeave
                onRecorded={(id) =>
                  store(setMockSpeaking(run.id, t.task.id, id))
                }
              />
            </section>
          ))}
          {offered.pairs.map((p) => (
            <section key={p.topic.id} className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">In a pair</h2>
              <MindMap offered={p} />
              <PhraseCards offered={p} />
              <MockPair pair={p} run={run} />
            </section>
          ))}
        </>
      )}

      {writeFailed && (
        <p role="alert" className="text-danger">
          Your last answer could not be saved. Check that the phone has free
          space, then answer again.
        </p>
      )}
      {over && (
        <p role="alert" className="font-semibold text-danger">
          Time is up. Your answers are saved.
        </p>
      )}
      <Button
        onClick={() =>
          over ? store(finishPart(run.id, skill)) : setConfirming(true)
        }
      >
        {over ? 'Go on' : 'Hand in this part'}
      </Button>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Hand in this part?"
      >
        <p className="text-muted">
          You cannot come back to it. {formatDuration(left)} is left.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            onClick={() => {
              setConfirming(false)
              store(finishPart(run.id, skill))
              window.scrollTo({ top: 0 })
            }}
          >
            Hand in
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setConfirming(false)}
          >
            Keep working
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
