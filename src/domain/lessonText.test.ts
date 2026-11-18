import { describe, expect, it } from 'vitest'
import { parseLesson } from './lessonText.ts'

describe('parseLesson', () => {
  it('reads headings, paragraphs, lists and tables', () => {
    const { blocks, problems } = parseLesson(`
## Rule

In a main clause the verb comes
second: *Idag **har** jag tid.*

- *Jag **har** tid idag.*
- *Idag **har** jag tid.*

| Fundament | Verb | Subject |
| --- | --- | --- |
| *Idag* | *har* | *jag* |
`)
    expect(problems).toEqual([])
    expect(blocks).toEqual([
      { type: 'heading', content: ['Rule'] },
      {
        type: 'paragraph',
        content: [
          'In a main clause the verb comes second: ',
          { sv: ['Idag ', { bold: ['har'] }, ' jag tid.'] },
        ],
      },
      {
        type: 'list',
        items: [
          [{ sv: ['Jag ', { bold: ['har'] }, ' tid idag.'] }],
          [{ sv: ['Idag ', { bold: ['har'] }, ' jag tid.'] }],
        ],
      },
      {
        type: 'table',
        head: [['Fundament'], ['Verb'], ['Subject']],
        rows: [[[{ sv: ['Idag'] }], [{ sv: ['har'] }], [{ sv: ['jag'] }]]],
      },
    ])
  })

  it('allows Swedish inside bold', () => {
    expect(parseLesson('**Remember *inte*!**').blocks).toEqual([
      {
        type: 'paragraph',
        content: [{ bold: ['Remember ', { sv: ['inte'] }, '!'] }],
      },
    ])
  })

  it.each([
    ['*Idag har jag tid.', '* is never closed'],
    ['**bold *sv** text*', '** closes across another mark'],
    ['# Big heading', 'a heading is one line starting with "## "'],
    ['- one\ntwo', 'every line of a list starts with "- "'],
    ['| a | b |\n| a | b |', 'the second being "| --- |"'],
    ['| a | b |\n| --- | --- |\n| 1 |', 'every row of a table has 2 cells'],
    [
      'Some text\n- a list',
      'leave a blank line before a heading, list or table',
    ],
  ])('refuses %j', (source, problem) => {
    const { problems } = parseLesson(source)
    expect(problems).toHaveLength(1)
    expect(problems[0]).toContain(problem)
  })

  it('keeps the text of a line with a broken mark, so nothing goes missing', () => {
    expect(parseLesson('*oops').blocks).toEqual([
      { type: 'paragraph', content: ['*oops'] },
    ])
    expect(parseLesson('# Big\n\n- a\nb').blocks).toEqual([
      { type: 'paragraph', content: ['# Big'] },
      { type: 'paragraph', content: ['- a b'] },
    ])
  })
})
