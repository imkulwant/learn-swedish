import { Link } from 'react-router'
import { examCountdown } from '../../domain/countdown'
import { toLocalDate } from '../../domain/dates'
import { formatDayWithYear } from '../../domain/format'
import type { LocalDate } from '../../domain/types'
import { useNow } from '../../ui/useNow'

/** Days left to the test, or a nudge to set or fix the date. */
export function ExamCountdown({ examDate }: { examDate: LocalDate | null }) {
  // Once a minute is enough to roll over at midnight.
  const now = useNow(60_000)
  if (examDate === null)
    return (
      <p className="text-muted">
        Know your test date?{' '}
        <Link to="/settings" className="font-semibold text-accent">
          Add it in Settings
        </Link>{' '}
        to see a countdown.
      </p>
    )

  const countdown = examCountdown(toLocalDate(now), examDate)
  return (
    <section
      aria-label="Test countdown"
      className="rounded-card border border-border bg-surface p-4"
    >
      {countdown.kind === 'future' && (
        <p className="text-2xl font-bold">
          {countdown.days} {countdown.days === 1 ? 'day' : 'days'}{' '}
          <span className="text-base font-semibold">to your test</span>
        </p>
      )}
      {countdown.kind === 'today' && (
        <p className="text-2xl font-bold">Your test is today. Lycka till!</p>
      )}
      {countdown.kind === 'past' && (
        <p className="font-semibold">
          Your test date has passed.{' '}
          <Link to="/settings" className="text-accent">
            Update it in Settings
          </Link>
        </p>
      )}
      <p className="text-sm text-muted">{formatDayWithYear(examDate)}</p>
    </section>
  )
}
