import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router'
import { listPacks } from '../../data/content'
import { getSetting } from '../../data/repositories/settings'
import { LEVELS, type Level } from '../../domain/content/schema'
import { Chip } from '../../ui/Chip'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'

function PackList({ level }: { level: Level }) {
  const packs = useAsync(() => listPacks(level, 'lasa'), level)
  if (packs.status === 'loading') return <Loading />
  if (packs.status === 'error')
    return (
      <EmptyState
        title="Content could not be loaded"
        description={packs.message}
      />
    )
  if (!packs.value.length)
    return (
      <EmptyState
        title={`No reading texts for ${level} yet`}
        description="Texts appear here once a reviewer has checked them."
      />
    )
  return (
    <ul className="flex flex-col gap-2">
      {packs.value.map((p) => (
        <li key={p.id}>
          <Link
            to={p.id}
            className="tap-target flex flex-col rounded-card border border-border bg-surface p-4 active:bg-surface-2"
          >
            <span lang="sv" className="font-semibold">
              {p.title}
            </span>
            <span className="text-sm text-muted">
              {p.textCount} texts · {p.itemCount} questions
              {p.hasDrafts && ' · includes drafts'}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function LasaScreen() {
  const target = useLiveQuery(() => getSetting('targetLevel'))
  const [picked, setPicked] = useState<Level | null>(null)
  const level = picked ?? target

  return (
    <Screen title="Läsa – reading" back="/exam">
      <p className="text-muted">
        Two booklets of short and long texts on the test. Questions are open,
        multiple choice, or matching.
      </p>
      <div role="group" aria-label="Level" className="flex gap-2">
        {LEVELS.map((l) => (
          <Chip key={l} selected={level === l} onClick={() => setPicked(l)}>
            Level {l}
          </Chip>
        ))}
      </div>
      {level && <PackList level={level} />}
    </Screen>
  )
}
