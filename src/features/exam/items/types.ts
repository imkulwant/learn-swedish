import type { Attempt } from '../../../domain/types'

/** What a question reports once it has been answered and checked. */
export type Answered = Pick<
  Attempt,
  'score' | 'maxScore' | 'selfMarked' | 'response'
>

/** Stores the answer. A question shows itself as answered only once this resolves. */
export type OnAnswered = (answer: Answered) => Promise<void>
