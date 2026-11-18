import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../../test/db'
import { SfiDb } from '../db'
import {
  addPairTurn,
  assessPairSession,
  finishPairSession,
  listPairSessions,
  setPairStarred,
} from './pairs'
import { getReadiness } from './readiness'
import {
  assessRecording,
  deleteOldRecordings,
  recordingUsage,
  saveRecording,
} from './recordings'

const source = {
  topicId: 'p-trivas-jobbet',
  packId: 'd-tala-2',
  packVersion: 1,
  level: 'D',
} as const
const turn = (n: number) => ({
  turn: n,
  audio: new Uint8Array(3).fill(n).buffer,
  mimeType: 'audio/mp4',
  durationMs: 1000,
})
const DAY = 86_400_000

beforeEach(resetDb)

describe('pair sessions', () => {
  it('stores each answer as it is given, across a reopened database', async () => {
    const id = await addPairTurn(source, null, turn(0), 1000)
    expect(await addPairTurn(source, id, turn(1))).toBe(id)
    await finishPairSession(id, 2000)
    const reopened = new SfiDb()
    await reopened.open()
    const row = await reopened.pairSessions.get(id)
    reopened.close()
    expect(row?.turns.map((t) => [t.turn, new Uint8Array(t.audio)[0]])).toEqual(
      [
        [0, 0],
        [1, 1],
      ],
    )
    expect(row?.finishedAt).toBe(2000)
  })

  it('counts towards Tala readiness together with solo answers', async () => {
    const all = (score: 0 | 1 | 2) => ({
      answers: score,
      opinions: score,
      asks: score,
      forward: score,
      agreement: score,
      language: score,
    })
    for (const t of [1, 2]) {
      const id = await addPairTurn(source, null, turn(0), t)
      await assessPairSession(id, all(2), t)
    }
    const solo = await saveRecording(
      { taskId: 't', packId: 'd-tala-1', packVersion: 1, level: 'D' },
      { bytes: new ArrayBuffer(2), mimeType: 'audio/mp4', durationMs: 1 },
    )
    await assessRecording(
      solo.id,
      {
        task: 1,
        understandable: 1,
        connected: 1,
        listener: 1,
        language: 1,
        flow: 1,
      },
      3,
    )
    // 100, 100 and 50: a mean of 83.
    expect(await getReadiness('D', 'tala')).toMatchObject({
      status: 'ready',
      percent: 83,
      count: 3,
    })
  })

  it('is counted and cleaned up with recordings, keeping starred ones', async () => {
    const now = 100 * DAY
    const old = await addPairTurn(source, null, turn(0), now - 40 * DAY)
    const kept = await addPairTurn(source, null, turn(0), now - 40 * DAY)
    await setPairStarred(kept, true)
    expect(await recordingUsage()).toEqual({ count: 2, bytes: 6 })
    expect(await deleteOldRecordings(now - 30 * DAY)).toBe(1)
    const left = (await listPairSessions(source.topicId)).map((s) => s.id)
    expect(left).toEqual([kept])
    expect(left).not.toContain(old)
  })
})
