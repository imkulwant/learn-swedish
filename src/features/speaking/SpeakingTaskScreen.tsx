import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { appUrl, loadSpeakingTasks, type OfferedTask } from '../../data/content'
import {
  assessRecording,
  listRecordings,
  saveRecording,
} from '../../data/repositories/recordings'
import { LEVELS } from '../../domain/content/schema'
import {
  SOLO,
  SPEAKING_RUBRIC,
  formatDuration,
  speakingPercent,
} from '../../domain/speaking'
import type { Recording } from '../../domain/types'
import {
  RecorderFailure,
  startRecording,
  type ActiveRecording,
} from '../../platform/recorder'
import { reportStorageFailure } from '../../platform/storageFailure'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { useNow } from '../../ui/useNow'
import { AudioPlayer } from '../exam/AudioPlayer'
import { ReadinessCard } from '../exam/ReadinessCard'
import { RubricForm } from '../writing/RubricForm'
import { RecordingList, RecordingPlayer } from './RecordingList'

const RECORDER_ERRORS: Record<RecorderFailure['reason'], string> = {
  denied:
    'The app may not use the microphone. Allow it in your phone’s settings for this app or for Safari, then try again.',
  unsupported: 'This browser cannot record sound.',
  failed: 'Recording could not start. Try again.',
}

/** The task as on the test, with phrases that help. */
function TaskCard({ offered: { task } }: { offered: OfferedTask }) {
  return (
    <section
      aria-label="The task"
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
    >
      {task.status === 'draft' && (
        <p className="self-start rounded-full border border-warning px-3 py-0.5 text-xs text-warning">
          Draft – not yet checked by a reviewer
        </p>
      )}
      <p className="text-sm text-muted">
        {task.en} · speak for {SOLO.minSeconds / 60}–{SOLO.maxSeconds / 60}{' '}
        minutes
      </p>
      <div lang="sv" className="flex flex-col gap-2">
        {task.task.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {task.points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </div>
      <details className="text-sm">
        <summary className="tap-target flex items-center font-semibold text-accent">
          Useful phrases
        </summary>
        <ul lang="sv" className="flex flex-col gap-1 pt-1">
          {task.phrases.map((phrase, i) => (
            <li key={i}>{phrase}</li>
          ))}
        </ul>
      </details>
    </section>
  )
}

type Stage =
  | { name: 'ready' }
  | { name: 'planning'; endsAt: number }
  | { name: 'starting' }
  | { name: 'recording'; active: ActiveRecording }
  | { name: 'saving' }

/** Planning, then speaking, then the recording is stored. */
export function Speak({
  offered,
  onRecorded,
  saveOnLeave = false,
}: {
  offered: OfferedTask
  onRecorded: (id: string) => void
  /** Keep a recording in progress when the screen goes, as when a mock's time runs out. */
  saveOnLeave?: boolean
}) {
  const [stage, setStage] = useState<Stage>({ name: 'ready' })
  const [error, setError] = useState<string | null>(null)
  const now = useNow(250)
  const active = useRef<ActiveRecording | null>(null)

  // Leaving the screen while recording stops the microphone, and keeps or
  // throws away what was recorded.
  useEffect(
    () => () => {
      const recording = active.current
      if (!recording) return
      if (saveOnLeave) void stop(recording)
      else recording.cancel()
    },
    // The first render's props are the ones the screen was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  async function record() {
    setError(null)
    // The buttons are gone until the microphone is ready, so a second tap
    // cannot start a second recorder.
    setStage({ name: 'starting' })
    try {
      const recording = await startRecording()
      active.current = recording
      setStage({ name: 'recording', active: recording })
    } catch (caught) {
      setError(
        RECORDER_ERRORS[
          caught instanceof RecorderFailure ? caught.reason : 'failed'
        ],
      )
      setStage({ name: 'ready' })
    }
  }

  async function stop(recording: ActiveRecording) {
    setStage({ name: 'saving' })
    active.current = null
    try {
      const audio = await recording.stop()
      const { pack, task } = offered
      const saved = await saveRecording(
        {
          taskId: task.id,
          packId: pack.id,
          packVersion: pack.version,
          level: pack.level,
        },
        audio,
      )
      onRecorded(saved.id)
      setStage({ name: 'ready' })
    } catch (caught) {
      reportStorageFailure(caught)
      setError('The recording could not be saved. Try again.')
      setStage({ name: 'ready' })
    }
  }

  return (
    <section aria-label="Speak" className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {stage.name === 'ready' && (
        <div className="flex flex-col gap-2">
          <Button
            onClick={() =>
              setStage({
                name: 'planning',
                endsAt: Date.now() + SOLO.planSeconds * 1000,
              })
            }
          >
            Plan for {SOLO.planSeconds / 60} minutes
          </Button>
          <Button variant="secondary" onClick={() => void record()}>
            Start speaking now
          </Button>
        </div>
      )}
      {stage.name === 'planning' && (
        <div className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface p-4">
          <p className="text-sm text-muted">Planning time left</p>
          <p className="text-4xl font-bold tabular-nums" role="timer">
            {formatDuration(stage.endsAt - now)}
          </p>
          <p className="text-center text-sm text-muted">
            {stage.endsAt <= now
              ? 'Time to speak.'
              : 'Think of what to tell and which advice to give. Note a few words, not sentences.'}
          </p>
          <Button className="w-full" onClick={() => void record()}>
            Start speaking
          </Button>
        </div>
      )}
      {stage.name === 'recording' && (
        <div className="flex flex-col items-center gap-2 rounded-card border border-danger bg-surface p-4">
          <p className="text-sm text-danger">● Recording</p>
          <p className="text-4xl font-bold tabular-nums" role="timer">
            {formatDuration(now - stage.active.startedAt)}
          </p>
          <p className="text-sm text-muted">
            {now - stage.active.startedAt < SOLO.minSeconds * 1000
              ? `Keep going until ${formatDuration(SOLO.minSeconds * 1000)}.`
              : now - stage.active.startedAt <= SOLO.maxSeconds * 1000
                ? 'A good length. Finish what you are saying.'
                : 'You can stop now.'}
          </p>
          <Button className="w-full" onClick={() => void stop(stage.active)}>
            Stop
          </Button>
        </div>
      )}
      {(stage.name === 'saving' || stage.name === 'starting') && <Loading />}
    </section>
  )
}

/** One recording, the model answer, and the self-assessment. */
function Review({
  offered,
  recording,
  onDone,
}: {
  offered: OfferedTask
  recording: Recording
  onDone: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {recording.rubric && (
        <section
          aria-label="Result"
          className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4"
        >
          <h2 className="text-lg font-semibold">Your assessment</h2>
          <p className="text-2xl font-bold">
            {speakingPercent(recording.rubric)}%
          </p>
        </section>
      )}
      <section aria-labelledby="listen-own" className="flex flex-col gap-2">
        <h2 id="listen-own" className="text-lg font-semibold">
          Listen to yourself
        </h2>
        <RecordingPlayer recording={recording} />
      </section>
      <section aria-labelledby="model" className="flex flex-col gap-2">
        <h2 id="model" className="text-lg font-semibold">
          Model answer
        </h2>
        <p className="text-sm text-muted">
          An answer that would pass. The voice speaks faster than you need to:
          at a calm pace it takes 2–3 minutes.
        </p>
        <AudioPlayer
          src={appUrl(offered.audioPath)}
          label={`Model answer, ${offered.task.title}`}
        />
        <div
          lang="sv"
          className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
        >
          {offered.task.model.map((line, i) => (
            <p key={i}>{line.text}</p>
          ))}
        </div>
      </section>
      {recording.rubric ? (
        <>
          <ReadinessCard level={offered.pack.level} skill="tala" />
          <Button onClick={onDone}>Done</Button>
        </>
      ) : (
        <RubricForm
          criteria={SPEAKING_RUBRIC}
          intro="Listen to yourself, then to the model answer. Be strict: the test is. Your answers make up your Tala readiness."
          onSave={(rubric) => assessRecording(recording.id, rubric)}
        />
      )}
    </div>
  )
}

function Task({ offered }: { offered: OfferedTask }) {
  const recordings = useLiveQuery(
    () => listRecordings(offered.task.id),
    [offered.task.id],
  )
  const [reviewing, setReviewing] = useState<string | null>(null)
  const open = recordings?.find((r) => r.id === reviewing)

  if (!recordings) return <Loading />
  if (open)
    return (
      <Review
        offered={offered}
        recording={open}
        onDone={() => setReviewing(null)}
      />
    )
  return (
    <>
      <TaskCard offered={offered} />
      <Speak offered={offered} onRecorded={setReviewing} />
      <RecordingList recordings={recordings} onOpen={setReviewing} />
    </>
  )
}

export function SpeakingTaskScreen() {
  const { taskId = '' } = useParams()
  const offered = useAsync(async () => {
    const all = (await Promise.all(LEVELS.map(loadSpeakingTasks))).flat()
    return all.find((t) => t.task.id === taskId) ?? null
  }, taskId)

  return (
    <Screen
      title={
        offered.status === 'ready' && offered.value
          ? offered.value.task.title
          : 'Tala'
      }
      back="/exam/tala"
    >
      {offered.status === 'loading' && <Loading />}
      {offered.status === 'error' && (
        <EmptyState
          title="This task could not be opened"
          description={offered.message}
        />
      )}
      {offered.status === 'ready' && !offered.value && (
        <EmptyState
          title="There is no such task"
          description="It may not be checked by a reviewer yet."
        />
      )}
      {offered.status === 'ready' && offered.value && (
        <Task key={offered.value.task.id} offered={offered.value} />
      )}
    </Screen>
  )
}
