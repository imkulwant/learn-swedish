import { useMemo } from 'react'
import {
  parseLesson,
  type Inline,
  type LessonBlock,
} from '../../../domain/lessonText'

function Text({ content }: { content: Inline[] }) {
  return content.map((part, i) =>
    typeof part === 'string' ? (
      part
    ) : 'bold' in part ? (
      <strong key={i}>
        <Text content={part.bold} />
      </strong>
    ) : (
      <i key={i} lang="sv">
        <Text content={part.sv} />
      </i>
    ),
  )
}

function Block({ block }: { block: LessonBlock }) {
  switch (block.type) {
    case 'heading':
      return (
        <h2 className="text-lg font-semibold">
          <Text content={block.content} />
        </h2>
      )
    case 'paragraph':
      return (
        <p>
          <Text content={block.content} />
        </p>
      )
    case 'list':
      return (
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {block.items.map((item, i) => (
            <li key={i}>
              <Text content={item} />
            </li>
          ))}
        </ul>
      )
    case 'table':
      return (
        // Wide tables scroll inside their box, never the page.
        <div className="overflow-x-auto rounded-control border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-2">
              <tr>
                {block.head.map((cell, i) => (
                  <th key={i} scope="col" className="px-3 py-2 font-semibold">
                    <Text content={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r} className="border-t border-border">
                  {row.map((cell, c) => (
                    <td key={c} className="px-3 py-2">
                      <Text content={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

/**
 * A lesson's explanation. The build has already refused text outside the
 * subset, so anything it cannot read is shown as plain text, not dropped.
 */
export function LessonBody({ body }: { body: string }) {
  const { blocks } = useMemo(() => parseLesson(body), [body])
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  )
}
