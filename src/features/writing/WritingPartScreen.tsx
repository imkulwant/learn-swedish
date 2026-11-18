import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router'
import { loadPrompts } from '../../data/content'
import { getSetting } from '../../data/repositories/settings'
import { latestWritings } from '../../data/repositories/writings'
import { LEVELS, type Level } from '../../domain/content/schema'
import type { Writing } from '../../domain/types'
import { rubricPercent } from '../../domain/writing'
import { countWords } from '../../domain/writingChecks'
import { Chip } from '../../ui/Chip'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { ReadinessCard } from '../exam/ReadinessCard'

/** Where the learner is with a prompt, from its latest text. */
function progress(writing: Writing | undefined): string {
  if (!writing) return 'Not started'
  if (writing.submittedAt === null)
    return `Draft · ${countWords(writing.text)} words`
  if (!writing.rubric) return 'Handed in · assess it'
  return `Assessed · ${rubricPercent(writing.rubric)}%`
}

function PromptList({ level }: { level: Level }) {
  const prompts = useAsync(() => loadPrompts(level), level)
  const latest = useLiveQuery(() => latestWritings())
  if (prompts.status === 'loading') return <Loading />
  if (prompts.status === 'error')
    return (
      <EmptyState
        title="Content could not be loaded"
        description={prompts.message}
      />
    )
  if (!prompts.value.length)
    return (
      <EmptyState
        title={`No writing tasks for ${level} yet`}
        description="They appear here once a reviewer has checked them."
      />
    )
  return (
    <ul className="flex flex-col gap-2">
      {prompts.value.map(({ prompt }) => (
        <li key={prompt.id}>
          <Link
            to={prompt.id}
            className="tap-target flex flex-col rounded-card border border-border bg-surface p-4 active:bg-surface-2"
          >
            <span lang="sv" className="font-semibold">
              {prompt.title}
            </span>
            <span className="text-sm text-muted">
              {prompt.register === 'formal' ? 'Formal' : 'Informal'} ·{' '}
              {latest ? progress(latest.get(prompt.id)) : '…'}
              {prompt.status === 'draft' && ' · draft'}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** The writing tasks of one level. */
export function WritingPartScreen() {
  const target = useLiveQuery(() => getSetting('targetLevel'))
  const [picked, setPicked] = useState<Level | null>(null)
  const level = picked ?? target

  return (
    <Screen title="Skriva – writing" back="/exam">
      <p className="text-muted">
        At D the test has two writing tasks, one of them formal. Write, check
        your text, hand it in, then compare it with a model answer and assess
        it.
      </p>
      <div role="group" aria-label="Level" className="flex gap-2">
        {LEVELS.map((l) => (
          <Chip key={l} selected={level === l} onClick={() => setPicked(l)}>
            Level {l}
          </Chip>
        ))}
      </div>
      {level && (
        <>
          <ReadinessCard level={level} skill="skriva" />
          <PromptList level={level} />
        </>
      )}
    </Screen>
  )
}
