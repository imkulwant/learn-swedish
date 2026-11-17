import type { Item, Level, ReadingPack, ReadingText } from './schema.ts'
import { KP27_POINT_IDS, type Kp27Point } from './kp27.ts'

/**
 * Word-count range of one reading text per level. C texts stay short; D allows
 * the longer article the test always includes. Tunable, not official limits.
 */
export const TEXT_WORDS: Record<Level, { min: number; max: number }> = {
  C: { min: 20, max: 350 },
  D: { min: 30, max: 600 },
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
export function packProblems(packs: ReadingPack[]): string[] {
  const problems: string[] = []
  const seen = new Map<string, string>()
  const claim = (id: string, where: string) => {
    const before = seen.get(id)
    if (before) problems.push(`id ${id} is used twice: ${before} and ${where}`)
    else seen.set(id, where)
  }

  for (const pack of packs) {
    claim(pack.id, `pack ${pack.id}`)
    for (const text of pack.texts) {
      const where = `${pack.id}/${text.id}`
      claim(text.id, where)
      const words = textWords(text)
      const range = TEXT_WORDS[pack.level]
      if (words < range.min || words > range.max)
        problems.push(
          `${where}: ${words} words, outside ${range.min}-${range.max} for level ${pack.level}`,
        )
      if (text.status === 'reviewed' && !(text.reviewedBy && text.reviewedAt))
        problems.push(`${where}: reviewed without reviewedBy and reviewedAt`)
      for (const item of text.items) {
        claim(item.id, `${where}/${item.id}`)
        problems.push(...itemProblems(item).map((p) => `${where}: ${p}`))
      }
    }
  }
  return problems
}

/**
 * The packs as shipped. Production keeps only reviewed texts and drops packs
 * left empty; preview builds keep drafts so they can be tried and reviewed.
 */
export function publishable(
  packs: ReadingPack[],
  includeDrafts: boolean,
): ReadingPack[] {
  return packs
    .map((pack) => ({
      ...pack,
      texts: pack.texts.filter((t) => includeDrafts || t.status === 'reviewed'),
    }))
    .filter((pack) => pack.texts.length > 0)
}

/** KP27 points that no text trains yet. */
export function uncoveredPoints(packs: ReadingPack[]): Kp27Point[] {
  const covered = new Set(packs.flatMap((p) => p.texts.flatMap((t) => t.kp27)))
  return KP27_POINT_IDS.filter((id) => !covered.has(id))
}
