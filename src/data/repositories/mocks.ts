import type { Skill } from '../../domain/content/schema'
import { EXAM_ORDER } from '../../domain/examFormat'
import { partDurationMs, type MockResponse } from '../../domain/mock'
import type { Attempt, MockRun } from '../../domain/types'
import { db } from '../db'

export type MockSource = Pick<MockRun, 'examId' | 'packVersion' | 'level'>

const emptyParts = () =>
  Object.fromEntries(
    EXAM_ORDER.map((s) => [
      s,
      { startedAt: null, endsAt: null, finishedAt: null },
    ]),
  ) as MockRun['parts']

export async function startMock(
  source: MockSource,
  now: number = Date.now(),
): Promise<MockRun> {
  const run: MockRun = {
    ...source,
    id: crypto.randomUUID(),
    status: 'running',
    startedAt: now,
    finishedAt: null,
    parts: emptyParts(),
    responses: {},
    plays: {},
    texts: {},
    speaking: {},
    marks: {},
    assessments: {},
    recordedAt: null,
  }
  await db.mocks.add(run)
  return run
}

/** The latest sitting of a mock, or undefined. */
export async function latestMock(examId: string): Promise<MockRun | undefined> {
  const runs = await db.mocks.where('examId').equals(examId).toArray()
  return runs.sort((a, b) => b.startedAt - a.startedAt)[0]
}

export const listMockRuns = (): Promise<MockRun[]> =>
  db.mocks.orderBy('startedAt').reverse().toArray()

/** The sitting in progress, if any, read through its index. */
export const runningMock = (): Promise<MockRun | undefined> =>
  db.mocks.where('status').equals('running').first()

/** Changes one run in a transaction, so two writes never overwrite each other. */
async function change(id: string, apply: (run: MockRun) => void) {
  await db.transaction('rw', db.mocks, async () => {
    const run = await db.mocks.get(id)
    if (!run) throw new Error('This mock is no longer stored.')
    apply(run)
    await db.mocks.put(run)
  })
}

export const startPart = (id: string, skill: Skill, now = Date.now()) =>
  change(id, (run) => {
    const part = run.parts[skill]
    if (part.startedAt !== null) return
    part.startedAt = now
    part.endsAt = now + partDurationMs(skill)
  })

/** Ends a part; after the last one the mock is finished. */
export const finishPart = (id: string, skill: Skill, now = Date.now()) =>
  change(id, (run) => {
    const part = run.parts[skill]
    if (part.finishedAt !== null) return
    // A part whose time ran out ends at its end time, not when it was noticed.
    part.finishedAt = Math.min(now, part.endsAt ?? now)
    if (EXAM_ORDER.every((s) => run.parts[s].finishedAt !== null)) {
      run.status = 'finished'
      run.finishedAt = part.finishedAt
    }
  })

/** Answers are refused once their part has ended. */
const open = (run: MockRun, skill: Skill, now: number) => {
  const part = run.parts[skill]
  return (
    part.startedAt !== null &&
    part.finishedAt === null &&
    (part.endsAt === null || now < part.endsAt)
  )
}

export const setResponse = (
  id: string,
  skill: Skill,
  itemId: string,
  response: MockResponse,
  now = Date.now(),
) =>
  change(id, (run) => {
    if (open(run, skill, now)) run.responses[itemId] = response
  })

export const addPlay = (id: string, clipId: string) =>
  change(id, (run) => {
    run.plays[clipId] = (run.plays[clipId] ?? 0) + 1
  })

export const setMockText = (
  id: string,
  promptId: string,
  text: string,
  now = Date.now(),
) =>
  change(id, (run) => {
    if (open(run, 'skriva', now)) run.texts[promptId] = text
  })

export const setMockSpeaking = (id: string, key: string, storedId: string) =>
  change(id, (run) => {
    run.speaking[key] = storedId
  })

export const setMark = (id: string, itemId: string, right: boolean) =>
  change(id, (run) => {
    run.marks[itemId] = right
  })

export const setAssessment = (
  id: string,
  key: string,
  scores: Record<string, 0 | 1 | 2>,
) =>
  change(id, (run) => {
    run.assessments[key] = scores
  })

/**
 * Stores the scored answers as attempts (mode "mock", which readiness weighs
 * double), once per run.
 */
export async function recordMockAttempts(
  id: string,
  attempts: Omit<Attempt, 'id'>[],
): Promise<void> {
  await db.transaction('rw', db.mocks, db.attempts, async () => {
    const run = await db.mocks.get(id)
    if (!run || run.recordedAt !== null) return
    // Dated when stored, so the backup reminder counts them even when the
    // marking was finished after a backup.
    const now = Date.now()
    await db.attempts.bulkAdd(
      attempts.map((a) => ({ ...a, id: crypto.randomUUID(), answeredAt: now })),
    )
    await db.mocks.update(id, { recordedAt: now })
  })
}
