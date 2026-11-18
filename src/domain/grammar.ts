import { normalizeAnswer, type Points } from './answerCheck.ts'
import type { OrderItem } from './content/schema.ts'

// Grammar answers are checked strictly: a form is right or wrong, so there is
// no self-marking. Every right answer must be listed in the content.

/** Every right sentence of an order exercise, normalized. */
export const acceptedOrders = (item: OrderItem): string[] =>
  [item.chunks.join(' '), ...(item.alsoAccept ?? [])].map(normalizeAnswer)

/** The sentence the chunks make in the order picked (indexes into `chunks`). */
export const orderSentence = (item: OrderItem, picked: number[]): string =>
  picked.map((i) => item.chunks[i]).join(' ')

export const scoreOrder = (item: OrderItem, picked: number[]): Points => ({
  score: acceptedOrders(item).includes(
    normalizeAnswer(orderSentence(item, picked)),
  )
    ? 1
    : 0,
  maxScore: 1,
})

/** A typed form or sentence, right only when it is one of `accept`. */
export const scoreTyped = (accept: string[], answer: string): Points => {
  const given = normalizeAnswer(answer)
  return {
    score: given && accept.some((a) => normalizeAnswer(a) === given) ? 1 : 0,
    maxScore: 1,
  }
}

/** A small seeded generator (mulberry32), so a shuffle is the same every time. */
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a, to turn an item id into a seed. */
function hash(text: string): number {
  let h = 0x811c9dc5
  for (const c of text) h = Math.imul(h ^ c.codePointAt(0)!, 0x01000193)
  return h >>> 0
}

/**
 * The order the chunks are shown in: shuffled the same way on every visit,
 * and never already a right sentence. Null when no such order is found, which
 * the content build reports.
 */
export function shuffledChunks(item: OrderItem): number[] | null {
  const accepted = acceptedOrders(item)
  const next = random(hash(item.id))
  for (let attempt = 0; attempt < 50; attempt++) {
    const order = item.chunks.map((_, i) => i)
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1))
      ;[order[i], order[j]] = [order[j]!, order[i]!]
    }
    if (!accepted.includes(normalizeAnswer(orderSentence(item, order))))
      return order
  }
  return null
}

/** The words of a sentence, sorted: two sentences with the same words match. */
export const wordBag = (sentence: string): string =>
  normalizeAnswer(sentence).split(' ').sort().join(' ')
