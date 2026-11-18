import type { Level } from './content/schema.ts'
import { READINESS, type Readiness } from './readiness.ts'

/**
 * The learner's self-assessment of one text, made from the KP27 pass criteria
 * for D: simple informal and more formal texts, a mostly working structure,
 * some confidence in grammar, and some variation. Each criterion scores
 * 0 (not yet), 1 (partly) or 2 (yes).
 */
export const RUBRIC = [
  {
    id: 'task',
    name: 'The task',
    question: 'Did you write about every point of the task?',
  },
  {
    id: 'register',
    name: 'The reader',
    question:
      'Does the tone fit the reader: friendly to a friend, more formal to a landlord, employer or authority?',
  },
  {
    id: 'structure',
    name: 'Structure',
    question:
      'Is there a greeting, a paragraph for each thing you write about, and a closing?',
  },
  {
    id: 'linking',
    name: 'Linking words',
    question:
      'Do words such as eftersom, men, därför and sedan link your sentences?',
  },
  {
    id: 'grammar',
    name: 'Grammar',
    question:
      'Are word order, verb forms and endings mostly right, so the reader understands without effort?',
  },
  {
    id: 'variation',
    name: 'Variation',
    question:
      'Do you use varied words and sentences, not the same few again and again?',
  },
] as const

export type CriterionId = (typeof RUBRIC)[number]['id']
export type RubricScore = 0 | 1 | 2
export type Rubric = Record<CriterionId, RubricScore>

export const RUBRIC_MAX = RUBRIC.length * 2

export const rubricPoints = (rubric: Rubric): number =>
  RUBRIC.reduce((n, c) => n + rubric[c.id], 0)

/** Rounded down, like every readiness percentage. */
export const rubricPercent = (rubric: Rubric): number =>
  Math.floor((rubricPoints(rubric) / RUBRIC_MAX) * 100)

/**
 * The length the app suggests for one writing task. The test's own expected
 * lengths are not confirmed (see docs/PLAN.md), so the check panel only says
 * "check this" outside these ranges.
 */
export const WRITING_WORDS: Record<Level, { min: number; max: number }> = {
  C: { min: 50, max: 150 },
  D: { min: 80, max: 200 },
}

/** Readiness for Skriva and Tala: the mean of the latest self-assessments. */
export const SELF_ASSESSED = {
  window: 5,
  minTasks: 3,
} as const

/** Readiness from self-assessed tasks, each a percent and when it was assessed. */
export function selfAssessedReadiness(
  tasks: { percent: number; assessedAt: number }[],
): Readiness {
  const recent = [...tasks]
    .sort((a, b) => b.assessedAt - a.assessedAt)
    .slice(0, SELF_ASSESSED.window)
  if (recent.length < SELF_ASSESSED.minTasks)
    return {
      status: 'insufficient',
      count: recent.length,
      needed: SELF_ASSESSED.minTasks,
    }
  const exact = recent.reduce((n, t) => n + t.percent, 0) / recent.length
  const status =
    exact >= READINESS.ready
      ? 'ready'
      : exact >= READINESS.almost
        ? 'almost'
        : 'not-yet'
  return { status, percent: Math.floor(exact), count: recent.length }
}
