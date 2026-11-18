import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../../test/db'
import { SfiDb } from '../db'
import { getReadiness } from './readiness'
import {
  assessRecording,
  deleteOldRecordings,
  listRecordings,
  recordingUsage,
  saveRecording,
  setStarred,
} from './recordings'

const source = {
  taskId: 't-nytt-jobb',
  packId: 'd-tala-1',
  packVersion: 1,
  level: 'D',
} as const
const audio = (bytes = 4) => ({
  bytes: new Uint8Array(bytes).fill(7).buffer,
  mimeType: 'audio/mp4',
  durationMs: 1500,
})
const DAY = 86_400_000

beforeEach(resetDb)

describe('recordings', () => {
  it('keeps the audio bytes across a reopened database', async () => {
    const saved = await saveRecording(source, audio(), 1000)
    const reopened = new SfiDb()
    await reopened.open()
    const row = await reopened.recordings.get(saved.id)
    reopened.close()
    expect(row).toMatchObject({ mimeType: 'audio/mp4', durationMs: 1500 })
    expect([...new Uint8Array(row!.audio)]).toEqual([7, 7, 7, 7])
  })

  it('lists one task, newest first, and counts the bytes', async () => {
    await saveRecording(source, audio(), 1000)
    await saveRecording(source, audio(10), 2000)
    await saveRecording({ ...source, taskId: 'other' }, audio(), 3000)
    expect(
      (await listRecordings('t-nytt-jobb')).map((r) => r.createdAt),
    ).toEqual([2000, 1000])
    expect(await recordingUsage()).toEqual({ count: 3, bytes: 18 })
  })

  it('clean-up deletes old recordings but never a starred one', async () => {
    const now = 100 * DAY
    const old = await saveRecording(source, audio(), now - 40 * DAY)
    const starred = await saveRecording(source, audio(), now - 40 * DAY)
    await saveRecording(source, audio(), now - DAY)
    await setStarred(starred.id, true)
    expect(await deleteOldRecordings(now - 30 * DAY)).toBe(1)
    const left = (await listRecordings(source.taskId)).map((r) => r.id)
    expect(left).toContain(starred.id)
    expect(left).not.toContain(old.id)
    expect(left).toHaveLength(2)
  })

  it('makes Tala readiness from three self-assessed recordings', async () => {
    const good = {
      task: 2,
      understandable: 2,
      connected: 1,
      listener: 2,
      language: 1,
      flow: 1,
    } as const // 9 of 12 = 75%
    for (const t of [1, 2]) {
      const r = await saveRecording(source, audio(), t)
      await assessRecording(r.id, good, t)
    }
    expect(await getReadiness('D', 'tala')).toMatchObject({
      status: 'insufficient',
      count: 2,
    })
    const r = await saveRecording(source, audio(), 3)
    await assessRecording(r.id, good, 3)
    expect(await getReadiness('D', 'tala')).toMatchObject({
      status: 'ready',
      percent: 75,
    })
    expect(await getReadiness('C', 'tala')).toMatchObject({
      status: 'insufficient',
    })
  })
})
