import { Link } from 'react-router'
import type { Level } from '../../domain/content/schema'
import type { LocalDate } from '../../domain/types'
import { usePlan } from './usePlan'

/** What to do today, most important first, and the study streak. */
export function PlanCard({
  level,
  examDate,
}: {
  level: Level
  examDate: LocalDate | null
}) {
  const plan = usePlan(level, examDate)
  return (
    <section
      aria-labelledby="plan-heading"
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="plan-heading" className="text-lg font-semibold">
          Today’s plan
        </h2>
        {plan && (
          <p className="text-sm text-muted">
            {plan.streak === 0 ? 'No streak yet' : `${plan.streak}-day streak`}
          </p>
        )}
      </div>
      {!plan ? (
        <p className="text-muted">Making your plan…</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {plan.items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.to}
                className="tap-target flex flex-col rounded-control bg-surface-2 p-3 active:bg-border"
              >
                <span className="font-semibold">{item.title}</span>
                <span className="text-sm text-muted">{item.detail}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-muted">
        A study day is one with at least five things done: answers, words, texts
        or recordings.
      </p>
    </section>
  )
}
