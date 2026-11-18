import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDb } from '../../test/db'
import { SfiDb } from '../db'
import {
  answeredItemIds,
  listAttempts,
  oldestAttemptSince,
  recordAttempt,
  type NewAttempt,
} from './attempts'
import { getReadiness } from './readiness'

const answer = (overrides: Partial<NewAttempt> = {}): NewAttempt => ({
  itemId: 'i',
  packId: 'd-lasa-1',
  packVersion: 1,
  level: 'D',
  skill: 'lasa',
  mode: 'drill',
  score: 1,
  maxScore: 1,
  selfMarked: false,
  response: 0,
  ...overrides,
})

beforeEach(resetDb)

describe('attempts', () => {
  it('lists the grammar items answered, of the levels asked for only', async () => {
    const grammar = { skill: 'grammatik', packId: 'g' } as const
    await recordAttempt(answer({ ...grammar, itemId: 'c1', level: 'C' }))
    await recordAttempt(
      answer({ ...grammar, itemId: 'c1', level: 'C', score: 0 }),
    )
    await recordAttempt(answer({ ...grammar, itemId: 'd1' }))
    await recordAttempt(answer({ itemId: 'reading' }))
    expect([...(await answeredItemIds(['C'], 'grammatik'))]).toEqual(['c1'])
    expect(
      [...(await answeredItemIds(['C', 'D'], 'grammatik'))].sort(),
    ).toEqual(['c1', 'd1'])
  })

  it('reads back what was written after the database is reopened', async () => {
    const written = await recordAttempt(answer({ response: [2, null, 1] }))
    const reopened = new SfiDb()
    await reopened.open()
    expect(await reopened.attempts.get(written.id)).toEqual(written)
    reopened.close()
  })

  it('lists one level and part only, newest first', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(1000)
    await recordAttempt(answer({ itemId: 'old' }))
    vi.setSystemTime(2000)
    await recordAttempt(answer({ itemId: 'new' }))
    await recordAttempt(answer({ itemId: 'c-level', level: 'C' }))
    await recordAttempt(answer({ itemId: 'listening', skill: 'hora' }))
    vi.useRealTimers()

    expect((await listAttempts('D', 'lasa')).map((a) => a.itemId)).toEqual([
      'new',
      'old',
    ])
  })

  it('finds the oldest answer given after a moment', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    for (const t of [1000, 2000, 3000]) {
      vi.setSystemTime(t)
      await recordAttempt(answer({ itemId: `at-${t}` }))
    }
    vi.useRealTimers()
    expect(await oldestAttemptSince(null)).toBe(1000)
    expect(await oldestAttemptSince(1000)).toBe(2000)
    expect(await oldestAttemptSince(3000)).toBeNull()
  })

  it('refuses an impossible score instead of storing it', async () => {
    await expect(
      recordAttempt(answer({ score: 2, maxScore: 1 })),
    ).rejects.toThrow(RangeError)
    await expect(
      recordAttempt(answer({ score: 0, maxScore: 0 })),
    ).rejects.toThrow(RangeError)
    expect(await listAttempts('D', 'lasa')).toEqual([])
  })

  it('turns stored attempts into readiness', async () => {
    expect(await getReadiness('D', 'lasa')).toMatchObject({
      status: 'insufficient',
      count: 0,
    })
    for (let i = 0; i < 15; i++)
      await recordAttempt(answer({ itemId: `i${i}` }))
    expect(await getReadiness('D', 'lasa')).toMatchObject({
      status: 'ready',
      percent: 100,
    })
  })
})

describe('hasProgress', () => {
  it('counts a started mock and a pair discussion as progress', async () => {
    const { hasProgress } = await import('./attempts')
    const { startMock } = await import('./mocks')
    const { addPairTurn } = await import('./pairs')
    expect(await hasProgress()).toBe(false)
    await startMock({ examId: 'd-prov-1', packVersion: 1, level: 'D' })
    expect(await hasProgress()).toBe(true)
    await resetDb()
    await addPairTurn(
      { topicId: 'p', packId: 'd-tala-2', packVersion: 1, level: 'D' },
      null,
      {
        turn: 0,
        audio: new ArrayBuffer(1),
        mimeType: 'audio/mp4',
        durationMs: 1,
      },
    )
    expect(await hasProgress()).toBe(true)
  })
})
