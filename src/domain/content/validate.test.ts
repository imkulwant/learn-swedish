import { describe, expect, it } from 'vitest'
import type {
  GrammarItem,
  GrammarPack,
  ListeningPack,
  MockPack,
  ReadingPack,
  ScenarioPack,
} from './schema.ts'
import { packProblems, publishable, textWords } from './validate.ts'

const sentence = 'Det här är en mening med några ord i sig.' // 10 words

function pack(overrides: Partial<ReadingPack> = {}): ReadingPack {
  return {
    id: 'p',
    version: 1,
    level: 'D',
    skill: 'lasa',
    title: 'P',
    texts: [
      {
        id: 't',
        status: 'draft',
        kp27: ['lyssna-lasa.strategier'],
        theme: 'arbete',
        instruction: 'Läs.',
        title: 'T',
        blocks: [{ lines: [sentence, sentence, sentence, sentence] }],
        items: [
          {
            type: 'mc',
            id: 'i',
            prompt: '?',
            options: ['a', 'b'],
            answer: 0,
            explain: '-',
          },
        ],
      },
    ],
    ...overrides,
  }
}

const withItem = (item: ReadingPack['texts'][number]['items'][number]) => {
  const p = pack()
  p.texts[0]!.items = [item]
  return p
}

describe('packProblems', () => {
  it('passes a valid pack', () => {
    expect(packProblems([pack()])).toEqual([])
  })

  it('finds an id used twice, across packs too', () => {
    const other = pack({ id: 'q' })
    expect(packProblems([pack(), other]).join()).toMatch(/id t is used twice/)
  })

  it('finds a multiple-choice answer that is not an option', () => {
    const p = withItem({
      type: 'mc',
      id: 'i',
      prompt: '?',
      options: ['a', 'b'],
      answer: 2,
      explain: '-',
    })
    expect(packProblems([p]).join()).toMatch(/answer 2 is not one of 2 options/)
  })

  it('finds repeated options and accepted answers', () => {
    expect(
      packProblems([
        withItem({
          type: 'mc',
          id: 'i',
          prompt: '?',
          options: ['a', 'A '],
          answer: 0,
          explain: '-',
        }),
      ]).join(),
    ).toMatch(/options repeat/)
    expect(
      packProblems([
        withItem({
          type: 'short',
          id: 'i',
          prompt: '?',
          accept: ['x', 'X'],
          model: 'x',
          explain: '-',
        }),
      ]).join(),
    ).toMatch(/accepted answers repeat/)
  })

  it('finds match pairs that point nowhere or share an answer', () => {
    const p = withItem({
      type: 'match',
      id: 'i',
      prompt: '?',
      pairs: [
        { q: 'a', answer: 0 },
        { q: 'b', answer: 0 },
        { q: 'c', answer: 5 },
      ],
      options: ['x', 'y'],
      explain: '-',
    })
    const found = packProblems([p]).join()
    expect(found).toMatch(/two pairs share one answer/)
    expect(found).toMatch(/"c" points at option 5/)
  })

  it('finds a text whose length does not fit its level', () => {
    const p = pack({ level: 'C' })
    p.texts[0]!.blocks = [{ lines: Array(40).fill(sentence) }]
    expect(textWords(p.texts[0]!)).toBe(400)
    expect(packProblems([p]).join()).toMatch(
      /400 words, outside 20-350 for level C/,
    )
  })

  it('requires a reviewer and date on a reviewed text', () => {
    const p = pack()
    p.texts[0]!.status = 'reviewed'
    expect(packProblems([p]).join()).toMatch(/reviewed without reviewedBy/)
  })
})

describe('publishable', () => {
  it('drops drafts and empty packs in production, and keeps them in previews', () => {
    expect(publishable([pack()], false)).toEqual([])
    expect(publishable([pack()], true)).toHaveLength(1)
  })
})

describe('listening packs', () => {
  const clipPack = (): ListeningPack => ({
    id: 'h',
    version: 1,
    level: 'D',
    skill: 'hora',
    title: 'H',
    clips: [
      {
        id: 'c',
        status: 'draft',
        kp27: ['lyssna-lasa.strategier'],
        theme: 'trafik',
        kind: 'utrop',
        instruction: 'Lyssna.',
        title: 'C',
        lines: [{ voice: 'nst', text: sentence + ' ' + sentence }],
        items: [
          {
            type: 'mc',
            id: 'ci',
            prompt: '?',
            options: ['a', 'b'],
            answer: 1,
            explain: '-',
          },
        ],
      },
    ],
  })

  it('checks clips like texts, counting what is said', () => {
    expect(packProblems([clipPack()])).toEqual([])
    const short = clipPack()
    short.clips[0]!.lines = [{ voice: 'alma', text: 'Hej.' }]
    expect(packProblems([short]).join()).toMatch(
      /1 words, outside 20-450 for level D/,
    )
  })

  it('finds ids shared between a text and a clip', () => {
    const p = clipPack()
    p.clips[0]!.id = 't'
    expect(packProblems([pack(), p]).join()).toMatch(/id t is used twice/)
  })

  it('ships draft clips only in previews', () => {
    expect(publishable([clipPack()], false)).toEqual([])
    expect(publishable([clipPack()], true)[0]?.clips).toHaveLength(1)
  })
})

describe('grammar packs', () => {
  const grammar = (
    items: GrammarItem[],
    body = 'The verb comes second: *Idag **har** jag tid.*',
  ): GrammarPack => ({
    id: 'g',
    version: 1,
    level: 'C',
    skill: 'grammatik',
    title: 'G',
    lessons: [
      {
        id: 'l',
        status: 'draft',
        kp27: ['sprak.meningsbyggnad'],
        title: 'Verbet på plats två',
        en: 'Verb second',
        body,
        items,
      },
    ],
  })
  const order: GrammarItem = {
    type: 'order',
    id: 'o',
    prompt: 'Börja med "Idag".',
    chunks: ['Idag', 'har', 'jag', 'tid'],
    alsoAccept: ['Jag har tid idag'],
    end: '.',
    explain: '-',
  }
  const gap: GrammarItem = {
    type: 'gap',
    id: 'g1',
    prompt: 'Perfekt.',
    sentence: 'Jag har ___ boken.',
    hint: 'läsa',
    accept: ['läst'],
    explain: '-',
  }
  const transform: GrammarItem = {
    type: 'transform',
    id: 't1',
    prompt: 'Skriv i perfekt.',
    from: 'Jag läser boken.',
    accept: ['Jag har läst boken.'],
    explain: '-',
  }

  it('passes a valid lesson', () => {
    expect(packProblems([grammar([order, gap, transform])])).toEqual([])
  })

  it('finds lesson text outside the Markdown subset', () => {
    expect(packProblems([grammar([gap], '# Title')]).join()).toMatch(
      /g\/l: body: .*a heading is one line/,
    )
  })

  it('finds an also-accepted order made of other words', () => {
    expect(
      packProblems([
        grammar([{ ...order, alsoAccept: ['Jag har tid nu'] }]),
      ]).join(),
    ).toMatch(/"Jag har tid nu" is not made of the chunks/)
    expect(
      packProblems([
        grammar([{ ...order, alsoAccept: ['idag har jag tid'] }]),
      ]).join(),
    ).toMatch(/accepted orders repeat/)
  })

  it('finds a gap sentence without exactly one gap', () => {
    for (const sentence of ['Jag har läst boken.', 'Jag ___ ___ boken.'])
      expect(packProblems([grammar([{ ...gap, sentence }])]).join()).toMatch(
        /needs exactly one ___/,
      )
  })

  it('finds a rewrite that is the sentence itself', () => {
    expect(
      packProblems([
        grammar([{ ...transform, accept: ['jag läser boken'] }]),
      ]).join(),
    ).toMatch(/an accepted answer is the sentence itself/)
  })

  it('ships draft lessons only in previews', () => {
    const packs = [grammar([gap])]
    expect(publishable(packs, false)).toEqual([])
    expect(publishable(packs, true)).toEqual(packs)
  })
})

describe('everyday scenarios', () => {
  const line = {
    voice: 'alma',
    text: 'Hej, hur kan jag hjälpa dig med det här i dag?',
  } as const
  const pack = (
    overrides: Partial<ScenarioPack['scenarios'][number]> = {},
  ): ScenarioPack => ({
    id: 'vardag-t',
    version: 1,
    level: 'D',
    skill: 'vardag',
    title: 'V',
    scenarios: [
      {
        id: 'v-t',
        status: 'draft',
        kp27: ['samtala.anpassning'],
        theme: 'hälsa',
        title: 'T',
        en: 'T',
        about: 'A',
        phrases: [
          { sv: 'Hej', en: 'Hi' },
          { sv: 'Tack', en: 'Thanks' },
          { sv: 'Hej då', en: 'Bye' },
        ],
        dialog: {
          id: 'v-t-dialog',
          kind: 'dialog',
          instruction: 'Lyssna.',
          title: 'D',
          lines: [line, line, line],
          items: [
            {
              type: 'mc',
              id: 'v-t-1',
              prompt: '?',
              options: ['a', 'b'],
              answer: 0,
              explain: '-',
            },
          ],
        },
        roleplay: {
          intro: 'I',
          partner: [line, line],
          closing: line,
          hints: [
            { en: 'Say hi.', example: 'Hej!' },
            { en: 'Say thanks.', example: 'Tack!' },
          ],
        },
        ...overrides,
      },
    ],
  })

  it('passes a valid scenario', () => {
    expect(packProblems([pack()])).toEqual([])
  })

  it('needs one hint per partner line', () => {
    const p = pack()
    p.scenarios[0]!.roleplay.hints.pop()
    expect(packProblems([p]).join()).toMatch(
      /one hint per partner line \(2\), not 1/,
    )
  })

  it('refuses a dialogue id that looks like generated audio, and ids used twice', () => {
    const p = pack()
    p.scenarios[0]!.dialog.id = 'v-t-roll-1'
    expect(packProblems([p]).join()).toMatch(
      /looks like a phrase or role-play audio name/,
    )
    const q = pack()
    q.scenarios[0]!.dialog.id = 'v-t'
    expect(packProblems([q]).join()).toMatch(/id v-t is used twice/)
  })

  it('ships draft scenarios only in previews', () => {
    expect(publishable([pack()], false)).toEqual([])
    expect(publishable([pack()], true)).toHaveLength(1)
  })
})

describe('mock exams', () => {
  const text = pack().texts[0]!
  const prompt = (id: string, register: 'informal' | 'formal') => ({
    id,
    status: 'draft' as const,
    kp27: ['sprak.textstruktur' as const],
    theme: 't',
    register,
    title: 'T',
    en: 'T',
    task: ['Skriv.'],
    points: ['Något.'],
    model: {
      lines: [
        'Hej! ' + 'Det här är en mening med några ord i sig. '.repeat(9),
        'Kram',
      ],
      notes: [{ quote: 'Hej!', note: 'A greeting.' }],
    },
  })
  const line = {
    voice: 'alma' as const,
    text: 'Jag ska berätta om något viktigt. '.repeat(30),
  }
  const mock = (overrides: Partial<MockPack> = {}): MockPack => ({
    id: 'm',
    version: 1,
    level: 'D',
    skill: 'prov',
    title: 'M',
    lasa: [{ ...text, id: 'm-t', items: [{ ...text.items[0]!, id: 'm-i' }] }],
    hora: [
      {
        id: 'm-c',
        status: 'draft',
        kp27: ['lyssna-lasa.strategier'],
        theme: 't',
        kind: 'utrop',
        instruction: 'Lyssna.',
        title: 'C',
        lines: [
          {
            voice: 'nst',
            text: 'Tåget mot Lindö är försenat i ungefär tjugo minuter i dag.',
          },
          {
            voice: 'nst',
            text: 'Vi ber om ursäkt för förseningen och tackar för ert tålamod.',
          },
        ],
        items: [{ ...text.items[0]!, id: 'm-ci' }],
      },
    ],
    skriva: [prompt('m-s1', 'informal'), prompt('m-s2', 'formal')],
    tala: {
      tasks: [
        {
          id: 'm-tt',
          status: 'draft',
          kp27: ['sprak.uttal'],
          theme: 't',
          title: 'T',
          en: 'T',
          task: ['Berätta.'],
          points: ['Något.'],
          phrases: ['Jag tycker …'],
          model: [line],
        },
      ],
      pairs: [
        {
          id: 'm-p',
          status: 'draft',
          kp27: ['samtala.samtal-diskussioner'],
          theme: 't',
          title: 'P',
          en: 'P',
          question: 'Vad?',
          mindmap: ['a', 'b', 'c', 'd'],
          goal: 'Kom överens.',
          partner: [line, line],
          closing: line,
        },
      ],
      phraseCards: [{ title: 'Agree', phrases: ['Ja.'] }],
    },
    ...overrides,
  })

  it('passes a valid mock, checked as its four parts', () => {
    expect(packProblems([mock()])).toEqual([])
  })

  it("needs the level's writing tasks, one of them formal at D", () => {
    expect(
      packProblems([mock({ skriva: [prompt('m-s1', 'informal')] })]).join(),
    ).toMatch(/a D mock has 2 writing task\(s\), not 1/)
    expect(
      packProblems([
        mock({
          skriva: [prompt('m-s1', 'informal'), prompt('m-s2', 'informal')],
        }),
      ]).join(),
    ).toMatch(/needs a formal writing task/)
  })

  it('refuses a mock item that a drill also uses', () => {
    const drill = pack()
    drill.texts[0]!.items[0]!.id = 'm-i'
    expect(packProblems([mock(), drill]).join()).toMatch(/id m-i is used twice/)
  })

  it('ships a mock only when every part is reviewed', () => {
    const reviewed = {
      status: 'reviewed' as const,
      reviewedBy: 'A',
      reviewedAt: '2026-11-18',
    }
    const m = mock()
    const all = (x: MockPack) => [
      ...x.lasa,
      ...x.hora,
      ...x.skriva,
      ...x.tala.tasks,
      ...x.tala.pairs,
    ]
    all(m).forEach((u) => Object.assign(u, reviewed))
    expect(publishable([m], false)).toHaveLength(1)
    m.hora[0]!.status = 'draft'
    expect(publishable([m], false)).toEqual([])
    expect(publishable([m], true)).toHaveLength(1)
  })
})
