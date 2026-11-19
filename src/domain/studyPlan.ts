import { daysBetween, addDays } from './dates.ts'
import type { Skill } from './content/schema.ts'
import { EXAM_ORDER, PART_NAMES } from './examFormat.ts'
import type { Readiness } from './readiness.ts'
import type { LocalDate } from './types.ts'

/**
 * The rules of the daily plan (docs/PLAN.md, Today). Each is a named
 * constant, so it can be tuned without touching a screen.
 */
export const PLAN = {
  /** Texts and recordings to aim for each week, Monday to Sunday. */
  writingPerWeek: 2,
  speakingPerWeek: 2,
  /** Within this many days of the test, a mock part each day. */
  mockWindowDays: 21,
  /** Days before the test with a whole mock. */
  fullMockDays: [7, 3],
  /** How long the focus drill is meant to take. */
  focusMinutes: 10,
  /** Things done on a day for it to count as a study day. */
  studyDayActions: 5,
} as const

export interface PlanInput {
  today: LocalDate
  examDate: LocalDate | null
  /** Word cards waiting today, due and new together. */
  wordsToday: number
  readiness: Record<Skill, Readiness>
  nextLesson: { id: string; title: string } | null
  /** Texts handed in and speaking answers recorded since Monday. */
  writingThisWeek: number
  speakingThisWeek: number
  /** The mock to work on: one in progress, or one to start or take again. */
  mock: {
    id: string
    title: string
    nextPart: Skill | null
    /** The learner's latest sitting of it is finished. */
    finished: boolean
    /** A part of a mock was finished today. */
    partDoneToday: boolean
  } | null
}

export interface PlanItem {
  id: 'mock' | 'words' | 'focus' | 'grammar' | 'writing' | 'speaking'
  title: string
  detail: string
  /** Where the learner goes to do it. */
  to: string
}

/**
 * How much a part needs practice: a part without enough answers to judge
 * comes first, then the lowest percentage. Ties keep the test's order.
 */
function weakestPart(readiness: Record<Skill, Readiness>): Skill {
  const need = (s: Skill) => {
    const r = readiness[s]
    return r.status === 'insufficient' ? -1 : r.percent
  }
  return [...EXAM_ORDER].sort((a, b) => need(a) - need(b))[0]!
}

/** Today's plan, most important first. */
export function studyPlan(input: PlanInput): PlanItem[] {
  const items: PlanItem[] = []
  const daysLeft =
    input.examDate === null ? null : daysBetween(input.today, input.examDate)

  const full =
    daysLeft !== null &&
    (PLAN.fullMockDays as readonly number[]).includes(daysLeft)
  if (
    input.mock &&
    daysLeft !== null &&
    daysLeft > 0 &&
    daysLeft <= PLAN.mockWindowDays &&
    // One part a day: once a part is done, the mock waits for tomorrow.
    (full || !input.mock.partDoneToday)
  ) {
    const part = input.mock.nextPart
    const days = `${daysLeft} day${daysLeft === 1 ? '' : 's'}`
    items.push({
      id: 'mock',
      title: full
        ? 'A whole mock exam today'
        : part
          ? `Mock exam: ${PART_NAMES[part]}`
          : input.mock.finished
            ? 'Take the mock again'
            : 'Start a mock exam',
      detail: full
        ? `${days} to the test: sit the whole mock, as on the day.`
        : `${days} to the test: one part of a mock a day.`,
      to: `/exam/prov/${input.mock.id}`,
    })
  }
  if (input.wordsToday > 0)
    items.push({
      id: 'words',
      title: `Practise ${input.wordsToday} word${input.wordsToday === 1 ? '' : 's'}`,
      detail: 'Words due today, and new ones.',
      to: '/learn/ord',
    })
  const weak = weakestPart(input.readiness)
  items.push({
    id: 'focus',
    title: `${PLAN.focusMinutes} minutes of ${PART_NAMES[weak]}`,
    detail:
      input.readiness[weak].status === 'insufficient'
        ? 'Your weakest part: not enough practice yet to judge it.'
        : `Your weakest part, at ${(input.readiness[weak] as { percent: number }).percent}%.`,
    to: `/exam/${weak}`,
  })
  if (input.nextLesson)
    items.push({
      id: 'grammar',
      title: `Grammar: ${input.nextLesson.title}`,
      detail: 'Your next lesson.',
      to: `/learn/grammatik/${input.nextLesson.id}`,
    })
  if (weak !== 'skriva' && input.writingThisWeek < PLAN.writingPerWeek)
    items.push({
      id: 'writing',
      title: 'Write a text',
      detail: `${input.writingThisWeek} of ${PLAN.writingPerWeek} this week.`,
      to: '/exam/skriva',
    })
  if (weak !== 'tala' && input.speakingThisWeek < PLAN.speakingPerWeek)
    items.push({
      id: 'speaking',
      title: 'Speak and record yourself',
      detail: `${input.speakingThisWeek} of ${PLAN.speakingPerWeek} this week.`,
      to: '/exam/tala',
    })
  return items
}

/**
 * Days in a row with study, ending today. A streak that ended yesterday
 * still counts until today is over, so the morning never shows zero.
 */
export function streak(
  actionsByDay: ReadonlyMap<LocalDate, number>,
  today: LocalDate,
): number {
  const studied = (d: LocalDate) =>
    (actionsByDay.get(d) ?? 0) >= PLAN.studyDayActions
  let day = studied(today) ? today : addDays(today, -1)
  let count = 0
  while (studied(day)) {
    count++
    day = addDays(day, -1)
  }
  return count
}
