import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../../test/db'
import { db } from '../db'
import { recordAttempt, type NewAttempt } from '../repositories/attempts'
import {
  completeOnboarding,
  getSetting,
  setSetting,
} from '../repositories/settings'
import { backupFileName, buildBackup, serializeBackup } from './export'
import { mergeBackup, replaceWithBackup, summariseBackup } from './import'
import { parseBackup, type Backup } from './schema'

const answer = (itemId: string, score = 1): NewAttempt => ({
  itemId,
  packId: 'd-lasa-1',
  packVersion: 1,
  level: 'D',
  skill: 'lasa',
  mode: 'drill',
  score,
  maxScore: 1,
  selfMarked: false,
  response: 'sex gånger',
})

async function snapshot() {
  return {
    attempts: await db.attempts.toArray(),
    settings: await db.settings.toArray(),
  }
}

const roundTrip = async (): Promise<Backup> => {
  const result = parseBackup(serializeBackup(await buildBackup('1.0.0', 5)))
  if (!result.ok) throw new Error(result.error)
  return result.backup
}

beforeEach(resetDb)

describe('backup', () => {
  it('survives export, clearing the device and import unchanged', async () => {
    await completeOnboarding('C', '2027-01-18')
    await recordAttempt(answer('a'))
    await recordAttempt({
      ...answer('b', 2),
      maxScore: 4,
      response: [1, null, 0],
    })
    const before = await snapshot()

    const backup = await roundTrip()
    await resetDb()
    await replaceWithBackup(backup)

    const after = await snapshot()
    const byId = <T extends { id?: string; key?: string }>(rows: T[]) =>
      [...rows].sort((x, y) =>
        String(x.id ?? x.key).localeCompare(String(y.id ?? y.key)),
      )
    expect(byId(after.attempts)).toEqual(byId(before.attempts))
    // Everything comes back, plus the backup itself as the last backup.
    expect(byId(after.settings)).toEqual(
      byId([
        ...before.settings,
        { key: 'lastBackupAt', value: 5, updatedAt: 5 },
      ]),
    )
  })

  it('summarises what a file holds', async () => {
    await recordAttempt(answer('a'))
    const summary = summariseBackup(await roundTrip())
    expect(summary).toMatchObject({
      answers: 1,
      exportedAt: 5,
      appVersion: '1.0.0',
    })
    expect(summary.firstAt).toBe(summary.lastAt)
  })

  it('merges by adding missing answers and keeping the newer setting', async () => {
    await recordAttempt(answer('shared'))
    await setSetting('targetLevel', 'C')
    const backup = await roundTrip()
    backup.data.attempts.push({
      ...backup.data.attempts[0]!,
      id: 'only-in-file',
      itemId: 'x',
    })

    // Changed on this device after the backup: the device's value is newer.
    await setSetting('targetLevel', 'D')
    expect(await mergeBackup(backup)).toBe(1)
    expect(await db.attempts.count()).toBe(2)
    expect(await getSetting('targetLevel')).toBe('D')
  })

  it('replace removes what was stored before', async () => {
    await recordAttempt(answer('kept-in-file'))
    const backup = await roundTrip()
    await recordAttempt(answer('only-on-device'))
    await setSetting('examDate', '2027-01-18')

    await replaceWithBackup(backup)

    expect((await db.attempts.toArray()).map((a) => a.itemId)).toEqual([
      'kept-in-file',
    ])
    expect(await getSetting('examDate')).toBeNull()
  })

  it('merge takes a setting that is newer in the file, and keeps the stored one on a tie', async () => {
    await setSetting('targetLevel', 'D')
    const backup = await roundTrip()
    const stored = (await db.settings.get('targetLevel'))!
    backup.data.settings = [
      { key: 'targetLevel', value: 'C', updatedAt: stored.updatedAt },
    ]
    await mergeBackup(backup)
    expect(await getSetting('targetLevel')).toBe('D')

    backup.data.settings = [
      { key: 'targetLevel', value: 'C', updatedAt: stored.updatedAt + 1 },
    ]
    await mergeBackup(backup)
    expect(await getSetting('targetLevel')).toBe('C')
  })

  it('merge never takes the time of the last backup from the file', async () => {
    await setSetting('lastBackupAt', 1)
    const backup = await roundTrip()
    backup.data.settings = [
      { key: 'lastBackupAt', value: 5, updatedAt: Date.now() + 1000 },
    ]
    await mergeBackup(backup)
    expect(await getSetting('lastBackupAt')).toBe(1)
  })

  it('records the file itself as the last backup, so a restore does not nag', async () => {
    await recordAttempt(answer('a'))
    const backup = await roundTrip()
    expect(backup.data.settings).toContainEqual({
      key: 'lastBackupAt',
      value: 5,
      updatedAt: 5,
    })
    await resetDb()
    await replaceWithBackup(backup)
    expect(await getSetting('lastBackupAt')).toBe(5)
  })

  it('names files after the local date', () => {
    expect(backupFileName(new Date(2026, 10, 17, 23, 30).getTime())).toBe(
      'sfi-prep-2026-11-17.json',
    )
  })
})

describe('parseBackup', () => {
  const valid = (): Record<string, unknown> => ({
    format: 'sfi-prep-backup',
    schemaVersion: 1,
    exportedAt: 1,
    appVersion: '1.0.0',
    data: { attempts: [], settings: [] },
  })
  const parse = (value: unknown) => parseBackup(JSON.stringify(value))

  it('accepts an empty backup', () => {
    expect(parse(valid()).ok).toBe(true)
  })

  it.each([
    ['text that is not JSON', 'not json', /not JSON/],
    [
      "another app's backup",
      { ...valid(), format: 'workout-tracker-backup' },
      /format/,
    ],
    ['an unknown field', { ...valid(), extra: 1 }, /not a valid backup/],
    [
      'an impossible score',
      {
        ...valid(),
        data: {
          settings: [],
          attempts: [
            {
              id: 'a',
              itemId: 'i',
              packId: 'p',
              packVersion: 1,
              level: 'D',
              skill: 'lasa',
              mode: 'drill',
              score: 3,
              maxScore: 1,
              selfMarked: false,
              response: 0,
              answeredAt: 1,
            },
          ],
        },
      },
      /score is above maxScore/,
    ],
    [
      'an unknown setting',
      {
        ...valid(),
        data: {
          attempts: [],
          settings: [{ key: 'isAdmin', value: true, updatedAt: 1 }],
        },
      },
      /not a valid backup/,
    ],
    [
      'a bad exam date',
      {
        ...valid(),
        data: {
          attempts: [],
          settings: [{ key: 'examDate', value: '2027-02-30', updatedAt: 1 }],
        },
      },
      /Not a date/,
    ],
  ])('refuses %s', (_, value, message) => {
    const result = typeof value === 'string' ? parseBackup(value) : parse(value)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(message)
  })

  it('refuses dates in the future, which would hide the backup reminder', () => {
    const now = 1_000_000_000_000
    const future = { ...valid(), exportedAt: now + 2 * 86_400_000 }
    expect(parseBackup(JSON.stringify(future), now)).toMatchObject({
      ok: false,
      error: /future/,
    })
    const lastBackup = {
      ...valid(),
      data: {
        attempts: [],
        settings: [{ key: 'lastBackupAt', value: 9e15, updatedAt: 1 }],
      },
    }
    expect(parseBackup(JSON.stringify(lastBackup), now).ok).toBe(false)
  })

  it('refuses an overlong id and keeps its error message short', () => {
    const long = 'x'.repeat(5000)
    const result = parse({
      ...valid(),
      data: {
        settings: [],
        attempts: [
          {
            id: long,
            itemId: 'i',
            packId: 'p',
            packVersion: 1,
            level: 'D',
            skill: 'lasa',
            mode: 'drill',
            score: 0,
            maxScore: 1,
            selfMarked: false,
            response: 0,
            answeredAt: 1,
          },
        ],
      },
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.length).toBeLessThanOrEqual(120)
  })

  it('refuses a repeated answer id, and writes nothing', async () => {
    await recordAttempt(answer('a'))
    const backup = await roundTrip()
    backup.data.attempts.push(backup.data.attempts[0]!)
    const result = parseBackup(JSON.stringify(backup))
    expect(result).toMatchObject({
      ok: false,
      error: expect.stringMatching(/repeats the answer id/),
    })
    expect(await db.attempts.count()).toBe(1)
  })
})
