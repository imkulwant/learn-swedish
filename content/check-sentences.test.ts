// The writing checks against sentences a reviewer has approved, so a change
// to a check or a sentence fails `npm test`.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { biffMisses, v2Misses } from '../src/domain/writingChecks.ts'

const sentences = parse(
  readFileSync(new URL('./check-sentences.yaml', import.meta.url), 'utf8'),
) as Record<'v2' | 'biff', { flag: string[]; ok: string[] }>

describe.each([
  ['v2', v2Misses],
  ['biff', biffMisses],
] as const)('%s check', (name, find) => {
  it.each(sentences[name].flag)('flags %j', (sentence) => {
    expect(find(sentence)).toHaveLength(1)
  })
  it.each(sentences[name].ok)('leaves %j alone', (sentence) => {
    expect(find(sentence)).toEqual([])
  })
})
