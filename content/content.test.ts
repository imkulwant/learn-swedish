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
  audioHash,
  readAudioSources,
  readGrammarSources,
  readWritingSources,
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

describe('the listening and word content in this repository', () => {
  it('parses, has no problems, and has up-to-date audio for every clip and word', async () => {
    const { sources, listening, vocab, speaking, everyday, problems } =
      await readAudioSources()
    expect(problems).toEqual([])
    expect(listening.length).toBeGreaterThan(0)
    expect(vocab.length).toBeGreaterThan(0)
    expect(speaking.length).toBeGreaterThan(0)
    expect(everyday.length).toBeGreaterThan(0)
    expect(
      packProblems([...listening, ...vocab, ...speaking, ...everyday]),
    ).toEqual([])
    const lock = await readLock()
    for (const source of sources) {
      expect(existsSync(sourceAudioFile(source.id)), source.id).toBe(true)
      expect(lock[source.id], source.id).toBe(audioHash(source))
    }
  })
})

describe('the grammar content in this repository', () => {
  it('parses, has no problems, and covers the grammar points of KP27', async () => {
    const { packs, problems } = await readGrammarSources()
    expect(problems).toEqual([])
    expect(packs.length).toBeGreaterThan(0)
    expect(packProblems(packs)).toEqual([])
    const covered = new Set(
      packs.flatMap((p) => p.lessons.flatMap((l) => l.kp27)),
    )
    for (const point of [
      'sprak.meningsbyggnad',
      'sprak.ordforrad-bojning',
      'sprak.textbindning',
    ] as const)
      expect(covered.has(point), point).toBe(true)
  })
})

describe('the writing content in this repository', () => {
  it('parses, has no problems, and has an informal and a formal task', async () => {
    const { packs, problems } = await readWritingSources()
    expect(problems).toEqual([])
    expect(packProblems(packs)).toEqual([])
    const registers = new Set(
      packs.flatMap((p) => p.prompts.map((q) => q.register)),
    )
    expect([...registers].sort()).toEqual(['formal', 'informal'])
  })
})
