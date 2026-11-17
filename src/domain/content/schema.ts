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

export const PackSummary = z
  .object({
    id,
    version: z.number().int(),
    level: z.enum(LEVELS),
    skill: z.enum(SKILLS),
    title: text,
    textCount: z.number().int(),
    itemCount: z.number().int(),
    /** True when the pack holds items no reviewer has approved yet. */
    hasDrafts: z.boolean(),
    file: z.string(),
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
