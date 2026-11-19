import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import type { OfferedMock } from '../../data/content'
import {
  recordMockAttempts,
  setAssessment,
  setMark,
} from '../../data/repositories/mocks'
import { getPairSession } from '../../data/repositories/pairs'
import { getRecording } from '../../data/repositories/recordings'
import type { Item, Skill } from '../../domain/content/schema'
import { PART_NAMES } from '../../domain/examFormat'
import {
  mockPercents,
  partResult,
  scoreItem,
  type MockResponse,
} from '../../domain/mock'
import {
  PAIR_RUBRIC,
  SPEAKING_RUBRIC,
  rubricShare,
} from '../../domain/speaking'
import type { MockRun } from '../../domain/types'
import { RUBRIC } from '../../domain/writing'
import { reportStorageFailure } from '../../platform/storageFailure'
import { Button } from '../../ui/Button'
import { ConversationPlayer } from '../speaking/Conversation'
import { RecordingPlayer } from '../speaking/RecordingList'
import { ModelAnswer } from '../writing/ModelAnswer'
import { RubricForm } from '../writing/RubricForm'

/** What was answered, as text, for the review. */
function shown(item: Item, response: MockResponse | undefined): string {
  if (response === undefined || response === '') return 'No answer'
  if (item.type === 'mc' && typeof response === 'number')
    return item.options[response] ?? 'No answer'
  if (item.type === 'match' && Array.isArray(response))
    return item.pairs
      .map(
        (p, i) =>
          `${p.q} → ${response[i] === null ? '–' : item.options[response[i]!]}`,
      )
      .join('; ')
  return String(response)
}

function rightAnswer(item: Item): string {
  if (item.type === 'mc') return item.options[item.answer]!
  if (item.type === 'match')
    return item.pairs
      .map((p) => `${p.q} → ${item.options[p.answer]}`)
      .join('; ')
  return item.model
}

function Review({ items, run }: { items: Item[]; run: MockRun }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item) => {
        const s = scoreItem(item, run.responses[item.id], run.marks[item.id])
        const right = s.score === s.maxScore
        return (
          <li
            key={item.id}
            className={`flex flex-col gap-1 rounded-control border p-3 text-sm ${
              right ? 'border-accent-fg' : 'border-danger'
            }`}
          >
            <p lang="sv" className="font-semibold">
              {item.prompt}
            </p>
            <p>
              <span className="text-muted">Your answer: </span>
              <span lang="sv">{shown(item, run.responses[item.id])}</span>{' '}
              {right ? '✓' : `✗ (${s.score} of ${s.maxScore})`}
            </p>
            {!right && (
              <p>
                <span className="text-muted">Right answer: </span>
                <span lang="sv">{rightAnswer(item)}</span>
              </p>
            )}
            <p className="text-muted">{item.explain}</p>
          </li>
        )
      })}
    </ol>
  )
}

const save = (write: Promise<void>) =>
  write.catch((e: unknown) => {
    reportStorageFailure(e)
    throw e
  })

export function MockResults({
  offered,
  run,
}: {
  offered: OfferedMock
  run: MockRun
}) {
  const { mock } = offered
  const items: Record<'lasa' | 'hora', Item[]> = {
    lasa: mock.lasa.flatMap((t) => t.items),
    hora: mock.hora.flatMap((c) => c.items),
  }
  const lasa = partResult(items.lasa, run.responses, run.marks)
  const hora = partResult(items.hora, run.responses, run.marks)
  const pending = [...lasa.pending, ...hora.pending]
  const all = [...items.lasa, ...items.hora]

  // The same numbers as Progress, from one function.
  const percents = mockPercents(
    {
      lasa: items.lasa,
      hora: items.hora,
      skriva: mock.skriva.map((p) => p.id),
      tala: [
        ...offered.tasks.map((t) => t.task.id),
        ...offered.pairs.map((p) => p.topic.id),
      ],
    },
    run,
  )

  // Once every open answer is marked, the answers count for readiness.
  useEffect(() => {
    if (pending.length || run.recordedAt !== null) return
    const at = run.finishedAt ?? run.startedAt
    const attempts = (['lasa', 'hora'] as const).flatMap((skill) =>
      items[skill].map((item) => {
        const s = scoreItem(item, run.responses[item.id], run.marks[item.id])
        return {
          itemId: item.id,
          packId: mock.id,
          // The version the mock was taken with, even if content changed since.
          packVersion: run.packVersion,
          level: mock.level,
          skill,
          mode: 'mock' as const,
          score: s.score,
          maxScore: s.maxScore,
          selfMarked: item.id in run.marks,
          response: run.responses[item.id] ?? '',
          answeredAt: at,
        }
      }),
    )
    void recordMockAttempts(run.id, attempts).catch(reportStorageFailure)
    // The run is the source of truth; it changes when a mark is stored.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.length, run.recordedAt, run.id])

  const rows: [Skill, string][] = [
    [
      'lasa',
      pending.length
        ? 'Mark your open answers below'
        : `${lasa.score} of ${lasa.maxScore} · ${lasa.percent}%`,
    ],
    [
      'hora',
      pending.length
        ? 'Mark your open answers below'
        : `${hora.score} of ${hora.maxScore} · ${hora.percent}%`,
    ],
    [
      'skriva',
      percents.skriva === null
        ? 'Assess your texts below'
        : `${percents.skriva}% · self-assessed`,
    ],
    [
      'tala',
      percents.tala === null
        ? 'Assess your speaking below'
        : `${percents.tala}% · self-assessed`,
    ],
  ]

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Result"
        className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
      >
        <h2 className="text-lg font-semibold">Your result</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {rows.map(([skill, text]) => (
            <div key={skill} className="contents">
              <dt className="font-semibold">{PART_NAMES[skill]}</dt>
              <dd className="text-right">{text}</dd>
            </div>
          ))}
        </dl>
        {run.packVersion !== mock.version && (
          <p role="note" className="text-sm text-warning">
            This mock was updated after you took it. Some questions may have
            changed.
          </p>
        )}
        <p className="text-sm text-muted">
          The app's own estimate, not an official result. Läsa and Höra answers
          count double in your readiness.
        </p>
      </section>

      {pending.length > 0 && (
        <section aria-labelledby="marks" className="flex flex-col gap-3">
          <h2 id="marks" className="text-lg font-semibold">
            Your open answers
          </h2>
          <p className="text-sm text-muted">
            These did not match an accepted answer. Compare with the model
            answer: does yours mean the same?
          </p>
          {all
            .filter((item) => pending.includes(item.id))
            .map((item) => (
              <div
                key={item.id}
                role="group"
                aria-label={item.prompt}
                className="flex flex-col gap-2 rounded-control border border-border p-3"
              >
                <p lang="sv" className="font-semibold">
                  {item.prompt}
                </p>
                <p>
                  <span className="text-muted">You: </span>
                  <span lang="sv">{shown(item, run.responses[item.id])}</span>
                </p>
                <p>
                  <span className="text-muted">Model: </span>
                  <span lang="sv">{rightAnswer(item)}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => void save(setMark(run.id, item.id, true))}
                  >
                    Yes, it does
                  </Button>
                  <Button
                    className="flex-1"
                    variant="secondary"
                    onClick={() => void save(setMark(run.id, item.id, false))}
                  >
                    No
                  </Button>
                </div>
              </div>
            ))}
        </section>
      )}

      {mock.skriva.map((prompt, i) => (
        <section
          key={prompt.id}
          aria-label={`Writing task ${i + 1}`}
          className="flex flex-col gap-3"
        >
          <h2 className="text-lg font-semibold">
            Skriva, task {i + 1}: <span lang="sv">{prompt.title}</span>
          </h2>
          <div
            lang="sv"
            className="whitespace-pre-wrap rounded-card border border-border bg-surface p-4"
          >
            {run.texts[prompt.id]?.trim() || 'You wrote nothing.'}
          </div>
          <ModelAnswer model={prompt.model} />
          {run.assessments[prompt.id] ? (
            <p className="font-semibold">
              Assessed: {rubricShare(run.assessments[prompt.id]!)}%
            </p>
          ) : (
            <RubricForm
              criteria={RUBRIC}
              intro="Compare your text with the model answer. Be strict: the test is."
              onSave={(scores) =>
                save(setAssessment(run.id, prompt.id, scores))
              }
            />
          )}
        </section>
      ))}

      {offered.tasks.map((t) => (
        <SpeakingResult
          key={t.task.id}
          title="Tala, alone"
          storedId={run.speaking[t.task.id]}
          kind="solo"
          assessed={run.assessments[t.task.id]}
          onAssess={(scores) => save(setAssessment(run.id, t.task.id, scores))}
          offered={offered}
        />
      ))}
      {offered.pairs.map((p) => (
        <SpeakingResult
          key={p.topic.id}
          title="Tala, in a pair"
          storedId={run.speaking[p.topic.id]}
          kind="pair"
          assessed={run.assessments[p.topic.id]}
          onAssess={(scores) => save(setAssessment(run.id, p.topic.id, scores))}
          offered={offered}
          pairIndex={offered.pairs.indexOf(p)}
        />
      ))}

      <section aria-labelledby="review" className="flex flex-col gap-3">
        <h2 id="review" className="text-lg font-semibold">
          Every question
        </h2>
        <h3 className="font-semibold">Läsa</h3>
        <Review items={items.lasa} run={run} />
        <h3 className="font-semibold">Höra</h3>
        <Review items={items.hora} run={run} />
      </section>
    </div>
  )
}

function SpeakingResult({
  title,
  storedId,
  kind,
  assessed,
  onAssess,
  offered,
  pairIndex = 0,
}: {
  title: string
  storedId: string | undefined
  kind: 'solo' | 'pair'
  assessed: Record<string, 0 | 1 | 2> | undefined
  onAssess: (scores: Record<string, 0 | 1 | 2>) => Promise<void>
  offered: OfferedMock
  pairIndex?: number
}) {
  const stored = useLiveQuery(
    async () =>
      storedId
        ? {
            recording:
              kind === 'solo' ? await getRecording(storedId) : undefined,
            session:
              kind === 'pair' ? await getPairSession(storedId) : undefined,
          }
        : null,
    [storedId, kind],
  )
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {!storedId && <p className="text-muted">Nothing was recorded.</p>}
      {storedId && stored && !stored.recording && !stored.session && (
        <p className="text-muted">
          The recording is not on this phone. It may have been deleted, or made
          on another phone.
        </p>
      )}
      {stored?.recording && <RecordingPlayer recording={stored.recording} />}
      {stored?.session && (
        <ConversationPlayer
          script={offered.pairs[pairIndex]!.script}
          session={stored.session}
        />
      )}
      {assessed ? (
        <p className="font-semibold">Assessed: {rubricShare(assessed)}%</p>
      ) : (
        <RubricForm
          criteria={kind === 'solo' ? SPEAKING_RUBRIC : PAIR_RUBRIC}
          intro="Listen, and assess yourself as the examiner would."
          onSave={onAssess}
        />
      )}
    </section>
  )
}
