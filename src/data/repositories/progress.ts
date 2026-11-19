import { startOfWeek, toLocalDate } from '../../domain/dates'
import { EXAM_ORDER } from '../../domain/examFormat'
import { PLAN } from '../../domain/studyPlan'
import type { LocalDate, Writing } from '../../domain/types'
import { db } from '../db'

/**
 * How many things the learner did each day: answers, word cards, texts
 * handed in, recordings and answers in discussions. Used for the streak and
 * the study calendar. Audio is never read.
 */
export async function activityByDay(): Promise<Map<LocalDate, number>> {
  const days = new Map<LocalDate, number>()
  const add = (date: LocalDate, n = 1) =>
    days.set(date, (days.get(date) ?? 0) + n)
  await db.attempts.each((a) => add(toLocalDate(a.answeredAt)))
  await db.studyDays.each((d) => add(d.date, d.reviews))
  await db.writings.each(
    (w) => w.submittedAt !== null && add(toLocalDate(w.submittedAt)),
  )
  await db.recordings.each((r) => add(toLocalDate(r.createdAt)))
  await db.pairSessions.each((s) =>
    add(toLocalDate(s.createdAt), s.turns.length),
  )
  // A mock part is long work whose answers are stored only at the end, so a
  // finished part makes its day a study day by itself.
  await db.mocks.each((run) => {
    for (const skill of EXAM_ORDER) {
      const done = run.parts[skill].finishedAt
      if (done !== null) add(toLocalDate(done), PLAN.studyDayActions)
    }
  })
  return days
}

/** Texts handed in, and speaking recorded, since Monday. */
export async function thisWeek(
  today: LocalDate,
): Promise<{ writing: number; speaking: number }> {
  const monday = startOfWeek(today)
  const from = new Date(`${monday}T00:00:00`).getTime()
  const since = (at: number | null) => at !== null && toLocalDate(at) >= monday
  // Texts written in a mock count too, once its Skriva part is done.
  const mockTexts = (await db.mocks.toArray())
    .filter((run) => since(run.parts.skriva.finishedAt))
    .reduce(
      (n, run) => n + Object.values(run.texts).filter((t) => t.trim()).length,
      0,
    )
  const writing =
    (await db.writings.toArray()).filter((w) => since(w.submittedAt)).length +
    mockTexts
  const speaking =
    (await db.recordings.where('createdAt').aboveOrEqual(from).count()) +
    (await db.pairSessions.where('createdAt').aboveOrEqual(from).count())
  return { writing, speaking }
}

/** Texts handed in, newest first, for the archive. */
export async function handedInWritings(): Promise<Writing[]> {
  return (await db.writings.toArray())
    .filter((w) => w.submittedAt !== null)
    .sort((a, b) => b.submittedAt! - a.submittedAt!)
}

/** How many recordings and discussions the phone holds. */
export async function speakingCounts(): Promise<{
  recordings: number
  discussions: number
}> {
  return {
    recordings: await db.recordings.count(),
    discussions: await db.pairSessions.count(),
  }
}
