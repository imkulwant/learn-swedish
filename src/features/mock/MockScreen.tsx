import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { listMocks, loadMock, type OfferedMock } from '../../data/content'
import { OfflineAudio } from '../exam/OfflineAudio'
import {
  finishPart,
  latestMock,
  startMock,
  startPart,
} from '../../data/repositories/mocks'
import { EXAM_FORMAT, EXAM_ORDER, PART_NAMES } from '../../domain/examFormat'
import { currentPart, expiredPart } from '../../domain/mock'
import type { MockRun } from '../../domain/types'
import { dataMarker } from '../../platform/dataMarker'
import { reportStorageFailure } from '../../platform/storageFailure'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { useNow } from '../../ui/useNow'
import { MockPart } from './MockPart'
import { MockResults } from './MockResults'

const store = (write: Promise<unknown>) =>
  void write.catch(reportStorageFailure)

function Intro({
  offered,
  onStart,
}: {
  offered: OfferedMock
  onStart: () => Promise<void>
}) {
  const [starting, setStarting] = useState(false)
  const summary = useAsync(
    async () => (await listMocks()).find((m) => m.id === offered.mock.id),
    offered.mock.id,
  )
  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted">
        A whole {offered.mock.level} test in the order of the real one. Its
        questions are never used in practice, so your result is fair.
      </p>
      <section
        aria-label="The parts"
        className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
      >
        <ol className="flex flex-col gap-1">
          {EXAM_ORDER.map((skill) => (
            <li key={skill} className="flex justify-between">
              <span>{PART_NAMES[skill]}</span>
              <span className="text-muted">
                {EXAM_FORMAT.parts[skill].minutes} min
              </span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted">
          Skolverket gives only the total, four to five hours, so these times
          are estimates. Each clip plays at most {EXAM_FORMAT.parts.hora.plays}{' '}
          times. No dictionary.
        </p>
      </section>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted">
        <li>You see no answers until the end.</li>
        <li>You can take a break between parts.</li>
        <li>
          If the app closes, open it again: the mock goes on where it was, and
          the clock keeps running.
        </li>
      </ul>
      {summary.status === 'ready' && summary.value && (
        <OfflineAudio packs={[summary.value]} />
      )}
      <Button
        disabled={starting}
        onClick={() => {
          setStarting(true)
          void onStart().finally(() => setStarting(false))
        }}
      >
        Start the mock
      </Button>
    </div>
  )
}

/** The screen before a part: a break, then its start. */
function BeforePart({ run }: { run: MockRun }) {
  const skill = currentPart(run.parts)!
  const index = EXAM_ORDER.indexOf(skill)
  const first = index === 0
  const before = first ? null : run.parts[EXAM_ORDER[index - 1]!]
  const timedOut = before !== null && before.finishedAt === before.endsAt
  const heading = useRef<HTMLHeadingElement>(null)
  // The part before has gone from the screen; focus starts here.
  useEffect(() => heading.current?.focus(), [skill])
  return (
    <div className="flex flex-col gap-4">
      {timedOut && (
        <p role="alert" className="font-semibold text-danger">
          The time for {PART_NAMES[EXAM_ORDER[index - 1]!]} ran out. Your
          answers are saved.
        </p>
      )}
      <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold">
        {first ? 'First part' : 'Next part'}: {PART_NAMES[skill]}
      </h2>
      <p className="text-muted">
        {EXAM_FORMAT.parts[skill].minutes} minutes. The clock starts when you
        tap Start.
        {skill === 'hora' && ' Use headphones if you can.'}
        {skill === 'tala' &&
          ' You will need the microphone, and a quiet place.'}
      </p>
      <Button
        onClick={() => {
          store(startPart(run.id, skill))
          window.scrollTo({ top: 0 })
        }}
      >
        Start {PART_NAMES[skill]}
      </Button>
    </div>
  )
}

function Mock({ offered }: { offered: OfferedMock }) {
  const latest = useLiveQuery(
    async () => ({ run: await latestMock(offered.mock.id) }),
    [offered.mock.id],
  )
  const [again, setAgain] = useState(false)
  const now = useNow(1000)
  const run = latest?.run

  // A part whose time ran out, also while the app was closed, ends by itself.
  const expired = run?.status === 'running' ? expiredPart(run.parts, now) : null
  useEffect(() => {
    if (run && expired) store(finishPart(run.id, expired))
  }, [run, expired])

  if (!latest) return <Loading />
  if (!run || (again && run.status === 'finished'))
    return (
      <Intro
        offered={offered}
        onStart={async () => {
          const { mock } = offered
          try {
            await startMock({
              examId: mock.id,
              packVersion: mock.version,
              level: mock.level,
            })
            dataMarker.mark()
            setAgain(false)
          } catch (error) {
            reportStorageFailure(error)
          }
        }}
      />
    )
  if (run.status === 'finished')
    return (
      <div className="flex flex-col gap-4">
        <MockResults offered={offered} run={run} />
        <Button variant="secondary" onClick={() => setAgain(true)}>
          Take the mock again
        </Button>
      </div>
    )
  const skill = currentPart(run.parts)
  // A sitting whose parts are all done is finished, whatever it says.
  if (!skill)
    return (
      <EmptyState
        title="This mock cannot go on"
        description="Its parts are all done but it is not marked as finished. Take the mock again."
      />
    )
  if (run.parts[skill].startedAt === null) return <BeforePart run={run} />
  return <MockPart key={skill} offered={offered} run={run} skill={skill} />
}

export function MockScreen() {
  const { examId = '' } = useParams()
  const offered = useAsync(() => loadMock(examId), examId)
  return (
    <Screen
      title={
        offered.status === 'ready' ? offered.value.mock.title : 'Mock exam'
      }
      back="/exam"
    >
      {offered.status === 'loading' && <Loading />}
      {offered.status === 'error' && (
        <EmptyState
          title="This mock could not be opened"
          description={offered.message}
        />
      )}
      {offered.status === 'ready' && (
        <Mock key={offered.value.mock.id} offered={offered.value} />
      )}
    </Screen>
  )
}

/** The mocks on the Exam screen, with where the learner is in each. */
export function MockList() {
  const mocks = useAsync(() => listMocks(), 'mocks')
  const runs = useLiveQuery(async () => {
    if (mocks.status !== 'ready') return null
    return Object.fromEntries(
      await Promise.all(
        mocks.value.map(async (m) => [m.id, await latestMock(m.id)] as const),
      ),
    )
  }, [mocks.status])
  if (mocks.status !== 'ready' || !mocks.value.length) return null
  return (
    <section aria-labelledby="mocks" className="flex flex-col gap-2">
      <h2 id="mocks" className="text-lg font-semibold">
        Mock exams
      </h2>
      <ul className="flex flex-col gap-2">
        {mocks.value.map((m) => {
          const run = runs?.[m.id]
          return (
            <li key={m.id}>
              <Link
                to={`prov/${m.id}`}
                className="tap-target flex flex-col rounded-card border border-border bg-surface p-4 active:bg-surface-2"
              >
                <span lang="sv" className="font-semibold">
                  {m.title}
                </span>
                <span className="text-sm text-muted">
                  Level {m.level} ·{' '}
                  {!run
                    ? 'Not started'
                    : run.status === 'running'
                      ? 'In progress – tap to go on'
                      : 'Finished – see your result'}
                  {m.hasDrafts && ' · includes drafts'}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
