import { describe, expect, it } from 'vitest'
import { checkWriting, countWords, type WritingTask } from './writingChecks.ts'

const informal: WritingTask = {
  register: 'informal',
  words: { min: 20, max: 80 },
}
const formal: WritingTask = { ...informal, register: 'formal' }

const letter = `Hej Sara!

Tack för senast. Jag har börjat på en ny kurs, och den är rolig eftersom vi pratar mycket.

Dessutom har jag fått ett nytt jobb på ett kafé. Därför har jag inte så mycket tid just nu.

Kram
Amir`

const status = (text: string, task: WritingTask) =>
  Object.fromEntries(checkWriting(text, task).map((c) => [c.id, c.status]))

describe('checkWriting', () => {
  it('finds nothing to check in a good informal letter', () => {
    expect(status(letter, informal)).toEqual({
      length: 'ok',
      paragraphs: 'ok',
      greeting: 'ok',
      closing: 'ok',
      linking: 'ok',
      v2: 'ok',
      biff: 'ok',
      repeats: 'ok',
    })
  })

  it('flags a friendly closing in a formal letter, and quotes the greeting it found', () => {
    const checks = checkWriting(letter.replace('Hej Sara!', 'Hejsan!'), formal)
    expect(checks.find((c) => c.id === 'greeting')).toMatchObject({
      status: 'check',
      title: 'A greeting for friends',
    })
    expect(checks.find((c) => c.id === 'closing')).toMatchObject({
      status: 'check',
      detail: expect.stringContaining('"kram"'),
    })
  })

  it('accepts a formal greeting and closing', () => {
    const text = letter
      .replace('Hej Sara!', 'Hej Anders Berg,')
      .replace('Kram\nAmir', 'Med vänliga hälsningar\nAmir Karimi')
    expect(status(text, formal)).toMatchObject({
      greeting: 'ok',
      closing: 'ok',
    })
  })

  it('flags a missing greeting and closing', () => {
    expect(status('Jag vill säga upp min lägenhet.', formal)).toMatchObject({
      greeting: 'check',
      closing: 'check',
    })
  })

  it('flags length outside the range', () => {
    expect(status('Hej!', informal).length).toBe('check')
    expect(status('ord '.repeat(81), informal).length).toBe('check')
  })

  it('flags one long block of text', () => {
    const block = 'Jag har börjat på en ny kurs och den är rolig. '.repeat(7)
    expect(status(block, informal).paragraphs).toBe('check')
    expect(
      status(block.replace('. Jag', '.\n\nJag'), informal).paragraphs,
    ).toBe('ok')
  })

  it('flags few linking words and words used four times', () => {
    const text =
      'Jag gillar jobbet. Jobbet är bra. Jobbet är kul. Jobbet är nära.'
    const checks = checkWriting(text, informal)
    expect(checks.find((c) => c.id === 'linking')?.status).toBe('check')
    expect(checks.find((c) => c.id === 'repeats')).toMatchObject({
      status: 'check',
      quotes: ['jobbet (4 times)'],
    })
  })

  it('quotes the start of a possible V2 miss', () => {
    expect(
      checkWriting('Igår jag var sjuk.', informal).find((c) => c.id === 'v2')
        ?.quotes,
    ).toEqual(['igår jag var…'])
  })
})

describe('countWords', () => {
  it.each([
    ['', 0],
    ['Hej Sara!', 2],
    ['  Jag   bor i Malmö. ', 4],
    ['e-post 2026 och 1177', 2],
  ])('%j has %i words', (text, n) => {
    expect(countWords(text)).toBe(n)
  })
})
