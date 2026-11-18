import {
  FORM_COUNT,
  type Item,
  type Level,
  type ListeningPack,
  type ReadingPack,
  type ReadingText,
  type VocabPack,
  type Word,
} from './schema.ts'
import { KP27_POINT_IDS, type Kp27Point } from './kp27.ts'

export type Pack = ReadingPack | ListeningPack | VocabPack

/**
 * Word-count range of one reading text per level. C texts stay short; D allows
 * the longer article the test always includes. Tunable, not official limits.
 */
export const TEXT_WORDS: Record<Level, { min: number; max: number }> = {
  C: { min: 20, max: 350 },
  D: { min: 30, max: 600 },
}

/** Word-count range of everything said in one listening clip. */
export const CLIP_WORDS: Record<Level, { min: number; max: number }> = {
  C: { min: 15, max: 300 },
  D: { min: 20, max: 450 },
}

export const countWords = (s: string): number =>
  s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length

export const textWords = (t: ReadingText): number =>
  t.blocks.reduce(
    (n, b) =>
      n +
      countWords(b.heading ?? '') +
      b.lines.reduce((m, line) => m + countWords(line), 0),
    0,
  )

/** One text or clip: what every pack shares, whatever its part of the test. */
interface Unit {
  id: string
  status: 'draft' | 'reviewed'
  reviewedBy?: string
  reviewedAt?: string
  kp27: Kp27Point[]
  items: Item[]
  words: number
  range: { min: number; max: number }
}

export function packUnits(pack: Pack): Unit[] {
  if (pack.skill === 'lasa')
    return pack.texts.map((t) => ({
      ...t,
      words: textWords(t),
      range: TEXT_WORDS[pack.level],
    }))
  if (pack.skill === 'hora')
    return pack.clips.map((c) => ({
      ...c,
      words: c.lines.reduce((n, l) => n + countWords(l.say ?? l.text), 0),
      range: CLIP_WORDS[pack.level],
    }))
  // A word is a unit with no questions: its card is the practice.
  return pack.words.map((w) => ({
    ...w,
    kp27: ['sprak.ordforrad-bojning' as const],
    items: [],
    words: 0,
    range: { min: 0, max: 0 },
  }))
}

/** The problems of one word's forms, which the cards and audio rely on. */
function wordProblems(word: Word): string[] {
  const problems: string[] = []
  const expected = FORM_COUNT[word.pos]
  if (word.forms.length !== expected)
    problems.push(
      `a ${word.pos} lists ${expected} forms, not ${word.forms.length}`,
    )
  const first = word.forms[0] ?? ''
  if (word.pos === 'noun' && !/^(en|ett) /.test(first))
    problems.push(`a noun starts with "en" or "ett", not "${first}"`)
  if (word.pos === 'verb' && !first.startsWith('att '))
    problems.push(`a verb starts with "att", not "${first}"`)
  return problems.map((p) => `word ${word.id}: ${p}`)
}

function itemProblems(item: Item): string[] {
  const problems: string[] = []
  const unique = (list: string[]) =>
    new Set(list.map((s) => s.trim().toLowerCase())).size === list.length

  if (item.type === 'mc') {
    if (item.answer >= item.options.length)
      problems.push(
        `answer ${item.answer} is not one of ${item.options.length} options`,
      )
    if (!unique(item.options)) problems.push('options repeat')
  }
  if (item.type === 'short' && !unique(item.accept))
    problems.push('accepted answers repeat')
  if (item.type === 'match') {
    for (const pair of item.pairs) {
      if (pair.answer >= item.options.length)
        problems.push(
          `"${pair.q}" points at option ${pair.answer}, which does not exist`,
        )
    }
    const answers = item.pairs.map((p) => p.answer)
    if (new Set(answers).size !== answers.length)
      problems.push('two pairs share one answer')
    if (!unique(item.options)) problems.push('options repeat')
  }
  return problems.map((p) => `item ${item.id}: ${p}`)
}

/** Problems that Zod cannot see. An empty list means the packs are valid. */
export function packProblems(packs: Pack[]): string[] {
  const problems: string[] = []
  const seen = new Map<string, string>()
  const claim = (id: string, where: string) => {
    const before = seen.get(id)
    if (before) problems.push(`id ${id} is used twice: ${before} and ${where}`)
    else seen.set(id, where)
  }

  const headwords = new Map<string, string>()
  for (const pack of packs) {
    claim(pack.id, `pack ${pack.id}`)
    if (pack.skill === 'ord')
      for (const word of pack.words) {
        problems.push(...wordProblems(word).map((p) => `${pack.id}: ${p}`))
        const key = word.forms[0]!.toLocaleLowerCase('sv')
        const before = headwords.get(key)
        if (before)
          problems.push(
            `"${word.forms[0]}" is in two packs: ${before} and ${pack.id}`,
          )
        else headwords.set(key, pack.id)
      }
    for (const unit of packUnits(pack)) {
      const where = `${pack.id}/${unit.id}`
      claim(unit.id, where)
      const { min, max } = unit.range
      if (pack.skill !== 'ord' && (unit.words < min || unit.words > max))
        problems.push(
          `${where}: ${unit.words} words, outside ${min}-${max} for level ${pack.level}`,
        )
      if (unit.status === 'reviewed' && !(unit.reviewedBy && unit.reviewedAt))
        problems.push(`${where}: reviewed without reviewedBy and reviewedAt`)
      for (const item of unit.items) {
        claim(item.id, `${where}/${item.id}`)
        problems.push(...itemProblems(item).map((p) => `${where}: ${p}`))
      }
    }
  }
  return problems
}

const keep = <T extends { status: string }>(list: T[], drafts: boolean) =>
  list.filter((u) => drafts || u.status === 'reviewed')

/**
 * The packs as shipped. Production keeps only reviewed texts and clips and
 * drops packs left empty; preview builds keep drafts so they can be tried.
 */
export function publishable<P extends Pack>(
  packs: P[],
  includeDrafts: boolean,
): P[] {
  return packs
    .map((pack) =>
      pack.skill === 'lasa'
        ? { ...pack, texts: keep(pack.texts, includeDrafts) }
        : pack.skill === 'hora'
          ? { ...pack, clips: keep(pack.clips, includeDrafts) }
          : { ...pack, words: keep(pack.words, includeDrafts) },
    )
    .filter((pack) => packUnits(pack).length > 0) as P[]
}

/** KP27 points that no text or clip trains yet. */
export function uncoveredPoints(packs: Pack[]): Kp27Point[] {
  const covered = new Set(
    packs.flatMap((p) => packUnits(p).flatMap((u) => u.kp27)),
  )
  return KP27_POINT_IDS.filter((id) => !covered.has(id))
}
