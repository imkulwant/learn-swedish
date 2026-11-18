import { describe, expect, it } from 'vitest'
import type { OrderItem } from './content/schema.ts'
import {
  acceptedOrders,
  scoreOrder,
  scoreTyped,
  shuffledChunks,
  wordBag,
} from './grammar.ts'

const order: OrderItem = {
  type: 'order',
  id: 'o-1',
  prompt: 'Börja med "Idag".',
  chunks: ['Idag', 'har', 'jag', 'tid'],
  alsoAccept: ['Jag har tid idag'],
  end: '.',
  explain: '-',
}

describe('scoreOrder', () => {
  it.each([
    [[0, 1, 2, 3], 1],
    [[2, 1, 3, 0], 1], // "jag har tid idag", the also-accepted order
    [[0, 2, 1, 3], 0], // "Idag jag har tid", no inversion
    [[0, 1, 2], 0], // unfinished
  ])('%j scores %i', (picked, score) => {
    expect(scoreOrder(order, picked)).toEqual({ score, maxScore: 1 })
  })

  it('ignores the case of the first word', () => {
    expect(acceptedOrders(order)).toEqual([
      'idag har jag tid',
      'jag har tid idag',
    ])
  })
})

describe('scoreTyped', () => {
  it.each([
    ['läst', 1],
    [' Läst. ', 1],
    ['läste', 0],
    ['', 0],
  ])('%j scores %i', (answer, score) => {
    expect(scoreTyped(['läst'], answer).score).toBe(score)
  })
})

describe('shuffledChunks', () => {
  it('is the same on every call and never a right sentence', () => {
    const shown = shuffledChunks(order)
    expect(shown).not.toBeNull()
    expect(shuffledChunks(order)).toEqual(shown)
    expect([...shown!].sort()).toEqual([0, 1, 2, 3])
    expect(scoreOrder(order, shown!).score).toBe(0)
  })

  it('differs between items', () => {
    const others = ['o-2', 'o-3', 'o-4', 'o-5'].map((id) =>
      shuffledChunks({ ...order, id }),
    )
    expect(new Set(others.map((o) => o?.join())).size).toBeGreaterThan(1)
  })

  it('gives up when every order is right', () => {
    expect(
      shuffledChunks({ ...order, chunks: ['ja', 'ja', 'ja'], alsoAccept: [] }),
    ).toBeNull()
  })
})

describe('wordBag', () => {
  it('matches sentences made of the same words', () => {
    expect(wordBag('Jag har tid idag.')).toBe(wordBag('Idag har jag tid'))
    expect(wordBag('Jag har tid idag')).not.toBe(wordBag('Jag har tid nu'))
  })
})
