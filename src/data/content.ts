import {
  CompiledListeningPack,
  CompiledVocabPack,
  ContentManifest,
  GrammarPack,
  ReadingPack,
  type GrammarLesson,
  type Level,
  type PackSummary,
  type Skill,
  type Word,
} from '../domain/content/schema'
import type { QueueWord } from '../domain/srs'
import { pruneAudio } from '../platform/audioCache'

// Content is static JSON next to the app, cached by the service worker. It is
// checked again here, so a damaged file shows an error instead of a broken drill.

/** The full address of a file the app serves, such as a clip's audio. */
export const appUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(appUrl(`content/${path}`))
  if (!response.ok)
    throw new Error(`content/${path} answered ${response.status}`)
  return response.json()
}

let manifest: Promise<ContentManifest> | null = null

export function loadManifest(): Promise<ContentManifest> {
  if (!manifest) {
    manifest = getJson('manifest.json').then((raw) => {
      const parsed = ContentManifest.parse(raw)
      // Audio of clips that changed or left the app is dropped from storage.
      void pruneAudio(
        parsed.packs.flatMap((p) => p.audio?.files ?? []).map(appUrl),
      ).catch(() => {})
      return parsed
    })
    // A failed load is not kept, so the next screen can try again.
    manifest.catch(() => {
      manifest = null
    })
  }
  return manifest
}

export async function listPacks(
  level: Level,
  skill: Skill,
): Promise<PackSummary[]> {
  const { packs } = await loadManifest()
  return packs.filter((p) => p.level === level && p.skill === skill)
}

async function packFile(
  id: string,
  skill: Skill | 'ord' | 'grammatik',
): Promise<unknown> {
  const summary = (await loadManifest()).packs.find(
    (p) => p.id === id && p.skill === skill,
  )
  if (!summary) throw new Error(`There is no pack called ${id} here.`)
  return getJson(summary.file)
}

export async function loadReadingPack(id: string): Promise<ReadingPack> {
  return ReadingPack.parse(await packFile(id, 'lasa'))
}

export async function loadListeningPack(
  id: string,
): Promise<CompiledListeningPack> {
  return CompiledListeningPack.parse(await packFile(id, 'hora'))
}

export async function loadVocabPack(id: string): Promise<CompiledVocabPack> {
  return CompiledVocabPack.parse(await packFile(id, 'ord'))
}

export async function loadGrammarPack(id: string): Promise<GrammarPack> {
  return GrammarPack.parse(await packFile(id, 'grammatik'))
}

/**
 * Levels whose words and lessons someone preparing for `level` practises:
 * C before D.
 */
export const practiceLevels = (level: Level): Level[] =>
  level === 'D' ? ['C', 'D'] : ['C']

export interface OfferedLesson {
  lesson: GrammarLesson
  pack: Pick<GrammarPack, 'id' | 'version' | 'level'>
}

/** The grammar lessons of these levels, in teaching order. */
export async function loadLessons(levels: Level[]): Promise<OfferedLesson[]> {
  const summaries = (await loadManifest()).packs
    .filter((p) => p.skill === 'grammatik' && levels.includes(p.level))
    .sort((a, b) => levels.indexOf(a.level) - levels.indexOf(b.level))
  const packs = await Promise.all(summaries.map((p) => loadGrammarPack(p.id)))
  return packs.flatMap((pack) =>
    pack.lessons.map((lesson) => ({
      lesson,
      pack: { id: pack.id, version: pack.version, level: pack.level },
    })),
  )
}

export interface OfferedWord extends QueueWord {
  word: Word
  /** Where the word's audio is served, relative to the base. */
  audioPath: string
}

export interface OfferedVocab {
  packs: PackSummary[]
  /** Every word to practise, in pack order. */
  words: OfferedWord[]
  byId: Map<string, OfferedWord>
}

/** The words a learner preparing for `level` practises, C words first. */
export async function loadOfferedVocab(level: Level): Promise<OfferedVocab> {
  const levels = practiceLevels(level)
  const summaries = (await loadManifest()).packs
    .filter((p) => p.skill === 'ord' && levels.includes(p.level))
    .sort((a, b) => levels.indexOf(a.level) - levels.indexOf(b.level))
  const packs = await Promise.all(summaries.map((p) => loadVocabPack(p.id)))
  const words = packs.flatMap((pack) =>
    pack.words.map((word) => ({
      wordId: word.id,
      packId: pack.id,
      word,
      audioPath: pack.audio[word.id]!,
    })),
  )
  return {
    packs: summaries,
    words,
    byId: new Map(words.map((w) => [w.wordId, w])),
  }
}
