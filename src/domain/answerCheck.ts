import type { MatchItem, McItem, ShortItem } from './content/schema.ts'

export interface Points {
  score: number
  maxScore: number
}

// Punctuation that may wrap an answer but never changes its meaning.
// Includes the curly quotes iOS Smart Punctuation types for ' and ".
const EDGE_PUNCTUATION =
  /^[\s.,!?;:"'”“„«»‘’‚‹›()…—–-]+|[\s.,!?;:"'”“„«»‘’‚‹›()…—–-]+$/gu

/**
 * Makes two spellings of one answer compare equal: one Unicode form, Swedish
 * lower case, single spaces, and no punctuation around it.
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .normalize('NFC')
    .toLocaleLowerCase('sv')
    .replace(/\s+/g, ' ')
    .replace(EDGE_PUNCTUATION, '')
}

/**
 * A short answer is correct when it matches an accepted answer. Otherwise the
 * app cannot know: the learner compares it with the model answer and decides.
 */
export function gradeShort(
  item: ShortItem,
  answer: string,
): 'correct' | 'unmatched' {
  const given = normalizeAnswer(answer)
  if (!given) return 'unmatched'
  return item.accept.some((a) => normalizeAnswer(a) === given)
    ? 'correct'
    : 'unmatched'
}

export const scoreMc = (item: McItem, choice: number): Points => ({
  score: choice === item.answer ? 1 : 0,
  maxScore: 1,
})

/** One point per correctly matched pair; an unanswered pair scores nothing. */
export const scoreMatch = (
  item: MatchItem,
  choices: (number | null)[],
): Points => ({
  score: item.pairs.filter((pair, i) => choices[i] === pair.answer).length,
  maxScore: item.pairs.length,
})
