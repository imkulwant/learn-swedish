import { daysBetween } from './dates.ts'
import type { LocalDate } from './types.ts'

export type Countdown =
  { kind: 'future'; days: number } | { kind: 'today' } | { kind: 'past' }

/** Where the exam date is, seen from today. */
export function examCountdown(
  today: LocalDate,
  examDate: LocalDate,
): Countdown {
  const days = daysBetween(today, examDate)
  if (days > 0) return { kind: 'future', days }
  return days === 0 ? { kind: 'today' } : { kind: 'past' }
}
