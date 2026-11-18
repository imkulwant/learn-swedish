import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../../test/db'
import { SfiDb, db } from '../db'
import {
  addPlay,
  finishPart,
  setAssessment,
  setMark,
  setMockText,
  latestMock,
  recordMockAttempts,
  setResponse,
  startMock,
  startPart,
} from './mocks'

const source = { examId: 'd-prov-1', packVersion: 1, level: 'D' } as const
const MIN = 60_000

beforeEach(resetDb)

describe('mock runs', () => {
  it('resumes with its end time and answers after the database is reopened', async () => {
    const run = await startMock(source, 0)
    await startPart(run.id, 'lasa', 1000)
    await setResponse(run.id, 'lasa', 'q1', 2, 2000)
    const reopened = new SfiDb()
    await reopened.open()
    const back = await reopened.mocks.get(run.id)
    reopened.close()
    expect(back?.parts.lasa).toEqual({
      startedAt: 1000,
      endsAt: 1000 + 90 * MIN,
      finishedAt: null,
    })
    expect(back?.responses).toEqual({ q1: 2 })
  })

  it('refuses answers once the time is up, and ends the part at its end time', async () => {
    const run = await startMock(source, 0)
    await startPart(run.id, 'lasa', 0)
    await setResponse(run.id, 'lasa', 'q1', 1, 90 * MIN + 1)
    await finishPart(run.id, 'lasa', 200 * MIN)
    const back = await latestMock('d-prov-1')
    expect(back?.responses).toEqual({})
    expect(back?.parts.lasa.finishedAt).toBe(90 * MIN)
    expect(back?.status).toBe('running')
  })

  it('is finished after its last part', async () => {
    const run = await startMock(source, 0)
    for (const skill of ['lasa', 'hora', 'skriva', 'tala'] as const) {
      await startPart(run.id, skill, 1)
      await finishPart(run.id, skill, 2)
    }
    expect(await latestMock('d-prov-1')).toMatchObject({
      status: 'finished',
      finishedAt: 2,
    })
  })

  it('stores its answers as mock attempts once', async () => {
    const run = await startMock(source, 0)
    const attempt = {
      itemId: 'q1',
      packId: 'd-prov-1',
      packVersion: 1,
      level: 'D',
      skill: 'lasa',
      mode: 'mock',
      score: 1,
      maxScore: 1,
      selfMarked: false,
      response: 1,
      answeredAt: 5,
    } as const
    await recordMockAttempts(run.id, [attempt])
    await recordMockAttempts(run.id, [attempt])
    expect(await db.attempts.count()).toBe(1)
    const [stored] = await db.attempts.toArray()
    expect(stored).toMatchObject({ mode: 'mock' })
    // Dated when stored, not when the mock ended, for the backup reminder.
    expect(stored!.answeredAt).toBeGreaterThan(5)
  })

  it('refuses a text after the end, keeps plays, marks and assessments, and ends a part once', async () => {
    const run = await startMock(source, 0)
    await startPart(run.id, 'skriva', 0)
    await setMockText(run.id, 'p1', 'Hej', 10)
    await setMockText(run.id, 'p1', 'För sent', 90 * MIN)
    await addPlay(run.id, 'c1')
    await addPlay(run.id, 'c1')
    await setMark(run.id, 'q1', true)
    await setAssessment(run.id, 'p1', { task: 2 })
    await finishPart(run.id, 'skriva', 5)
    await finishPart(run.id, 'skriva', 50)
    const back = await latestMock('d-prov-1')
    expect(back).toMatchObject({
      texts: { p1: 'Hej' },
      plays: { c1: 2 },
      marks: { q1: true },
      assessments: { p1: { task: 2 } },
    })
    expect(back?.parts.skriva.finishedAt).toBe(5)
  })
})
