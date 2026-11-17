// Checks the real content sources with the same rules as the build, so a bad
// pack fails `npm test` before it fails a build.
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { ReadingPack } from '../src/domain/content/schema.ts'
import {
  packProblems,
  uncoveredPoints,
} from '../src/domain/content/validate.ts'

describe('the content in this repository', () => {
  const dir = new URL('./reading/', import.meta.url)
  const packs = readdirSync(dir)
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => ReadingPack.parse(parse(readFileSync(new URL(f, dir), 'utf8'))))

  it('parses and has no problems', () => {
    expect(packs.length).toBeGreaterThan(0)
    expect(packProblems(packs)).toEqual([])
  })

  it('covers every "Lyssna och läsa" point of KP27 that reading can train', () => {
    const missing = uncoveredPoints(packs).filter((p) =>
      p.startsWith('lyssna-lasa.'),
    )
    expect(missing).toEqual([])
  })
})
