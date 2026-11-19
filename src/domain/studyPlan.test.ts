import { describe, expect, it } from 'vitest'
import { calendarWeeks } from './heatmaps.ts'
import { mockPercents, readyFor } from './mock.ts'
import type { Readiness } from './readiness.ts'
import { streak, studyPlan, type PlanInput } from './studyPlan.ts'

const ready = (percent: number): Readiness => ({
  status: percent >= 75 ? 'ready' : percent >= 60 ? 'almost' : 'not-yet',
  percent,
  count: 20,
})
const unknown: Readiness = { status: 'insufficient', count: 0, needed: 15 }

const input = (overrides: Partial<PlanInput> = {}): PlanInput => ({
  today: '2027-01-01',
  examDate: null,
  wordsToday: 12,
  readiness: {
    lasa: ready(80),
    hora: ready(55),
    skriva: ready(70),
    tala: ready(90),
  },
  nextLesson: { id: 'g-v2', title: 'Verbet på plats två' },
  writingThisWeek: 0,
  speakingThisWeek: 2,
  mock: {
    id: 'd-prov-1',
    title: 'Provövning',
    nextPart: null,
    finished: false,
    partDoneToday: false,
  },
  ...overrides,
})
const ids = (i: PlanInput) => studyPlan(i).map((p) => p.id)

describe('studyPlan', () => {
  it('lists words, the weakest part, grammar and the weekly writing', () => {
    expect(ids(input())).toEqual(['words', 'focus', 'grammar', 'writing'])
    expect(studyPlan(input())[1]).toMatchObject({
      title: '10 minutes of Höra – listening',
      to: '/exam/hora',
    })
  })

  it('puts a part without enough practice first, in test order', () => {
    expect(
      studyPlan(
        input({
          readiness: {
            lasa: ready(50),
            hora: unknown,
            skriva: unknown,
            tala: ready(90),
          },
        }),
      )[1]!.to,
    ).toBe('/exam/hora')
  })

  it('leaves out what is done: no words due, no lesson left, writing done', () => {
    expect(
      ids(input({ wordsToday: 0, nextLesson: null, writingThisWeek: 2 })),
    ).toEqual(['focus'])
  })

  it('does not ask for writing twice when writing is the weakest part', () => {
    expect(
      ids(
        input({
          readiness: {
            lasa: ready(80),
            hora: ready(80),
            skriva: ready(40),
            tala: ready(90),
          },
        }),
      ),
    ).not.toContain('writing')
  })

  it.each([
    [null, false, ''],
    ['2027-01-30', false, ''], // 29 days: outside the window
    ['2027-01-22', true, 'Start a mock exam'], // 21 days
    ['2027-01-08', true, 'A whole mock exam today'], // 7 days
    ['2027-01-04', true, 'A whole mock exam today'], // 3 days
    ['2027-01-01', false, ''], // the test is today
  ] as const)('exam on %s: mock item %s', (examDate, shown, title) => {
    const plan = studyPlan(input({ examDate }))
    expect(plan[0]!.id === 'mock').toBe(shown)
    if (shown) expect(plan[0]!.title).toBe(title)
  })

  it('names the next part of a mock in progress', () => {
    expect(
      studyPlan(
        input({
          examDate: '2027-01-10',
          mock: {
            id: 'd-prov-1',
            title: 'P',
            nextPart: 'skriva',
            finished: false,
            partDoneToday: false,
          },
        }),
      )[0]!.title,
    ).toBe('Mock exam: Skriva – writing')
  })
})

describe('the mock item', () => {
  const withMock = (
    examDate: string,
    m: Partial<NonNullable<PlanInput['mock']>>,
  ) =>
    input({
      examDate,
      mock: {
        id: 'd-prov-1',
        title: 'P',
        nextPart: 'hora',
        finished: false,
        partDoneToday: false,
        ...m,
      },
    })
  it('waits for tomorrow once a part is done today', () => {
    expect(ids(withMock('2027-01-10', { partDoneToday: true }))).not.toContain(
      'mock',
    )
  })
  it('offers a finished mock again, and says one day, not one days', () => {
    const plan = studyPlan(
      withMock('2027-01-02', { nextPart: null, finished: true }),
    )
    expect(plan[0]).toMatchObject({ title: 'Take the mock again' })
    expect(plan[0]!.detail).toMatch(/^1 day to the test/)
  })
  it('still asks for the whole mock on day 7, even after a part today', () => {
    expect(
      studyPlan(
        withMock('2027-01-08', { nextPart: null, partDoneToday: true }),
      )[0]!.title,
    ).toBe('A whole mock exam today')
  })
})

describe('streak', () => {
  const days = (entries: [string, number][]) => new Map(entries)
  it.each([
    [[], 0],
    [[['2027-01-10', 5]], 1],
    [[['2027-01-10', 4]], 0], // fewer than five things is not a study day
    [
      [
        ['2027-01-09', 5],
        ['2027-01-08', 9],
      ],
      2,
    ], // yesterday still counts
    [
      [
        ['2027-01-10', 5],
        ['2027-01-09', 5],
        ['2027-01-07', 5],
      ],
      2,
    ],
  ] as const)('%j gives %i', (entries, expected) => {
    expect(
      streak(days(entries as unknown as [string, number][]), '2027-01-10'),
    ).toBe(expected)
  })
})

describe('calendarWeeks', () => {
  it('ends with the week of today, Monday first, future days empty', () => {
    const weeks = calendarWeeks('2027-01-13', 2) // a Wednesday
    expect(weeks.map((w) => w.weekStart)).toEqual(['2027-01-04', '2027-01-11'])
    expect(weeks[1]!.days).toEqual([
      '2027-01-11',
      '2027-01-12',
      '2027-01-13',
      null,
      null,
      null,
      null,
    ])
  })
})

describe('readyFor', () => {
  const all = (p: number | null) => ({ lasa: p, hora: p, skriva: p, tala: p })
  it.each([
    [true, [{ level: 'D', percents: all(75) }], true],
    [false, [{ level: 'D', percents: all(90) }], false], // parts not ready
    [true, [{ level: 'C', percents: all(90) }], false], // another level
    [true, [{ level: 'D', percents: { ...all(90), skriva: 74 } }], false],
    [true, [{ level: 'D', percents: { ...all(90), hora: null } }], false], // marks pending
    [true, [{ level: 'D', percents: null }], false],
  ] as const)(
    'parts ready %s with %j: ready %s',
    (partsReady, mocks, ready) => {
      expect(readyFor('D', partsReady, [...mocks], 75).ready).toBe(ready)
    },
  )
})

describe('mockPercents', () => {
  const mc = {
    type: 'mc' as const,
    id: 'q',
    prompt: '?',
    options: ['a', 'b'],
    answer: 0,
    explain: '-',
  }
  it('scores Läsa and Höra, and averages self-assessments once all are made', () => {
    const parts = {
      lasa: [mc],
      hora: [{ ...mc, id: 'h' }],
      skriva: ['s1', 's2'],
      tala: ['t'],
    }
    const run = {
      responses: { q: 0, h: 1 },
      marks: {},
      assessments: { s1: { a: 2, b: 2 }, t: { a: 1, b: 1 } } as Record<
        string,
        Record<string, 0 | 1 | 2>
      >,
    }
    expect(mockPercents(parts, run)).toEqual({
      lasa: 100,
      hora: 0,
      skriva: null,
      tala: 50,
    })
    run.assessments.s2 = { a: 0, b: 2 }
    expect(mockPercents(parts, run).skriva).toBe(75)
  })

  it('rounds each task down first, as the result screen does', () => {
    // 10 of 12 is 83%, 8 of 12 is 66%: 74, not the 75 of unrounded shares.
    const of12 = (n: number) =>
      Object.fromEntries(
        Array.from({ length: 6 }, (_, i) => [
          `c${i}`,
          Math.min(2, Math.max(0, n - 2 * i)) as 0 | 1 | 2,
        ]),
      )
    expect(
      mockPercents(
        { lasa: [], hora: [], skriva: ['a', 'b'], tala: [] },
        { responses: {}, marks: {}, assessments: { a: of12(10), b: of12(8) } },
      ).skriva,
    ).toBe(74)
  })
})
