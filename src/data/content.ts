import {
  CompiledListeningPack,
  CompiledMockPack,
  CompiledScenarioPack,
  CompiledSpeakingPack,
  CompiledVocabPack,
  ContentManifest,
  GrammarPack,
  ReadingPack,
  WritingPack,
  type WritingPrompt,
  type GrammarLesson,
  type Line,
  type PairTopic,
  type Scenario,
  type PhraseCard,
  type SpeakingTask,
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
  skill: Skill | 'ord' | 'grammatik' | 'vardag' | 'prov',
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

export interface OfferedTask {
  task: SpeakingTask
  pack: Pick<CompiledSpeakingPack, 'id' | 'version' | 'level'>
  /** Where the model answer's audio is served, relative to the base. */
  audioPath: string
}

/** Every speaking task of one level, in pack order. */
export async function loadSpeakingTasks(level: Level): Promise<OfferedTask[]> {
  const summaries = (await loadManifest()).packs.filter(
    (p) => p.skill === 'tala' && p.level === level,
  )
  const packs = await Promise.all(
    summaries.map(async (p) =>
      CompiledSpeakingPack.parse(await packFile(p.id, 'tala')),
    ),
  )
  return packs.flatMap((pack) =>
    pack.tasks.map((task) => ({
      task,
      pack: { id: pack.id, version: pack.version, level: pack.level },
      audioPath: pack.audio[task.id]!,
    })),
  )
}

export interface OfferedMock {
  mock: CompiledMockPack
  /** The speaking parts, shaped like the drills' so their screens fit. */
  tasks: OfferedTask[]
  pairs: OfferedPair[]
}

/** Every mock exam the app has, of any level. */
export async function listMocks(): Promise<PackSummary[]> {
  return (await loadManifest()).packs.filter((p) => p.skill === 'prov')
}

export async function loadMock(id: string): Promise<OfferedMock> {
  const mock = CompiledMockPack.parse(await packFile(id, 'prov'))
  const pack = { id: mock.id, version: mock.version, level: mock.level }
  return {
    mock,
    tasks: mock.tala.tasks.map((task) => ({
      task,
      pack,
      audioPath: mock.audio[task.id]!,
    })),
    pairs: mock.tala.pairs.map((topic) => ({
      topic,
      pack,
      phraseCards: mock.tala.phraseCards,
      script: {
        id: topic.id,
        partner: topic.partner,
        closing: topic.closing,
        turnAudio: topic.partner.map(
          (_, i) => mock.audio[`${topic.id}-${i + 1}`]!,
        ),
        closingAudio: mock.audio[`${topic.id}-slut`]!,
        pack,
      },
    })),
  }
}

export interface OfferedScenario {
  scenario: Scenario
  pack: { id: string; version: number; level: Level }
  /** Where each audio file of the scenario is served, by its key. */
  audio: Record<string, string>
  script: PartnerScript
}

/**
 * Every everyday scenario, whatever the learner's level: everyday Swedish is
 * for everyone.
 */
export async function loadScenarios(): Promise<OfferedScenario[]> {
  const summaries = (await loadManifest()).packs.filter(
    (p) => p.skill === 'vardag',
  )
  const packs = await Promise.all(
    summaries.map(async (p) =>
      CompiledScenarioPack.parse(await packFile(p.id, 'vardag')),
    ),
  )
  return packs.flatMap((pack) =>
    pack.scenarios.map((scenario) => {
      const summary = { id: pack.id, version: pack.version, level: pack.level }
      const { id, roleplay } = scenario
      return {
        scenario,
        pack: summary,
        audio: pack.audio,
        script: {
          id,
          partner: roleplay.partner,
          closing: roleplay.closing,
          turnAudio: roleplay.partner.map(
            (_, i) => pack.audio[`${id}-roll-${i + 1}`]!,
          ),
          closingAudio: pack.audio[`${id}-roll-slut`]!,
          pack: summary,
          hints: roleplay.hints,
        },
      }
    }),
  )
}

/**
 * What a scripted partner says, one line at a time, with its audio. Pair
 * discussions and everyday role-plays both have one.
 */
export interface PartnerScript {
  /** The topic or scenario; discussions are stored under it. */
  id: string
  partner: Line[]
  closing: Line
  turnAudio: string[]
  closingAudio: string
  pack: { id: string; version: number; level: Level }
  /** What the learner might say after each line. */
  hints?: { en: string; example: string }[]
}

export interface OfferedPair {
  topic: PairTopic
  pack: Pick<CompiledSpeakingPack, 'id' | 'version' | 'level'>
  phraseCards: PhraseCard[]
  /** The audio of each partner line, in order, then of the closing line. */
  script: PartnerScript
}

/** Every pair discussion topic of one level, in pack order. */
export async function loadPairTopics(level: Level): Promise<OfferedPair[]> {
  const summaries = (await loadManifest()).packs.filter(
    (p) => p.skill === 'tala' && p.level === level,
  )
  const packs = await Promise.all(
    summaries.map(async (p) =>
      CompiledSpeakingPack.parse(await packFile(p.id, 'tala')),
    ),
  )
  return packs.flatMap((pack) =>
    pack.pairs.map((topic) => {
      const summary = { id: pack.id, version: pack.version, level: pack.level }
      return {
        topic,
        pack: summary,
        phraseCards: pack.phraseCards,
        script: {
          id: topic.id,
          partner: topic.partner,
          closing: topic.closing,
          turnAudio: topic.partner.map(
            (_, i) => pack.audio[`${topic.id}-${i + 1}`]!,
          ),
          closingAudio: pack.audio[`${topic.id}-slut`]!,
          pack: summary,
        },
      }
    }),
  )
}

export interface OfferedPrompt {
  prompt: WritingPrompt
  pack: Pick<WritingPack, 'id' | 'version' | 'level'>
}

/** Every writing prompt of one level, in pack order. */
export async function loadPrompts(level: Level): Promise<OfferedPrompt[]> {
  const summaries = (await loadManifest()).packs.filter(
    (p) => p.skill === 'skriva' && p.level === level,
  )
  const packs = await Promise.all(
    summaries.map(async (p) =>
      WritingPack.parse(await packFile(p.id, 'skriva')),
    ),
  )
  return packs.flatMap((pack) =>
    pack.prompts.map((prompt) => ({
      prompt,
      pack: { id: pack.id, version: pack.version, level: pack.level },
    })),
  )
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
