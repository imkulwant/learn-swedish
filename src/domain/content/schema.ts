import { z } from 'zod'
import { KP27_POINT_IDS } from './kp27.ts'

// Zod compiles checks with new Function by default, which the app's
// Content-Security-Policy forbids.
z.config({ jitless: true })

// Content files are the specification of what learners see. They are checked
// here at build time, and again when the app loads a pack.

export const LEVELS = ['C', 'D'] as const
export type Level = (typeof LEVELS)[number]

export const SKILLS = ['lasa', 'hora', 'skriva', 'tala'] as const
export type Skill = (typeof SKILLS)[number]

const id = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'ids are lower-case words joined by -')
const text = z.string().trim().min(1)

const reviewFields = {
  status: z.enum(['draft', 'reviewed']),
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
}

const McItem = z
  .object({
    type: z.literal('mc'),
    id,
    prompt: text,
    options: z.array(text).min(2).max(6),
    /** Index of the one correct option. */
    answer: z.number().int().min(0),
    explain: text,
  })
  .strict()

const ShortItem = z
  .object({
    type: z.literal('short'),
    id,
    prompt: text,
    /** Accepted answers, compared after normalization. */
    accept: z.array(text).min(1),
    /** Shown when no accepted answer matches, so the learner can judge. */
    model: text,
    explain: text,
  })
  .strict()

const MatchItem = z
  .object({
    type: z.literal('match'),
    id,
    prompt: text,
    /** Each pair names the index of its correct option. */
    pairs: z
      .array(z.object({ q: text, answer: z.number().int().min(0) }).strict())
      .min(2),
    options: z.array(text).min(2),
    explain: text,
  })
  .strict()

export const Item = z.discriminatedUnion('type', [McItem, ShortItem, MatchItem])
export type Item = z.infer<typeof Item>
export type McItem = z.infer<typeof McItem>
export type ShortItem = z.infer<typeof ShortItem>
export type MatchItem = z.infer<typeof MatchItem>

const Block = z
  .object({
    heading: text.optional(),
    /** Who wrote this block, for chats and messages. */
    author: text.optional(),
    lines: z.array(text).min(1),
  })
  .strict()
export type Block = z.infer<typeof Block>

export const ReadingText = z
  .object({
    id,
    ...reviewFields,
    kp27: z.array(z.enum(KP27_POINT_IDS)).min(1),
    theme: text,
    /** The task instruction, in Swedish as on the test. */
    instruction: text,
    title: text,
    blocks: z.array(Block).min(1),
    items: z.array(Item).min(1),
  })
  .strict()
export type ReadingText = z.infer<typeof ReadingText>

export const ReadingPack = z
  .object({
    id,
    version: z.number().int().min(1),
    level: z.enum(LEVELS),
    skill: z.literal('lasa'),
    title: text,
    texts: z.array(ReadingText).min(1),
  })
  .strict()
export type ReadingPack = z.infer<typeof ReadingPack>

/** The text-to-speech voices audio is made with (see docs/DECISIONS.md). */
export const VOICES = ['nst', 'alma'] as const
export type Voice = (typeof VOICES)[number]

export const CLIP_KINDS = ['monolog', 'dialog', 'utrop', 'nyhet'] as const

const Line = z
  .object({
    voice: z.enum(VOICES),
    /** Who speaks, shown in the transcript. */
    speaker: text.optional(),
    /** What the transcript shows. */
    text,
    /** What the voice reads, when it must differ, for example "kvart över nio" for 9.15. */
    say: text.optional(),
  })
  .strict()
export type Line = z.infer<typeof Line>

export const ListeningClip = z
  .object({
    id,
    ...reviewFields,
    kp27: z.array(z.enum(KP27_POINT_IDS)).min(1),
    theme: text,
    kind: z.enum(CLIP_KINDS),
    instruction: text,
    title: text,
    lines: z.array(Line).min(1),
    items: z.array(Item).min(1),
  })
  .strict()
export type ListeningClip = z.infer<typeof ListeningClip>

export const ListeningPack = z
  .object({
    id,
    version: z.number().int().min(1),
    level: z.enum(LEVELS),
    skill: z.literal('hora'),
    title: text,
    clips: z.array(ListeningClip).min(1),
  })
  .strict()
export type ListeningPack = z.infer<typeof ListeningPack>

/**
 * A listening pack as the app receives it: the build adds where each clip's
 * audio is served. The file name carries a fingerprint of the audio, so a
 * changed clip gets a new address and no cache can serve the old one.
 */
export const CompiledListeningPack = ListeningPack.extend({
  audio: z.record(z.string(), z.string().regex(/^audio\/[a-z0-9-]+\.m4a$/)),
}).strict()
export type CompiledListeningPack = z.infer<typeof CompiledListeningPack>

export const PARTS_OF_SPEECH = ['noun', 'verb', 'adjective', 'phrase'] as const
export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number]

/**
 * How many forms each part of speech lists, in this order:
 * noun: en/ett form, definite, plural, definite plural ("en lön, lönen, löner, lönerna");
 * verb: infinitive with att, present, past, supine, imperative;
 * adjective: en form, ett form, plural/definite ("ledig, ledigt, lediga");
 * phrase: the phrase itself.
 */
export const FORM_COUNT: Record<PartOfSpeech, number> = {
  noun: 4,
  verb: 5,
  adjective: 3,
  phrase: 1,
}

export const Word = z
  .object({
    id,
    ...reviewFields,
    pos: z.enum(PARTS_OF_SPEECH),
    /** The forms, as FORM_COUNT describes. The first is what a card shows. */
    forms: z.array(text).min(1),
    /** The meaning in English. */
    en: text,
    example: z.object({ sv: text, en: text }).strict(),
    /** What the voice reads, when it must differ from the first form. */
    say: text.optional(),
  })
  .strict()
export type Word = z.infer<typeof Word>

export const VocabPack = z
  .object({
    id,
    version: z.number().int().min(1),
    level: z.enum(LEVELS),
    skill: z.literal('ord'),
    title: text,
    theme: text,
    words: z.array(Word).min(1),
  })
  .strict()
export type VocabPack = z.infer<typeof VocabPack>

/** A vocabulary pack as the app receives it, with where each word's audio is. */
export const CompiledVocabPack = VocabPack.extend({
  audio: z.record(z.string(), z.string().regex(/^audio\/[a-z0-9-]+\.m4a$/)),
}).strict()
export type CompiledVocabPack = z.infer<typeof CompiledVocabPack>

export const PackSummary = z
  .object({
    id,
    version: z.number().int(),
    level: z.enum(LEVELS),
    skill: z.enum([...SKILLS, 'ord']),
    title: text,
    /** Texts in a reading pack, clips in a listening pack, words in a vocabulary pack. */
    unitCount: z.number().int(),
    itemCount: z.number().int(),
    /** True when the pack holds items no reviewer has approved yet. */
    hasDrafts: z.boolean(),
    file: z.string(),
    /** Listening packs: the audio files of their clips, and their total size. */
    audio: z
      .object({ files: z.array(z.string()), bytes: z.number().int() })
      .strict()
      .optional(),
  })
  .strict()
export type PackSummary = z.infer<typeof PackSummary>

export const ContentManifest = z
  .object({
    format: z.literal('sfi-content'),
    builtAt: z.string(),
    packs: z.array(PackSummary),
  })
  .strict()
export type ContentManifest = z.infer<typeof ContentManifest>
