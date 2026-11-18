import { useState } from 'react'
import { useParams } from 'react-router'
import type { OfferedPrompt } from '../../data/content'
import type { Writing } from '../../domain/types'
import {
  RUBRIC,
  RUBRIC_MAX,
  WRITING_WORDS,
  rubricPercent,
  rubricPoints,
} from '../../domain/writing'
import { saveFile } from '../../platform/share'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { ReadinessCard } from '../exam/ReadinessCard'
import { Editor } from './Editor'
import { ModelAnswer } from './ModelAnswer'
import { RubricForm } from './RubricForm'
import { useLatestWriting, usePrompt } from './useWriting'

const SCORE_NAMES = ['Not yet', 'Partly', 'Yes'] as const

/** The task as on the test sheet: the situation, then what to write about. */
function Task({ offered: { prompt, pack } }: { offered: OfferedPrompt }) {
  const words = WRITING_WORDS[pack.level]
  return (
    <section
      aria-label="The task"
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
    >
      {prompt.status === 'draft' && (
        <p className="self-start rounded-full border border-warning px-3 py-0.5 text-xs text-warning">
          Draft – not yet checked by a reviewer
        </p>
      )}
      <p className="text-sm text-muted">
        {prompt.en} · {prompt.register === 'formal' ? 'Formal' : 'Informal'} ·{' '}
        {words.min}–{words.max} words
      </p>
      <div lang="sv" className="flex flex-col gap-2">
        {prompt.task.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        <p className="font-semibold">Skriv om:</p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {prompt.points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ShareText({ writing, name }: { writing: Writing; name: string }) {
  const [message, setMessage] = useState<string | null>(null)
  async function share() {
    const result = await saveFile(
      new File([writing.text], `${name}.txt`, { type: 'text/plain' }),
    )
    setMessage(
      result === 'blocked'
        ? 'Sharing did not open. Tap again.'
        : result === 'downloaded'
          ? 'The text was saved as a file.'
          : null,
    )
  }
  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" onClick={() => void share()}>
        Share my text
      </Button>
      <p className="text-sm text-muted">
        For example with your teacher, who can mark it properly.
      </p>
      {message && <p role="status">{message}</p>}
    </div>
  )
}

/** A handed-in text, as stored. */
function Handed({ writing }: { writing: Writing }) {
  return (
    <section aria-labelledby="your-text" className="flex flex-col gap-2">
      <h2 id="your-text" className="text-lg font-semibold">
        The text you handed in
      </h2>
      <div
        lang="sv"
        className="whitespace-pre-wrap rounded-card border border-border bg-surface p-4"
      >
        {writing.text}
      </div>
    </section>
  )
}

function Result({ writing }: { writing: Writing }) {
  const rubric = writing.rubric!
  return (
    <section
      aria-label="Result"
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
    >
      <h2 className="text-lg font-semibold">Your assessment</h2>
      <p className="text-2xl font-bold">
        {rubricPoints(rubric)} of {RUBRIC_MAX} · {rubricPercent(rubric)}%
      </p>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
        {RUBRIC.map((c) => (
          <div key={c.id} className="contents">
            <dt className="text-muted">{c.name}</dt>
            <dd>{SCORE_NAMES[rubric[c.id]]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function Prompt({ offered }: { offered: OfferedPrompt }) {
  const { prompt, pack } = offered
  const latest = useLatestWriting(prompt.id)
  // "Write it again" starts a fresh editor, keyed so it starts empty.
  const [round, setRound] = useState(0)
  if (!latest) return <Loading />
  const writing = latest.writing
  const fresh = round > 0 && writing?.submittedAt !== null
  const task = { register: prompt.register, words: WRITING_WORDS[pack.level] }

  if (!writing || writing.submittedAt === null || fresh)
    return (
      <>
        <Task offered={offered} />
        <Editor
          key={`${prompt.id}-${round}`}
          source={{
            promptId: prompt.id,
            packId: pack.id,
            packVersion: pack.version,
            level: pack.level,
          }}
          draft={writing && writing.submittedAt === null ? writing : null}
          task={task}
        />
      </>
    )

  return (
    <>
      {writing.rubric ? (
        <>
          <Result writing={writing} />
          <ReadinessCard level={pack.level} skill="skriva" />
        </>
      ) : null}
      <Task offered={offered} />
      <Handed writing={writing} />
      <ModelAnswer model={prompt.model} />
      {writing.rubric ? (
        <>
          <ShareText writing={writing} name={prompt.id} />
          <Button onClick={() => setRound((r) => r + 1)}>Write it again</Button>
        </>
      ) : (
        <RubricForm writingId={writing.id} />
      )}
    </>
  )
}

export function WritingScreen() {
  const { promptId = '' } = useParams()
  const offered = usePrompt(promptId)
  return (
    <Screen
      title={
        offered.status === 'ready' && offered.value
          ? offered.value.prompt.title
          : 'Skriva'
      }
      back="/exam/skriva"
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
        <Prompt key={offered.value.prompt.id} offered={offered.value} />
      )}
    </Screen>
  )
}
