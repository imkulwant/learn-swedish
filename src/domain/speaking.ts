/**
 * The solo speaking task at D, "Berätta och ge råd": the learner plans, then
 * speaks for 3–4 minutes. The planning time on the test is not confirmed
 * (see docs/PLAN.md), so it is the app's own choice and the learner may start
 * speaking sooner.
 */
export const SOLO = {
  planSeconds: 120,
  minSeconds: 180,
  maxSeconds: 240,
} as const

/** Word-count range of a model answer: about three minutes of calm speech. */
export const MODEL_WORDS = { min: 150, max: 450 } as const

/**
 * The learner's self-assessment of one recording, from the KP27 pass
 * criteria for D: speaks understandably, partly connected, partly adapted to
 * purpose and listener. Each criterion scores 0, 1 or 2.
 */
export const SPEAKING_RUBRIC = [
  {
    id: 'task',
    name: 'The task',
    question: 'Did you both tell about your own experience and give advice?',
  },
  {
    id: 'understandable',
    name: 'Understandable',
    question:
      'Would a Swede understand you without effort, even with an accent?',
  },
  {
    id: 'connected',
    name: 'Connected',
    question:
      'Did words such as först, sedan, därför and men tie what you said together?',
  },
  {
    id: 'listener',
    name: 'The listener',
    question: 'Did your advice fit the person you were talking to?',
  },
  {
    id: 'language',
    name: 'Grammar and words',
    question:
      'Were word order, verb forms and words mostly right, so mistakes did not get in the way?',
  },
  {
    id: 'flow',
    name: 'Keeping going',
    question:
      'Did you speak for about three minutes, without long stops or starting over?',
  },
] as const

export type SpeakingCriterion = (typeof SPEAKING_RUBRIC)[number]['id']
export type SpeakingRubric = Record<SpeakingCriterion, 0 | 1 | 2>

export const speakingPercent = (rubric: SpeakingRubric): number =>
  Math.floor(
    (SPEAKING_RUBRIC.reduce((n, c) => n + rubric[c.id], 0) /
      (SPEAKING_RUBRIC.length * 2)) *
      100,
  )

/** "3:05" from milliseconds, for timers and recording lengths. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
