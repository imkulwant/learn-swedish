import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router'
import { loadSpeakingTasks } from '../../data/content'
import { latestRecordings } from '../../data/repositories/recordings'
import { getSetting } from '../../data/repositories/settings'
import { LEVELS, type Level } from '../../domain/content/schema'
import { speakingPercent } from '../../domain/speaking'
import type { Recording } from '../../domain/types'
import { Chip } from '../../ui/Chip'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { ReadinessCard } from '../exam/ReadinessCard'

function progress(latest: Recording | undefined): string {
  if (!latest) return 'Not started'
  return latest.rubric
    ? `Assessed · ${speakingPercent(latest.rubric)}%`
    : 'Recorded · assess it'
}

function TaskList({ level }: { level: Level }) {
  const tasks = useAsync(() => loadSpeakingTasks(level), level)
  const latest = useLiveQuery(() => latestRecordings())
  if (tasks.status === 'loading') return <Loading />
  if (tasks.status === 'error')
    return (
      <EmptyState
        title="Content could not be loaded"
        description={tasks.message}
      />
    )
  if (!tasks.value.length)
    return (
      <EmptyState
        title={`No speaking tasks for ${level} yet`}
        description="They appear here once a reviewer has checked them."
      />
    )
  return (
    <ul className="flex flex-col gap-2">
      {tasks.value.map(({ task }) => (
        <li key={task.id}>
          <Link
            to={task.id}
            className="tap-target flex flex-col rounded-card border border-border bg-surface p-4 active:bg-surface-2"
          >
            <span lang="sv" className="font-semibold">
              {task.title}
            </span>
            <span className="text-sm text-muted">
              Berätta och ge råd ·{' '}
              {latest ? progress(latest.get(task.id)) : '…'}
              {task.status === 'draft' && ' · draft'}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

/** The solo speaking tasks of one level. */
export function SpeakingPartScreen() {
  const target = useLiveQuery(() => getSetting('targetLevel'))
  const [picked, setPicked] = useState<Level | null>(null)
  const level = picked ?? target

  return (
    <Screen title="Tala – speaking" back="/exam">
      <p className="text-muted">
        At D you first speak alone for 3–4 minutes: tell about something you
        have done, and give advice. Plan, record yourself, then compare with a
        model answer. Pair discussions come later.
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
          <ReadinessCard level={level} skill="tala" />
          <TaskList level={level} />
        </>
      )}
    </Screen>
  )
}
