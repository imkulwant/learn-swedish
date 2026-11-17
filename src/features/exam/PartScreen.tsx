import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router'
import { listPacks } from '../../data/content'
import { getSetting } from '../../data/repositories/settings'
import { LEVELS, type Level, type Skill } from '../../domain/content/schema'
import { Chip } from '../../ui/Chip'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { OfflineAudio } from './OfflineAudio'

const PARTS = {
  lasa: {
    title: 'Läsa – reading',
    about:
      'Two booklets of short and long texts on the test. Questions are open, multiple choice, or matching.',
    units: 'texts',
    empty: 'reading texts',
  },
  hora: {
    title: 'Höra – listening',
    about:
      'Announcements, dialogues, news and messages. Answer while you listen. On the test you cannot pause or rewind.',
    units: 'clips',
    empty: 'listening clips',
  },
} satisfies Partial<Record<Skill, object>>

type Part = keyof typeof PARTS

function PackList({ level, skill }: { level: Level; skill: Part }) {
  const part = PARTS[skill]
  const packs = useAsync(() => listPacks(level, skill), `${skill}-${level}`)
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
        title={`No ${part.empty} for ${level} yet`}
        description="They appear here once a reviewer has checked them."
      />
    )
  return (
    <>
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
                {p.unitCount} {part.units} · {p.itemCount} questions
                {p.hasDrafts && ' · includes drafts'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <OfflineAudio packs={packs.value} />
    </>
  )
}

/** The packs of one part of the test, for the chosen level. */
export function PartScreen({ skill }: { skill: Part }) {
  const target = useLiveQuery(() => getSetting('targetLevel'))
  const [picked, setPicked] = useState<Level | null>(null)
  const level = picked ?? target

  return (
    <Screen title={PARTS[skill].title} back="/exam">
      <p className="text-muted">{PARTS[skill].about}</p>
      <div role="group" aria-label="Level" className="flex gap-2">
        {LEVELS.map((l) => (
          <Chip key={l} selected={level === l} onClick={() => setPicked(l)}>
            Level {l}
          </Chip>
        ))}
      </div>
      {level && <PackList level={level} skill={skill} />}
    </Screen>
  )
}
