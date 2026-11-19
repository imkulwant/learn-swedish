import { addDays, eachDate, startOfWeek } from './dates.ts'
import type { LocalDate } from './types.ts'

// The study calendar, copied from the workout tracker's training calendar
// and adapted (docs/PLAN.md, reuse list). Thresholds are named constants.

/** The calendar covers this many calendar weeks, ending with the current one. */
export const CALENDAR_WEEKS = 26
/** Non-zero days are ranked at these percentiles into levels 1 to 4. */
export const CALENDAR_PERCENTILES = [0.25, 0.5, 0.75] as const
/** With fewer non-zero days than this, ranking means nothing. */
export const CALENDAR_MIN_DAYS_FOR_PERCENTILES = 4
/** The level every non-zero day gets when there are too few to rank. */
export const CALENDAR_FEW_DAYS_LEVEL = 2

export type Level = 0 | 1 | 2 | 3 | 4

function percentile(sorted: readonly number[], fraction: number): number {
  const rank = Math.max(1, Math.ceil(fraction * sorted.length))
  return sorted[rank - 1]!
}

/**
 * Levels for the dates from `from` to `to`. Level 0 is no value. Non-zero
 * days are ranked against each other: up to the 25th percentile is level 1,
 * up to the 50th level 2, up to the 75th level 3, above that level 4. With
 * fewer than four non-zero days they are all level 2.
 */
export function calendarLevels(
  values: ReadonlyMap<LocalDate, number>,
  from: LocalDate,
  to: LocalDate,
): Map<LocalDate, Level> {
  const visible = eachDate(from, to).flatMap((date): [LocalDate, number][] => {
    const value = values.get(date)
    return value !== undefined && value > 0 ? [[date, value]] : []
  })
  const sorted = visible.map(([, value]) => value).sort((a, b) => a - b)
  const levels = new Map<LocalDate, Level>()
  if (sorted.length < CALENDAR_MIN_DAYS_FOR_PERCENTILES) {
    for (const [date] of visible) levels.set(date, CALENDAR_FEW_DAYS_LEVEL)
    return levels
  }
  const [p1, p2, p3] = CALENDAR_PERCENTILES.map((f) =>
    percentile(sorted, f),
  ) as [number, number, number]
  for (const [date, value] of visible)
    levels.set(date, value <= p1 ? 1 : value <= p2 ? 2 : value <= p3 ? 3 : 4)
  return levels
}

export interface CalendarWeek {
  weekStart: LocalDate
  /** Monday to Sunday. Days after today are null. */
  days: (LocalDate | null)[]
}

/** The columns of the calendar, oldest first, the last one holding today. */
export function calendarWeeks(
  today: LocalDate,
  weeks: number = CALENDAR_WEEKS,
): CalendarWeek[] {
  const first = addDays(startOfWeek(today), -7 * (weeks - 1))
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = addDays(first, 7 * i)
    return {
      weekStart,
      days: Array.from({ length: 7 }, (_, d) => {
        const date = addDays(weekStart, d)
        return date > today ? null : date
      }),
    }
  })
}
