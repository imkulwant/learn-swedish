import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../../test/db'
import { db } from '../db'
import { recordAttempt, type NewAttempt } from '../repositories/attempts'
import { answerCard, startWord } from '../repositories/vocab'
import {
  assessWriting,
  createWriting,
  saveWritingText,
  submitWriting,
} from '../repositories/writings'
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
    await recordAttempt({
      ...answer('g'),
      packId: 'c-grammatik-1',
      level: 'C',
      skill: 'grammatik',
      response: 'Idag har jag tid',
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

  it('carries word cards and study days through a round trip', async () => {
    const card = await startWord(
      { wordId: 'lon', packId: 'd-ord-arbete' },
      Date.now(),
    )
    await answerCard(card, 'good', Date.now())
    const before = {
      cards: await db.cards.toArray(),
      days: await db.studyDays.toArray(),
    }
    const backup = await roundTrip()
    expect(backup.schemaVersion).toBe(3)
    await resetDb()
    await replaceWithBackup(backup)
    expect(await db.cards.toArray()).toEqual(before.cards)
    expect(await db.studyDays.toArray()).toEqual(before.days)
  })

  it('merge keeps the word card with more answers and the larger day counts', async () => {
    const card = await startWord({ wordId: 'lon', packId: 'p' }, Date.now())
    const backup = await roundTrip()
    await answerCard(card, 'good', Date.now())
    const here = (await db.cards.get('lon:sv-en'))!
    backup.data.studyDays = backup.data.studyDays.map((d) => ({
      ...d,
      newWords: 9,
    }))

    await mergeBackup(backup)

    expect((await db.cards.get('lon:sv-en'))!.reps).toBe(here.reps)
    const day = (await db.studyDays.toArray())[0]!
    expect(day).toMatchObject({ newWords: 9, reviews: 1 })
  })

  it('carries texts through a round trip, and merge keeps the later change', async () => {
    const source = {
      promptId: 's1',
      packId: 'd-skriva-1',
      packVersion: 1,
      level: 'D',
    } as const
    const draft = await createWriting(source, 'Hej', 1000)
    const done = await createWriting(source, 'Hej Sara', 1000)
    await submitWriting(done.id, 'Hej Sara!', 1100)
    const rubric = {
      task: 2,
      register: 2,
      structure: 1,
      linking: 1,
      grammar: 1,
      variation: 0,
    } as const
    await assessWriting(done.id, rubric, 1200)
    const backup = await roundTrip()
    expect(backup.data.writings).toHaveLength(2)

    // This device writes more in the draft after the backup was made.
    await saveWritingText(draft.id, 'Hej igen', 1300)
    expect(await mergeBackup(backup)).toBe(0)
    expect((await db.writings.get(draft.id))?.text).toBe('Hej igen')

    await resetDb()
    await replaceWithBackup(backup)
    expect(await db.writings.get(done.id)).toMatchObject({
      text: 'Hej Sara!',
      submittedAt: 1100,
      rubric,
    })
    expect(summariseBackup(backup).writings).toBe(2)
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
    schemaVersion: 3,
    exportedAt: 1,
    appVersion: '1.0.0',
    data: {
      attempts: [],
      settings: [],
      cards: [],
      studyDays: [],
      writings: [],
    },
  })
  // Test files name only the tables they are about; the rest are empty.
  const parse = (value: unknown) => {
    const v = value as { data?: Record<string, unknown> }
    const data = v.data && {
      cards: [],
      studyDays: [],
      writings: [],
      ...v.data,
    }
    return parseBackup(JSON.stringify(v.data ? { ...v, data } : v))
  }

  it('accepts the listening speed setting, and only the speeds the app offers', () => {
    const withRate = (value: number) =>
      parse({
        ...valid(),
        data: {
          attempts: [],
          settings: [{ key: 'playbackRate', value, updatedAt: 1 }],
        },
      })
    expect(withRate(0.75).ok).toBe(true)
    expect(withRate(3).ok).toBe(false)
  })

  it('imports a version 1 file, which has no word cards', () => {
    const v1 = {
      ...valid(),
      schemaVersion: 1,
      data: { attempts: [], settings: [] },
    }
    const result = parseBackup(JSON.stringify(v1))
    expect(result).toMatchObject({
      ok: true,
      backup: {
        schemaVersion: 3,
        data: { cards: [], studyDays: [], writings: [] },
      },
    })
  })

  it('imports a version 2 file, which has no texts', () => {
    const v2 = {
      ...valid(),
      schemaVersion: 2,
      data: { attempts: [], settings: [], cards: [], studyDays: [] },
    }
    expect(parseBackup(JSON.stringify(v2))).toMatchObject({
      ok: true,
      backup: { schemaVersion: 3, data: { writings: [] } },
    })
  })

  it('refuses a word card whose id or memory does not hold together', async () => {
    const card = await startWord({ wordId: 'lon', packId: 'p' }, Date.now())
    const backup = await roundTrip()
    const withCard = (c: unknown) =>
      parseBackup(
        JSON.stringify({ ...backup, data: { ...backup.data, cards: [c] } }),
      )
    expect(withCard(backup.data.cards[0]).ok).toBe(true)
    expect(withCard({ ...card, id: 'lon:en-sv' })).toMatchObject({
      ok: false,
      error: /does not match/,
    })
    expect(withCard({ ...card, memory: {} })).toMatchObject({
      ok: false,
      error: /incomplete/,
    })
  })

  it('refuses a version 3 file without its word cards', () => {
    const noCards = { ...valid(), data: { attempts: [], settings: [] } }
    expect(parseBackup(JSON.stringify(noCards)).ok).toBe(false)
  })

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
