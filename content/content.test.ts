// Checks the real content sources with the same rules as the build, so a bad
// pack fails `npm test` before it fails a build.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { ReadingPack } from '../src/domain/content/schema.ts'
import {
  packProblems,
  uncoveredPoints,
} from '../src/domain/content/validate.ts'
import {
  clipHash,
  readListeningSources,
  readLock,
  sourceAudioFile,
} from '../scripts/lib/listening.ts'

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

describe('the listening content in this repository', () => {
  it('parses, has no problems, and has up-to-date audio for every clip', async () => {
    const { packs, problems } = await readListeningSources()
    expect(problems).toEqual([])
    expect(packs.length).toBeGreaterThan(0)
    expect(packProblems(packs)).toEqual([])
    const lock = await readLock()
    for (const clip of packs.flatMap((p) => p.clips)) {
      expect(existsSync(sourceAudioFile(clip.id)), clip.id).toBe(true)
      expect(lock[clip.id], clip.id).toBe(clipHash(clip))
    }
  })
})
