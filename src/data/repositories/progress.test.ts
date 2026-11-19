import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../../test/db'
import { recordAttempt } from './attempts'
import { addPairTurn } from './pairs'
import { finishPart, setMockText, startMock, startPart } from './mocks'
import { activityByDay, thisWeek } from './progress'
import { saveRecording } from './recordings'
import { createWriting, submitWriting } from './writings'

beforeEach(resetDb)

// 2027-01-13 is a Wednesday; noon avoids any doubt about the local date.
const at = (date: string) => new Date(`${date}T12:00:00`).getTime()

describe('progress', () => {
  it('counts what was done each day, and this week since Monday', async () => {
    const answer = {
      itemId: 'i',
      packId: 'p',
      packVersion: 1,
      level: 'D',
      skill: 'lasa',
      mode: 'drill',
      score: 1,
      maxScore: 1,
      selfMarked: false,
      response: 0,
    } as const
    const { vi } = await import('vitest')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(at('2027-01-13'))
    await recordAttempt(answer)
    await recordAttempt(answer)
    vi.useRealTimers()
    const source = {
      promptId: 's',
      packId: 'w',
      packVersion: 1,
      level: 'D',
    } as const
    const text = await createWriting(source, 'Hej', at('2027-01-08'))
    await submitWriting(text.id, 'Hej', at('2027-01-08'))
    const fresh = await createWriting(source, 'Hej', at('2027-01-12'))
    await submitWriting(fresh.id, 'Hej', at('2027-01-12'))
    await saveRecording(
      { taskId: 't', packId: 'd-tala-1', packVersion: 1, level: 'D' },
      { bytes: new ArrayBuffer(1), mimeType: 'audio/mp4', durationMs: 1 },
      at('2027-01-11'),
    )
    await addPairTurn(
      { topicId: 'p', packId: 'd-tala-2', packVersion: 1, level: 'D' },
      null,
      {
        turn: 0,
        audio: new ArrayBuffer(1),
        mimeType: 'audio/mp4',
        durationMs: 1,
      },
      at('2027-01-13'),
    )

    const days = await activityByDay()
    expect(days.get('2027-01-13')).toBe(3) // two answers and a discussion answer
    expect(days.get('2027-01-08')).toBe(1)
    expect(await thisWeek('2027-01-13')).toEqual({ writing: 1, speaking: 2 })
  })

  it('counts word reviews and finished mock parts, and starts the week on Monday', async () => {
    const { db } = await import('../db')
    await db.studyDays.put({ date: '2027-01-10', reviews: 7, newWords: 3 })
    const run = await startMock(
      { examId: 'd-prov-1', packVersion: 1, level: 'D' },
      at('2027-01-11'),
    )
    await startPart(run.id, 'skriva', at('2027-01-11'))
    await setMockText(run.id, 'p1', 'Hej Sofia!', at('2027-01-11') + 1000)
    await setMockText(run.id, 'p2', '  ', at('2027-01-11') + 2000)
    await finishPart(run.id, 'skriva', at('2027-01-11') + 3000)
    // Handed in on Sunday: last week, not this one.
    const old = await createWriting(
      { promptId: 's', packId: 'w', packVersion: 1, level: 'D' },
      'Hej',
      at('2027-01-10'),
    )
    await submitWriting(old.id, 'Hej', at('2027-01-10'))

    const days = await activityByDay()
    expect(days.get('2027-01-10')).toBe(8) // seven word answers and a text
    expect(days.get('2027-01-11')).toBe(5) // a finished mock part
    expect(await thisWeek('2027-01-11')).toEqual({ writing: 1, speaking: 0 })
  })
})
