/**
 * Simple checks of a learner's text, shown as "check this", never as errors.
 * They look for patterns, not meaning, so they can miss a mistake or flag a
 * right sentence. The sentences they are tested with are in
 * content/check-sentences.yaml, for the reviewer to approve.
 */

export type Register = 'informal' | 'formal'

export interface WritingCheck {
  id:
    | 'length'
    | 'paragraphs'
    | 'greeting'
    | 'closing'
    | 'linking'
    | 'v2'
    | 'biff'
    | 'repeats'
  /** `check` when the learner should look again. */
  status: 'ok' | 'check'
  title: string
  detail: string
  /** The places in the text it is about, quoted. */
  quotes?: string[]
}

const PRONOUNS = new Set([
  'jag',
  'du',
  'han',
  'hon',
  'hen',
  'vi',
  'ni',
  'de',
  'dom',
  'man',
  'det',
  'den',
])

/**
 * Words and phrases that take place 1 and must be followed by the verb.
 * "sedan" and "då" are left out: "Sedan jag flyttade…" is right ("since").
 */
const FRONTED = [
  'igår',
  'i går',
  'idag',
  'i dag',
  'imorgon',
  'i morgon',
  'ikväll',
  'i kväll',
  'i helgen',
  'i somras',
  'i vintras',
  'nu',
  'ibland',
  'ofta',
  'därför',
  'dessutom',
  'tyvärr',
  'först',
  'till sist',
  'till slut',
  'efter det',
  'förra veckan',
  'förra månaden',
  'förra året',
  'nästa vecka',
  'nästa år',
].map((p) => p.split(' '))

/** Words that start a subordinate clause, where BIFF applies. */
const SUBORDINATORS = new Set([
  'att',
  'eftersom',
  'om',
  'när',
  'fast',
  'medan',
  'innan',
  'ifall',
  'tills',
  'som',
])

/** Sentence adverbs that come before the verb in a subordinate clause. */
const CLAUSE_ADVERBS = new Set([
  'inte',
  'aldrig',
  'alltid',
  'ofta',
  'också',
  'redan',
  'sällan',
])

const LINKING = [
  'men',
  'eftersom',
  'därför',
  'sedan',
  'sen',
  'först',
  'till sist',
  'till slut',
  'dessutom',
  'också',
  'fast',
  'när',
  'så att',
  'däremot',
  'alltså',
  'till exempel',
  'efter det',
  'innan',
  'medan',
  'för att',
]

const GREETINGS = {
  informal: ['hej', 'hejsan', 'hallå', 'tjena', 'tja', 'kära', 'hejhej'],
  formal: ['hej', 'bästa', 'till', 'god morgon', 'god dag'],
}
const TOO_INFORMAL_GREETINGS = ['hejsan', 'hallå', 'tjena', 'tja', 'hejhej']

const CLOSINGS = {
  informal: [
    'kram',
    'kramar',
    'puss',
    'hörs',
    'vi ses',
    'ha det bra',
    'hälsningar',
    'vänliga hälsningar',
    'med vänliga hälsningar',
  ],
  formal: [
    'med vänliga hälsningar',
    'med vänlig hälsning',
    'vänliga hälsningar',
    'hälsningar',
    'mvh',
  ],
}
const TOO_INFORMAL_CLOSINGS = ['kram', 'kramar', 'puss', 'hörs', 'vi ses']

/** Common words a text cannot avoid repeating. */
const STOPWORDS = new Set(
  (
    'mycket också eller från efter eftersom därför skulle inte hade kanske ' +
    'några något någon alla bara sedan vill ska kan måste där här detta denna ' +
    'dessa mina dina våra hans hennes deras sina sitt mitt ditt vårt hälsningar ' +
    'vänliga tack till för med som och det den att har är'
  ).split(' '),
)

/** Lower-case words of a text, letters only. */
export const wordsOf = (text: string): string[] =>
  text.toLocaleLowerCase('sv').match(/[\p{L}]+(?:-[\p{L}]+)*/gu) ?? []

export const countWords = (text: string): number => wordsOf(text).length

/** Sentences: split at . ! ? and line breaks, each as its words. */
const sentencesOf = (text: string): { text: string; words: string[] }[] =>
  text
    .split(/[.!?]+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ text: s, words: wordsOf(s) }))

const startsWith = (words: string[], phrase: string[]) =>
  phrase.every((w, i) => words[i] === w)

/** Whether `phrase` (one or more words) occurs in `words`. */
const contains = (words: string[], phrase: string) => {
  const parts = phrase.split(' ')
  return words.some((_, i) => startsWith(words.slice(i), parts))
}

const quote = (words: string[], from: number, length: number) =>
  `${words.slice(from, from + length).join(' ')}…`

/** Sentences where the verb may not come second, as "I går jag…". */
export function v2Misses(text: string): string[] {
  const found: string[] = []
  for (const { text: sentence, words } of sentencesOf(text)) {
    const fronted = FRONTED.find((p) => startsWith(words, p))
    if (fronted && PRONOUNS.has(words[fronted.length]!)) {
      found.push(quote(words, 0, fronted.length + 2))
      continue
    }
    // "I Sverige man…", "På jobbet jag…": a place or time with i or på.
    if (
      (words[0] === 'i' || words[0] === 'på') &&
      words.length > 3 &&
      !PRONOUNS.has(words[1]!) &&
      PRONOUNS.has(words[2]!)
    ) {
      found.push(quote(words, 0, 4))
      continue
    }
    // A subordinate clause first: "När jag kom hem, jag åt…".
    if (SUBORDINATORS.has(words[0]!) && words[0] !== 'att') {
      const comma = sentence.indexOf(',')
      if (comma < 0) continue
      const after = wordsOf(sentence.slice(comma + 1))
      if (PRONOUNS.has(after[0]!))
        found.push(
          `${sentence.slice(0, comma + 1)} ${after.slice(0, 2).join(' ')}…`,
        )
    }
  }
  return found
}

/** Subordinate clauses where inte may come after the verb, as "att han kommer inte". */
export function biffMisses(text: string): string[] {
  const found: string[] = []
  for (const { words } of sentencesOf(text)) {
    words.forEach((word, i) => {
      if (!SUBORDINATORS.has(word)) return
      const next = words[i + 1]
      if (!next) return
      if (PRONOUNS.has(next) && CLAUSE_ADVERBS.has(words[i + 3]!))
        found.push(quote(words, i, 4))
      // "…en kollega som jobbar inte": som is the subject itself.
      else if (
        word === 'som' &&
        !PRONOUNS.has(next) &&
        !CLAUSE_ADVERBS.has(next) &&
        CLAUSE_ADVERBS.has(words[i + 2]!)
      )
        found.push(quote(words, i, 3))
    })
  }
  return found
}

const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

export interface WritingTask {
  register: Register
  words: { min: number; max: number }
}

export function checkWriting(text: string, task: WritingTask): WritingCheck[] {
  const words = wordsOf(text)
  const all = lines(text)
  const firstLine = wordsOf(all[0] ?? '')
  const ending = wordsOf(all.slice(-3).join(' '))
  const checks: WritingCheck[] = []

  const { min, max } = task.words
  checks.push(
    words.length < min
      ? {
          id: 'length',
          status: 'check',
          title: `${words.length} words`,
          detail: `Aim for ${min}–${max} words, so there is room for every point of the task.`,
        }
      : words.length > max
        ? {
            id: 'length',
            status: 'check',
            title: `${words.length} words`,
            detail: `Aim for ${min}–${max} words. A longer text takes more time and has more room for mistakes.`,
          }
        : {
            id: 'length',
            status: 'ok',
            title: `${words.length} words`,
            detail: `Within ${min}–${max}.`,
          },
  )

  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((block) => countWords(block) >= 10).length
  checks.push(
    words.length >= 60 && paragraphs < 2
      ? {
          id: 'paragraphs',
          status: 'check',
          title: 'One block of text',
          detail:
            'Give each thing you write about its own paragraph, with an empty line between them.',
        }
      : {
          id: 'paragraphs',
          status: 'ok',
          title: `${paragraphs} paragraph${paragraphs === 1 ? '' : 's'}`,
          detail: 'Each paragraph should hold one thing you write about.',
        },
  )

  const greeting = GREETINGS[task.register].find((g) =>
    startsWith(firstLine, g.split(' ')),
  )
  const informalGreeting = TOO_INFORMAL_GREETINGS.find(
    (g) => firstLine[0] === g,
  )
  checks.push(
    task.register === 'formal' && informalGreeting
      ? {
          id: 'greeting',
          status: 'check',
          title: 'A greeting for friends',
          detail: `"${informalGreeting}" is for friends. In a formal text, start with "Hej" and the name, or "Till …".`,
        }
      : !greeting
        ? {
            id: 'greeting',
            status: 'check',
            title: 'No greeting found',
            detail:
              task.register === 'formal'
                ? 'Start on its own line, for example "Hej Anders Berg," or "Till hyresvärden".'
                : 'Start on its own line, for example "Hej Sara!".',
          }
        : {
            id: 'greeting',
            status: 'ok',
            title: 'Greeting',
            detail: `Starts with "${greeting}".`,
          },
  )

  const informalClosing = TOO_INFORMAL_CLOSINGS.find((c) => contains(ending, c))
  const closing = CLOSINGS[task.register].find((c) => contains(ending, c))
  checks.push(
    task.register === 'formal' && informalClosing
      ? {
          id: 'closing',
          status: 'check',
          title: 'A closing for friends',
          detail: `"${informalClosing}" is for friends. In a formal text, end with "Med vänliga hälsningar" and your full name.`,
        }
      : !closing
        ? {
            id: 'closing',
            status: 'check',
            title: 'No closing found',
            detail:
              task.register === 'formal'
                ? 'End with "Med vänliga hälsningar" and your full name.'
                : 'End with, for example, "Ha det bra!" or "Kram" and your name.',
          }
        : {
            id: 'closing',
            status: 'ok',
            title: 'Closing',
            detail: `Ends with "${closing}".`,
          },
  )

  const linking = LINKING.filter((l) => contains(words, l))
  checks.push(
    linking.length < 2
      ? {
          id: 'linking',
          status: 'check',
          title: 'Few linking words',
          detail:
            'Link your sentences with words such as eftersom, men, därför, sedan and dessutom.',
          quotes: linking,
        }
      : {
          id: 'linking',
          status: 'ok',
          title: `${linking.length} linking words`,
          detail: linking.join(', '),
        },
  )

  const v2 = v2Misses(text)
  checks.push(
    v2.length
      ? {
          id: 'v2',
          status: 'check',
          title: 'The verb may not come second',
          detail:
            'When a sentence starts with something other than the subject, the verb comes next: "I går gick jag…".',
          quotes: v2,
        }
      : {
          id: 'v2',
          status: 'ok',
          title: 'Verb second',
          detail: 'No sentence found that starts like "I går jag…".',
        },
  )

  const biff = biffMisses(text)
  checks.push(
    biff.length
      ? {
          id: 'biff',
          status: 'check',
          title: 'Inte may be after the verb',
          detail:
            'After att, eftersom, om, när and som, inte comes before the verb: "…att han inte kommer".',
          quotes: biff,
        }
      : {
          id: 'biff',
          status: 'ok',
          title: 'Inte in subordinate clauses',
          detail: 'No clause found like "…att han kommer inte".',
        },
  )

  const counts = new Map<string, number>()
  for (const w of words)
    if (w.length >= 4 && !STOPWORDS.has(w))
      counts.set(w, (counts.get(w) ?? 0) + 1)
  const repeated = [...counts]
    .filter(([, n]) => n >= 4)
    .sort((a, b) => b[1] - a[1])
    .map(([w, n]) => `${w} (${n} times)`)
  checks.push(
    repeated.length
      ? {
          id: 'repeats',
          status: 'check',
          title: 'Repeated words',
          detail: 'Try another word or a pronoun now and then.',
          quotes: repeated,
        }
      : {
          id: 'repeats',
          status: 'ok',
          title: 'Varied words',
          detail: 'No word is used four times or more.',
        },
  )
  return checks
}
