import {
  FORM_COUNT,
  GAP,
  type GrammarItem,
  type GrammarLesson,
  type GrammarPack,
  type Item,
  type Level,
  type ListeningPack,
  type MockPack,
  type ReadingPack,
  type ReadingText,
  type ScenarioPack,
  type SpeakingPack,
  type VocabPack,
  type Word,
  type WritingPack,
} from './schema.ts'
import { normalizeAnswer } from '../answerCheck.ts'
import { acceptedOrders, shuffledChunks, wordBag } from '../grammar.ts'
import { parseLesson } from '../lessonText.ts'
import { WRITING_TASKS } from '../examFormat.ts'
import { MODEL_WORDS } from '../speaking.ts'
import { WRITING_WORDS } from '../writing.ts'
import { countWords as countTextWords } from '../writingChecks.ts'
import { KP27_POINT_IDS, type Kp27Point } from './kp27.ts'

export type Pack =
  | ReadingPack
  | ListeningPack
  | VocabPack
  | GrammarPack
  | WritingPack
  | SpeakingPack
  | ScenarioPack
  | MockPack

/**
 * Word-count range of one reading text per level. C texts stay short; D allows
 * the longer article the test always includes. Tunable, not official limits.
 */
export const TEXT_WORDS: Record<Level, { min: number; max: number }> = {
  C: { min: 20, max: 350 },
  D: { min: 30, max: 600 },
}

/** Word-count range of everything said in one listening clip. */
export const CLIP_WORDS: Record<Level, { min: number; max: number }> = {
  C: { min: 15, max: 300 },
  D: { min: 20, max: 450 },
}

export const countWords = (s: string): number =>
  s.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length

export const textWords = (t: ReadingText): number =>
  t.blocks.reduce(
    (n, b) =>
      n +
      countWords(b.heading ?? '') +
      b.lines.reduce((m, line) => m + countWords(line), 0),
    0,
  )

/** One text or clip: what every pack shares, whatever its part of the test. */
interface Unit {
  id: string
  status: 'draft' | 'reviewed'
  reviewedBy?: string
  reviewedAt?: string
  kp27: Kp27Point[]
  items: (Item | GrammarItem)[]
  words: number
  /** The allowed word count, for texts and clips. */
  range: { min: number; max: number } | null
}

/**
 * A mock as the packs of its four parts, so every part is checked by the
 * same rules as drills of that part.
 */
export function mockParts(
  mock: MockPack,
): [ReadingPack, ListeningPack, WritingPack, SpeakingPack] {
  const base = { version: mock.version, level: mock.level, title: mock.title }
  return [
    { ...base, id: `${mock.id}-lasa`, skill: 'lasa', texts: mock.lasa },
    { ...base, id: `${mock.id}-hora`, skill: 'hora', clips: mock.hora },
    { ...base, id: `${mock.id}-skriva`, skill: 'skriva', prompts: mock.skriva },
    { ...base, id: `${mock.id}-tala`, skill: 'tala', ...mock.tala },
  ]
}

export function packUnits(pack: Pack): Unit[] {
  if (pack.skill === 'prov') return mockParts(pack).flatMap(packUnits)
  if (pack.skill === 'lasa')
    return pack.texts.map((t) => ({
      ...t,
      words: textWords(t),
      range: TEXT_WORDS[pack.level],
    }))
  if (pack.skill === 'hora')
    return pack.clips.map((c) => ({
      ...c,
      words: c.lines.reduce((n, l) => n + countWords(l.say ?? l.text), 0),
      range: CLIP_WORDS[pack.level],
    }))
  if (pack.skill === 'grammatik')
    return pack.lessons.map((l) => ({ ...l, words: 0, range: null }))
  // A speaking task has no questions; its model answer is about three
  // minutes of speech.
  // A scenario is checked like a clip: its dialogue has the questions.
  if (pack.skill === 'vardag')
    return pack.scenarios.map((s) => ({
      ...s,
      items: s.dialog.items,
      words: s.dialog.lines.reduce(
        (n, l) => n + countWords(l.say ?? l.text),
        0,
      ),
      range: CLIP_WORDS[pack.level],
    }))
  if (pack.skill === 'tala')
    return [
      ...pack.tasks.map((t) => ({
        ...t,
        items: [],
        words: t.model.reduce((n, l) => n + countWords(l.say ?? l.text), 0),
        range: MODEL_WORDS,
      })),
      ...pack.pairs.map((p) => ({ ...p, items: [], words: 0, range: null })),
    ]
  // A writing prompt has no questions; its model answer must fit the length
  // the app suggests to the learner.
  if (pack.skill === 'skriva')
    return pack.prompts.map((p) => ({
      ...p,
      items: [],
      words: countTextWords(p.model.lines.join('\n')),
      range: WRITING_WORDS[pack.level],
    }))
  // A word is a unit with no questions: its card is the practice.
  return pack.words.map((w) => ({
    ...w,
    kp27: ['sprak.ordforrad-bojning' as const],
    items: [],
    words: 0,
    range: null,
  }))
}

/** The problems of one word's forms, which the cards and audio rely on. */
function wordProblems(word: Word): string[] {
  const problems: string[] = []
  const expected = FORM_COUNT[word.pos]
  if (word.forms.length !== expected)
    problems.push(
      `a ${word.pos} lists ${expected} forms, not ${word.forms.length}`,
    )
  const first = word.forms[0] ?? ''
  if (word.pos === 'noun' && !/^(en|ett) /.test(first))
    problems.push(`a noun starts with "en" or "ett", not "${first}"`)
  if (word.pos === 'verb' && !first.startsWith('att '))
    problems.push(`a verb starts with "att", not "${first}"`)
  return problems.map((p) => `word ${word.id}: ${p}`)
}

/** Problems in a lesson's explanation, which the app renders as written. */
const lessonProblems = (lesson: GrammarLesson): string[] =>
  parseLesson(lesson.body).problems.map((p) => `body: ${p}`)

function itemProblems(item: Item | GrammarItem): string[] {
  const problems: string[] = []
  const unique = (list: string[]) =>
    new Set(list.map(normalizeAnswer)).size === list.length

  if (item.type === 'mc') {
    if (item.answer >= item.options.length)
      problems.push(
        `answer ${item.answer} is not one of ${item.options.length} options`,
      )
    if (!unique(item.options)) problems.push('options repeat')
  }
  if (item.type === 'short' && !unique(item.accept))
    problems.push('accepted answers repeat')
  if (item.type === 'match') {
    for (const pair of item.pairs) {
      if (pair.answer >= item.options.length)
        problems.push(
          `"${pair.q}" points at option ${pair.answer}, which does not exist`,
        )
    }
    const answers = item.pairs.map((p) => p.answer)
    if (new Set(answers).size !== answers.length)
      problems.push('two pairs share one answer')
    if (!unique(item.options)) problems.push('options repeat')
  }
  if (item.type === 'order') {
    const bag = wordBag(item.chunks.join(' '))
    for (const other of item.alsoAccept ?? [])
      if (wordBag(other) !== bag)
        problems.push(`"${other}" is not made of the chunks`)
    if (!unique(acceptedOrders(item))) problems.push('accepted orders repeat')
    if (!shuffledChunks(item))
      problems.push('the chunks cannot be shuffled into a wrong order')
  }
  if (item.type === 'gap' && item.sentence.split(GAP).length !== 2)
    problems.push(`the sentence needs exactly one ${GAP}`)
  if (
    (item.type === 'gap' || item.type === 'transform') &&
    !unique(item.accept)
  )
    problems.push('accepted answers repeat')
  if (
    item.type === 'transform' &&
    item.accept.some((a) => normalizeAnswer(a) === normalizeAnswer(item.from))
  )
    problems.push('an accepted answer is the sentence itself')
  return problems.map((p) => `item ${item.id}: ${p}`)
}

/** Problems that Zod cannot see. An empty list means the packs are valid. */
export function packProblems(given: Pack[]): string[] {
  const problems: string[] = []
  for (const mock of given)
    if (mock.skill === 'prov') {
      const needed = WRITING_TASKS[mock.level]
      if (mock.skriva.length !== needed)
        problems.push(
          `${mock.id}: a ${mock.level} mock has ${needed} writing task(s), not ${mock.skriva.length}`,
        )
      if (
        mock.level === 'D' &&
        !mock.skriva.some((p) => p.register === 'formal')
      )
        problems.push(`${mock.id}: a D mock needs a formal writing task`)
    }
  // A mock is checked as the packs of its parts; its own id is claimed too.
  const packs = given.flatMap((p) => (p.skill === 'prov' ? mockParts(p) : [p]))
  const seen = new Map<string, string>()
  const claim = (id: string, where: string) => {
    const before = seen.get(id)
    if (before) problems.push(`id ${id} is used twice: ${before} and ${where}`)
    else seen.set(id, where)
  }
  for (const mock of given)
    if (mock.skill === 'prov') claim(mock.id, `mock ${mock.id}`)

  const headwords = new Map<string, string>()
  for (const pack of packs) {
    claim(pack.id, `pack ${pack.id}`)
    if (pack.skill === 'ord')
      for (const word of pack.words) {
        problems.push(...wordProblems(word).map((p) => `${pack.id}: ${p}`))
        const key = word.forms[0]!.toLocaleLowerCase('sv')
        const before = headwords.get(key)
        if (before)
          problems.push(
            `"${word.forms[0]}" is in two packs: ${before} and ${pack.id}`,
          )
        else headwords.set(key, pack.id)
      }
    if (pack.skill === 'skriva')
      for (const prompt of pack.prompts) {
        const model = prompt.model.lines.join('\n')
        for (const { quote } of prompt.model.notes)
          if (!model.includes(quote))
            problems.push(
              `${pack.id}/${prompt.id}: the note on "${quote}" quotes nothing in the model answer`,
            )
      }
    if (pack.skill === 'vardag')
      for (const s of pack.scenarios) {
        claim(s.dialog.id, `${pack.id}/${s.id}/dialog`)
        // The build names the other audio of a scenario <id>-fras-N and
        // <id>-roll-N, so the dialogue's own id may not look like those.
        if (/-(fras|roll)-[a-z0-9]+$/.test(s.dialog.id))
          problems.push(
            `${pack.id}/${s.id}: the dialogue id ${s.dialog.id} looks like a phrase or role-play audio name`,
          )
        if (s.roleplay.hints.length !== s.roleplay.partner.length)
          problems.push(
            `${pack.id}/${s.id}: the role-play needs one hint per partner line (${s.roleplay.partner.length}), not ${s.roleplay.hints.length}`,
          )
      }
    if (pack.skill === 'tala') {
      if (!pack.tasks.length && !pack.pairs.length)
        problems.push(`${pack.id}: a speaking pack needs tasks or pairs`)
      if (pack.pairs.length && !pack.phraseCards.length)
        problems.push(`${pack.id}: pair discussions need phraseCards`)
    }
    if (pack.skill === 'grammatik')
      for (const lesson of pack.lessons)
        problems.push(
          ...lessonProblems(lesson).map((p) => `${pack.id}/${lesson.id}: ${p}`),
        )
    for (const unit of packUnits(pack)) {
      const where = `${pack.id}/${unit.id}`
      claim(unit.id, where)
      if (
        unit.range &&
        (unit.words < unit.range.min || unit.words > unit.range.max)
      )
        problems.push(
          `${where}: ${unit.words} words, outside ${unit.range.min}-${unit.range.max} for level ${pack.level}`,
        )
      if (unit.status === 'reviewed' && !(unit.reviewedBy && unit.reviewedAt))
        problems.push(`${where}: reviewed without reviewedBy and reviewedAt`)
      for (const item of unit.items) {
        claim(item.id, `${where}/${item.id}`)
        problems.push(...itemProblems(item).map((p) => `${where}: ${p}`))
      }
    }
  }
  return problems
}

const keep = <T extends { status: string }>(list: T[], drafts: boolean) =>
  list.filter((u) => drafts || u.status === 'reviewed')

/**
 * The packs as shipped. Production keeps only reviewed texts and clips and
 * drops packs left empty; preview builds keep drafts so they can be tried.
 */
export function publishable<P extends Pack>(
  packs: P[],
  includeDrafts: boolean,
): P[] {
  return packs
    .map((pack) =>
      // A mock is all or nothing: half a test is no test.
      pack.skill === 'prov'
        ? includeDrafts || packUnits(pack).every((u) => u.status === 'reviewed')
          ? pack
          : {
              ...pack,
              lasa: [],
              hora: [],
              skriva: [],
              tala: { tasks: [], pairs: [], phraseCards: [] },
            }
        : pack.skill === 'lasa'
          ? { ...pack, texts: keep(pack.texts, includeDrafts) }
          : pack.skill === 'hora'
            ? { ...pack, clips: keep(pack.clips, includeDrafts) }
            : pack.skill === 'grammatik'
              ? { ...pack, lessons: keep(pack.lessons, includeDrafts) }
              : pack.skill === 'skriva'
                ? { ...pack, prompts: keep(pack.prompts, includeDrafts) }
                : pack.skill === 'vardag'
                  ? { ...pack, scenarios: keep(pack.scenarios, includeDrafts) }
                  : pack.skill === 'tala'
                    ? {
                        ...pack,
                        tasks: keep(pack.tasks, includeDrafts),
                        pairs: keep(pack.pairs, includeDrafts),
                      }
                    : { ...pack, words: keep(pack.words, includeDrafts) },
    )
    .filter((pack) => packUnits(pack).length > 0) as P[]
}

/** KP27 points that no text or clip trains yet. */
export function uncoveredPoints(packs: Pack[]): Kp27Point[] {
  const covered = new Set(
    packs.flatMap((p) => packUnits(p).flatMap((u) => u.kp27)),
  )
  return KP27_POINT_IDS.filter((id) => !covered.has(id))
}
