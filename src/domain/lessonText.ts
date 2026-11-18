/**
 * The Markdown subset grammar lessons are written in. It is small on purpose:
 * the app renders the result as React elements, never as HTML, and the build
 * refuses anything outside it, so a reviewer's edit cannot break a screen.
 *
 * Blocks, separated by a blank line:
 * - `## Heading`
 * - a paragraph: any lines of text
 * - a list: every line starts with `- `
 * - a table: every line starts with `|`, and the second line is `| --- | --- |`
 *
 * Inline: `**bold**`, and `*Swedish*` for Swedish examples inside English
 * text. Bold may sit inside Swedish, as in `*Idag **har** jag tid.*`.
 */

export type Inline =
  | string
  | { bold: Inline[] }
  | {
      /** Swedish, shown in italics and read out in Swedish. */
      sv: Inline[]
    }

export type LessonBlock =
  | { type: 'heading'; content: Inline[] }
  | { type: 'paragraph'; content: Inline[] }
  | { type: 'list'; items: Inline[][] }
  | { type: 'table'; head: Inline[][]; rows: Inline[][][] }

export interface ParsedLesson {
  blocks: LessonBlock[]
  /** What is outside the subset. Empty when the text is valid. */
  problems: string[]
}

type Mark = 'bold' | 'sv'
const MARKER: Record<Mark, string> = { bold: '**', sv: '*' }

/** Splits one line of text into plain text, bold and Swedish. */
function parseInline(source: string, problems: string[]): Inline[] {
  const root: Inline[] = []
  const open: { mark: Mark; children: Inline[] }[] = []
  const current = () => open.at(-1)?.children ?? root

  for (const part of source.split(/(\*\*|\*)/)) {
    if (part !== '*' && part !== '**') {
      if (part) current().push(part)
      continue
    }
    const mark: Mark = part === '**' ? 'bold' : 'sv'
    if (open.at(-1)?.mark === mark) {
      const { children } = open.pop()!
      current().push(mark === 'bold' ? { bold: children } : { sv: children })
    } else if (open.some((o) => o.mark === mark)) {
      problems.push(`"${source}": ${part} closes across another mark`)
      return [source]
    } else open.push({ mark, children: [] })
  }
  if (open.length) {
    problems.push(`"${source}": ${MARKER[open.at(-1)!.mark]} is never closed`)
    return [source]
  }
  return root
}

const isDivider = (line: string) => /^\|(\s*:?-{3,}:?\s*\|)+$/.test(line)

/** The cells of one table line, `| a | b |`. */
const cells = (line: string) =>
  line
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())

function parseBlock(lines: string[], problems: string[]): LessonBlock | null {
  const first = lines[0]!
  const inline = (s: string) => parseInline(s, problems)

  if (first.startsWith('#')) {
    if (lines.length > 1 || !first.startsWith('## ')) {
      problems.push(`"${first}": a heading is one line starting with "## "`)
      return null
    }
    return { type: 'heading', content: inline(first.slice(3).trim()) }
  }
  if (first.startsWith('- ')) {
    if (!lines.every((l) => l.startsWith('- '))) {
      problems.push(`"${first}": every line of a list starts with "- "`)
      return null
    }
    return { type: 'list', items: lines.map((l) => inline(l.slice(2).trim())) }
  }
  if (first.startsWith('|')) {
    const [head, divider, ...rows] = lines
    if (
      !divider ||
      !isDivider(divider) ||
      !lines.every((l) => l.startsWith('|'))
    ) {
      problems.push(
        `"${first}": a table is lines starting with "|", the second being "| --- |"`,
      )
      return null
    }
    const width = cells(head!).length
    if (
      cells(divider).length !== width ||
      rows.some((r) => cells(r).length !== width)
    ) {
      problems.push(`"${first}": every row of a table has ${width} cells`)
      return null
    }
    return {
      type: 'table',
      head: cells(head!).map(inline),
      rows: rows.map((r) => cells(r).map(inline)),
    }
  }
  const other = lines.find((l) => /^(#|- |\|)/.test(l))
  if (other) {
    problems.push(
      `"${other}": leave a blank line before a heading, list or table`,
    )
    return null
  }
  return { type: 'paragraph', content: inline(lines.join(' ')) }
}

export function parseLesson(source: string): ParsedLesson {
  const problems: string[] = []
  const blocks: LessonBlock[] = []
  for (const chunk of source.trim().split(/\n\s*\n/)) {
    const lines = chunk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (!lines.length) continue
    // A block outside the subset is kept as plain text, so nothing goes missing.
    blocks.push(
      parseBlock(lines, problems) ?? {
        type: 'paragraph',
        content: [lines.join(' ')],
      },
    )
  }
  return { blocks, problems }
}
