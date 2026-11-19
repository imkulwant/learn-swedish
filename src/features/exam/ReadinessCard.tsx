import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import type { Level, Skill } from '../../domain/content/schema'
import { getReadiness } from '../../data/repositories/readiness'
import type { Readiness } from '../../domain/readiness'

const SKILL_NAMES: Record<Skill, string> = {
  lasa: 'Läsa – reading',
  hora: 'Höra – listening',
  skriva: 'Skriva – writing',
  tala: 'Tala – speaking',
}

const BAND: Record<Exclude<Readiness['status'], 'insufficient'>, string> = {
  'not-yet': 'Not ready yet',
  almost: 'Almost ready',
  ready: 'Ready',
}

/**
 * How ready the learner looks for one part, from the latest answers. With
 * `linked`, the whole card opens that part of the exam.
 */
export function ReadinessCard({
  level,
  skill,
  linked = false,
}: {
  level: Level
  skill: Skill
  linked?: boolean
}) {
  const state = useLiveQuery(() => getReadiness(level, skill), [level, skill])
  const selfAssessed = skill === 'skriva' || skill === 'tala'
  const title = (
    <>
      {SKILL_NAMES[skill]} <span className="text-muted">· {level}</span>
    </>
  )

  return (
    <section
      aria-label={`Readiness, ${SKILL_NAMES[skill]}, level ${level}`}
      className={`relative flex flex-col gap-1 rounded-card border border-border bg-surface p-4 ${linked ? 'active:bg-surface-2' : ''}`}
    >
      <h2 className="font-semibold">
        {linked ? (
          // The link's ::after covers the card, so the whole card is the tap target.
          <Link to={`/exam/${skill}`} className="after:absolute after:inset-0">
            {title}
          </Link>
        ) : (
          title
        )}
      </h2>
      {!state ? null : state.status === 'insufficient' ? (
        <p className="text-muted">
          {selfAssessed
            ? skill === 'tala'
              ? `Record and assess ${state.needed} answers`
              : `Write and assess ${state.needed} texts`
            : `Answer ${state.needed} questions`}{' '}
          to see how ready you are ({state.count} so far).
        </p>
      ) : (
        <>
          <p className="text-2xl font-bold">
            {state.percent}%{' '}
            <span className="text-base font-semibold">
              · {BAND[state.status]}
            </span>
          </p>
          <p className="text-sm text-muted">
            {selfAssessed
              ? `Your own assessment of your last ${state.count} ${skill === 'tala' ? 'recordings' : 'texts'}, not an official score.`
              : `An estimate from your last ${state.count} answers, not an official score.`}
          </p>
        </>
      )}
    </section>
  )
}
