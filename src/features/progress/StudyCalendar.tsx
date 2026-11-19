import { useEffect, useMemo, useRef } from 'react'
import { formatDayWithYear as formatDay } from '../../domain/format'
import {
  calendarLevels,
  calendarWeeks,
  type Level,
} from '../../domain/heatmaps'
import { PLAN } from '../../domain/studyPlan'
import type { LocalDate } from '../../domain/types'

// Copied from the workout tracker's training calendar and cut down to one
// measure: how many things were done each day.

const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')
const CELL = 14
const GAP = 3
const LEVEL_WORDS: Record<Level, string> = {
  0: 'none',
  1: 'low',
  2: 'some',
  3: 'high',
  4: 'highest',
}
const heatColor = (level: Level) => `var(--color-heat-${level})`

export function StudyCalendar({
  activity,
  today,
}: {
  activity: ReadonlyMap<LocalDate, number>
  today: LocalDate
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const weeks = useMemo(() => calendarWeeks(today), [today])
  const levels = useMemo(
    () => calendarLevels(activity, weeks[0]!.weekStart, today),
    [activity, weeks, today],
  )
  // Opens on the current week, at the right-hand end.
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [])

  return (
    <section aria-labelledby="calendar-heading" className="flex flex-col gap-3">
      <h2 id="calendar-heading" className="text-lg font-semibold">
        Study calendar
      </h2>
      <div className="flex gap-2">
        <div
          aria-hidden="true"
          className="flex shrink-0 flex-col pt-4 text-[10px] text-muted"
          style={{ gap: GAP }}
        >
          {['Mon', '', 'Wed', '', 'Fri', '', ''].map((label, i) => (
            <span key={i} style={{ height: CELL, lineHeight: `${CELL}px` }}>
              {label}
            </span>
          ))}
        </div>
        <div
          ref={scroller}
          // Scrolls sideways to earlier weeks, also from the keyboard.
          tabIndex={0}
          role="group"
          aria-label="Days, scroll back for earlier weeks"
          className="min-w-0 flex-1 overflow-x-auto pb-2"
        >
          <div className="flex" style={{ gap: GAP }}>
            {weeks.map((week, index) => {
              const first = week.days.find((d) => d !== null)!
              const month = Number(first.slice(5, 7))
              const showMonth =
                index === 0 ||
                Number(weeks[index - 1]!.weekStart.slice(5, 7)) !== month
              return (
                <div
                  key={week.weekStart}
                  className="flex flex-col"
                  style={{ gap: GAP }}
                >
                  <span
                    aria-hidden="true"
                    className="h-4 whitespace-nowrap text-[10px] text-muted"
                  >
                    {showMonth ? MONTHS[month - 1] : ''}
                  </span>
                  {week.days.map((date, d) => {
                    if (date === null)
                      return (
                        <span key={d} style={{ width: CELL, height: CELL }} />
                      )
                    const count = activity.get(date) ?? 0
                    const studyDay = count >= PLAN.studyDayActions
                    return (
                      <span
                        key={date}
                        role="img"
                        data-date={date}
                        aria-label={`${formatDay(date)}: ${count === 0 ? 'no study' : `${count} things done${studyDay ? ', a study day' : ''}`}`}
                        // A study day is outlined; lighter days are only shaded.
                        className={`rounded-[3px] border ${studyDay ? 'border-2 border-text' : 'border-border'}`}
                        style={{
                          width: CELL,
                          height: CELL,
                          background: heatColor(levels.get(date) ?? 0),
                        }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <p className="text-sm text-muted">
        Shading shows how much you did. An outlined day is a study day: at least{' '}
        {PLAN.studyDayActions} things done, such as answers, words, texts or
        recordings. A finished mock part counts as one.
      </p>
      <ul
        aria-label="Colour key, less to more"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted"
      >
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <li key={level} className="flex items-center gap-1">
            <span
              aria-hidden="true"
              className="inline-block size-3 rounded-sm border border-border"
              style={{ background: heatColor(level) }}
            />
            {LEVEL_WORDS[level]}
          </li>
        ))}
      </ul>
    </section>
  )
}
