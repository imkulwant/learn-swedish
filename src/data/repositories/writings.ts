import type { Level } from '../../domain/content/schema'
import type { Writing } from '../../domain/types'
import type { Rubric } from '../../domain/writing'
import { db } from '../db'

export type WritingSource = Pick<
  Writing,
  'promptId' | 'packId' | 'packVersion' | 'level'
>

/** The latest text for a prompt, draft or submitted, or undefined. */
export async function latestWriting(
  promptId: string,
): Promise<Writing | undefined> {
  const rows = await db.writings.where('promptId').equals(promptId).toArray()
  return rows.sort((a, b) => b.createdAt - a.createdAt)[0]
}

/** The latest text of every prompt, by prompt id. */
export async function latestWritings(): Promise<Map<string, Writing>> {
  const latest = new Map<string, Writing>()
  for (const row of await db.writings.toArray()) {
    const before = latest.get(row.promptId)
    if (!before || row.createdAt > before.createdAt)
      latest.set(row.promptId, row)
  }
  return latest
}

/** Starts a new text for a prompt, stored at once. */
export async function createWriting(
  source: WritingSource,
  text: string,
  now: number = Date.now(),
): Promise<Writing> {
  const row: Writing = {
    ...source,
    id: crypto.randomUUID(),
    text,
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
    rubric: null,
    assessedAt: null,
  }
  await db.writings.add(row)
  return row
}

/**
 * Saves the text of a draft. A submitted text is never changed, so a late
 * save from another tab cannot rewrite what was assessed.
 */
export async function saveWritingText(
  id: string,
  text: string,
  now: number = Date.now(),
): Promise<void> {
  await db.transaction('rw', db.writings, async () => {
    const row = await db.writings.get(id)
    if (!row) throw new Error('This text is no longer stored.')
    if (row.submittedAt !== null) return
    await db.writings.update(id, { text, updatedAt: now })
  })
}

/** Fixes the text as handed in. */
export async function submitWriting(
  id: string,
  text: string,
  now: number = Date.now(),
): Promise<void> {
  await db.transaction('rw', db.writings, async () => {
    const row = await db.writings.get(id)
    if (!row) throw new Error('This text is no longer stored.')
    if (row.submittedAt !== null) return
    await db.writings.update(id, { text, submittedAt: now, updatedAt: now })
  })
}

/** Stores the learner's self-assessment of a submitted text. */
export async function assessWriting(
  id: string,
  rubric: Rubric,
  now: number = Date.now(),
): Promise<void> {
  await db.transaction('rw', db.writings, async () => {
    const row = await db.writings.get(id)
    if (!row?.submittedAt) throw new Error('Only a submitted text is assessed.')
    await db.writings.update(id, { rubric, assessedAt: now, updatedAt: now })
  })
}

/** Every assessed text of one level, for readiness. */
export async function assessedWritings(level: Level): Promise<Writing[]> {
  return (await db.writings.toArray()).filter(
    (w) => w.level === level && w.rubric && w.assessedAt !== null,
  )
}
