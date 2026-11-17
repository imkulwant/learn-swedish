import { describe, expect, it } from 'vitest'
import {
  gradeShort,
  normalizeAnswer,
  scoreMatch,
  scoreMc,
} from './answerCheck.ts'
import type { MatchItem, McItem, ShortItem } from './content/schema.ts'

const short: ShortItem = {
  type: 'short',
  id: 's',
  prompt: 'Vad kan man låna?',
  accept: ['cykel och hjälm', '6 km'],
  model: 'Cykel och hjälm.',
  explain: '-',
}

describe('normalizeAnswer', () => {
  it.each([
    ['  Cykel  och   HJÄLM. ', 'cykel och hjälm'],
    ['"Sex gånger!"', 'sex gånger'],
    ['(Svenska i yrkeslivet)', 'svenska i yrkeslivet'],
    ['Å Ä Ö', 'å ä ö'],
    // A decomposed "ä" (a + combining diaeresis) equals the composed one.
    ['hälsa', 'hälsa'],
    ['…ja?', 'ja'],
    // iOS Smart Punctuation turns typed quotes into curly ones.
    ['‘sex gånger’', 'sex gånger'],
    ['“6 km”', '6 km'],
    ['— ja —', 'ja'],
  ])('%j becomes %j', (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected)
  })

  it('keeps punctuation inside the answer', () => {
    expect(normalizeAnswer('17.30–19.00')).toBe('17.30–19.00')
  })
})

describe('gradeShort', () => {
  it('accepts any listed answer after normalization', () => {
    expect(gradeShort(short, 'Cykel och hjälm.')).toBe('correct')
    expect(gradeShort(short, '6 KM')).toBe('correct')
  })

  it('leaves anything else for the learner to judge against the model', () => {
    expect(gradeShort(short, 'en cykel')).toBe('unmatched')
    expect(gradeShort(short, '')).toBe('unmatched')
  })
})

describe('scoreMc', () => {
  const mc: McItem = {
    type: 'mc',
    id: 'm',
    prompt: '?',
    options: ['a', 'b', 'c'],
    answer: 1,
    explain: '-',
  }
  it('scores 1 of 1 only for the correct option', () => {
    expect(scoreMc(mc, 1)).toEqual({ score: 1, maxScore: 1 })
    expect(scoreMc(mc, 0)).toEqual({ score: 0, maxScore: 1 })
  })
})

describe('scoreMatch', () => {
  const match: MatchItem = {
    type: 'match',
    id: 'p',
    prompt: '?',
    pairs: [
      { q: 'q1', answer: 2 },
      { q: 'q2', answer: 0 },
      { q: 'q3', answer: 1 },
    ],
    options: ['a', 'b', 'c', 'd'],
    explain: '-',
  }
  it('gives one point per correct pair', () => {
    expect(scoreMatch(match, [2, 0, 1])).toEqual({ score: 3, maxScore: 3 })
    expect(scoreMatch(match, [2, 1, 0])).toEqual({ score: 1, maxScore: 3 })
  })
  it('counts an unanswered pair as wrong', () => {
    expect(scoreMatch(match, [2, null, null])).toEqual({
      score: 1,
      maxScore: 3,
    })
  })
})
