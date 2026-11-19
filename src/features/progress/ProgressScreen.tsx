import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { loadMock, loadPrompts, type OfferedMock } from '../../data/content'
import { listMockRuns } from '../../data/repositories/mocks'
import {
  activityByDay,
  handedInWritings,
  speakingCounts,
} from '../../data/repositories/progress'
import { getReadiness } from '../../data/repositories/readiness'
import { getSetting } from '../../data/repositories/settings'
import { LEVELS, type Level } from '../../domain/content/schema'
import { toLocalDate } from '../../domain/dates'
import { EXAM_ORDER, PART_NAMES } from '../../domain/examFormat'
import { formatDayWithYear } from '../../domain/format'
import { mockPercents, readyFor } from '../../domain/mock'
import { READINESS } from '../../domain/readiness'
import { PLAN, streak } from '../../domain/studyPlan'
import type { MockRun } from '../../domain/types'
import { rubricPercent } from '../../domain/writing'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { useNow } from '../../ui/useNow'
import { ReadinessCard } from '../exam/ReadinessCard'
import { useVocabToday } from '../learn/useVocabToday'
import { StudyCalendar } from './StudyCalendar'

type Percents = ReturnType<typeof mockPercents>

const percentsOf = (offered: OfferedMock, run: MockRun): Percents =>
  mockPercents(
    {
      lasa: offered.mock.lasa.flatMap((t) => t.items),
      hora: offered.mock.hora.flatMap((c) => c.items),
      skriva: offered.mock.skriva.map((p) => p.id),
      tala: [
        ...offered.mock.tala.tasks.map((t) => t.id),
        ...offered.mock.tala.pairs.map((p) => p.id),
      ],
    },
    run,
  )

/** Finished mocks with their results, newest first. */
function useMockHistory() {
  const runs = useLiveQuery(async () =>
    (await listMockRuns()).filter((r) => r.status === 'finished'),
  )
  const ids = [...new Set(runs?.map((r) => r.examId) ?? [])].sort().join()
  const mocks = useAsync(async () => {
    const loaded = await Promise.all(
      ids ? ids.split(',').map((id) => loadMock(id).catch(() => null)) : [],
    )
    return new Map(loaded.flatMap((m) => (m ? [[m.mock.id, m] as const] : [])))
  }, ids)
  if (!runs || mocks.status === 'loading') return undefined
  const byId = mocks.status === 'ready' ? mocks.value : new Map()
  return runs.map((run) => {
    const offered = byId.get(run.examId)
    return {
      run,
      title: offered?.mock.title ?? run.examId,
      percents: offered ? percentsOf(offered, run) : null,
    }
  })
}

/**
 * "Ready" for a level, as the plan defines it: every part Ready, and one
 * finished mock of that level with every part at the Ready mark or above.
 */
function ReadyFor({
  level,
  history,
}: {
  level: Level
  history: NonNullable<ReturnType<typeof useMockHistory>>
}) {
  const parts = useLiveQuery(
    () => Promise.all(EXAM_ORDER.map((s) => getReadiness(level, s))),
    [level],
  )
  if (!parts) return null
  const { ready, partsReady, mockReady } = readyFor(
    level,
    parts.every((r) => r.status === 'ready'),
    history.map(({ run, percents }) => ({ level: run.level, percents })),
    READINESS.ready,
  )
  const mark = (done: boolean) => (
    <>
      <span aria-hidden="true">{done ? '✓' : '–'}</span>
      <span className="sr-only">{done ? 'Done: ' : 'Not yet: '}</span>
    </>
  )
  return (
    <section
      aria-label={`Ready for ${level}`}
      className={`flex flex-col gap-1 rounded-card border p-4 ${ready ? 'border-accent' : 'border-border'} bg-surface`}
    >
      <h2 className="text-lg font-semibold">
        {ready
          ? `You look ready for SFI ${level}`
          : `Not ready for SFI ${level} yet`}
      </h2>
      <ul className="text-sm text-muted">
        <li>
          {mark(partsReady)} All four parts at Ready ({READINESS.ready}% or
          more)
        </li>
        <li>
          {mark(mockReady)} A whole {level} mock with every part at{' '}
          {READINESS.ready}% or more
        </li>
      </ul>
      <p className="text-xs text-muted">
        The app’s own estimate. The official pass marks are not published.
      </p>
    </section>
  )
}

function Archive() {
  const writings = useLiveQuery(() => handedInWritings())
  const counts = useLiveQuery(() => speakingCounts())
  const prompts = useAsync(
    async () =>
      new Map(
        (await Promise.all(LEVELS.map(loadPrompts)))
          .flat()
          .map((p) => [p.prompt.id, p.prompt.title] as const),
      ),
    'prompts',
  )
  const titles = prompts.status === 'ready' ? prompts.value : new Map()
  return (
    <section aria-labelledby="archive" className="flex flex-col gap-3">
      <h2 id="archive" className="text-lg font-semibold">
        Your texts and recordings
      </h2>
      {writings && writings.length === 0 && (
        <p className="text-muted">No texts handed in yet.</p>
      )}
      <ul className="flex flex-col gap-2">
        {writings?.map((w) => (
          <li key={w.id}>
            <details className="rounded-card border border-border bg-surface p-3">
              <summary className="tap-target flex cursor-pointer flex-col">
                <span lang="sv" className="font-semibold">
                  {titles.get(w.promptId) ?? w.promptId}
                </span>
                <span className="text-sm text-muted">
                  {formatDayWithYear(toLocalDate(w.submittedAt!))} ·{' '}
                  {w.rubric ? `${rubricPercent(w.rubric)}%` : 'not assessed'}
                </span>
              </summary>
              <p lang="sv" className="mt-2 whitespace-pre-wrap">
                {w.text}
              </p>
            </details>
          </li>
        ))}
      </ul>
      {counts && (
        <p className="text-muted">
          {counts.recordings} recording{counts.recordings === 1 ? '' : 's'} and{' '}
          {counts.discussions} discussion{counts.discussions === 1 ? '' : 's'}{' '}
          on this phone.{' '}
          <Link to="/exam/tala" className="font-semibold text-accent">
            Listen under Tala
          </Link>
        </p>
      )}
    </section>
  )
}

export function ProgressScreen() {
  const level = useLiveQuery(() => getSetting('targetLevel'))
  const today = toLocalDate(useNow(60_000))
  const activity = useLiveQuery(() => activityByDay())
  const history = useMockHistory()
  const words = useVocabToday()

  if (!level || !activity || !history)
    return (
      <Screen title="Progress">
        <Loading />
      </Screen>
    )
  const days = streak(activity, today)
  return (
    <Screen title="Progress">
      <ReadyFor level={level} history={history} />
      <section aria-labelledby="parts" className="flex flex-col gap-2">
        <h2 id="parts" className="text-lg font-semibold">
          The four parts
        </h2>
        {EXAM_ORDER.map((s) => (
          <ReadinessCard key={s} level={level} skill={s} linked />
        ))}
      </section>
      <section aria-label="In numbers" className="grid grid-cols-2 gap-2">
        <div className="rounded-card border border-border bg-surface p-3">
          <p className="text-2xl font-bold">{days}</p>
          <p className="text-sm text-muted">
            day streak (days with at least {PLAN.studyDayActions} things done)
          </p>
        </div>
        <div className="rounded-card border border-border bg-surface p-3">
          <p className="text-2xl font-bold">
            {words && !(words instanceof Error) ? words.known : '–'}
          </p>
          <p className="text-sm text-muted">words learned</p>
        </div>
      </section>
      <StudyCalendar activity={activity} today={today} />
      <section aria-labelledby="mock-history" className="flex flex-col gap-2">
        <h2 id="mock-history" className="text-lg font-semibold">
          Mock exams
        </h2>
        {history.length === 0 ? (
          <p className="text-muted">
            No mock finished yet.{' '}
            <Link to="/exam" className="font-semibold text-accent">
              Find one under Exam
            </Link>
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map(({ run, title, percents }) => (
              <li
                key={run.id}
                className="flex flex-col gap-1 rounded-card border border-border bg-surface p-3"
              >
                <span className="font-semibold">
                  <span lang="sv">{title}</span> ·{' '}
                  {formatDayWithYear(
                    toLocalDate(run.finishedAt ?? run.startedAt),
                  )}
                </span>
                <span className="text-sm text-muted">
                  {EXAM_ORDER.map(
                    (s) =>
                      `${PART_NAMES[s].split(' ')[0]} ${percents?.[s] ?? '–'}${percents?.[s] == null ? '' : '%'}`,
                  ).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Archive />
    </Screen>
  )
}
