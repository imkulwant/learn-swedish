import type { ReadingText } from '../../domain/content/schema'

/** One reading text as on the test sheet: the instruction, then the text. */
export function ReadingTextView({ text }: { text: ReadingText }) {
  return (
    <article lang="sv" className="flex flex-col gap-3">
      {text.status === 'draft' && (
        <p
          lang="en"
          className="self-start rounded-full border border-warning px-3 py-0.5 text-xs text-warning"
        >
          Draft – not yet checked by a reviewer
        </p>
      )}
      <p className="italic text-muted">{text.instruction}</p>
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
        <h2 className="text-lg font-bold">{text.title}</h2>
        {text.blocks.map((block, i) => (
          <section key={i} className="flex flex-col gap-1">
            {block.heading && (
              <h3 className="font-semibold">{block.heading}</h3>
            )}
            {block.author && (
              <p className="text-sm font-semibold text-accent-fg">
                {block.author}
              </p>
            )}
            {block.lines.map((line, j) => (
              <p key={j}>{line}</p>
            ))}
          </section>
        ))}
      </div>
    </article>
  )
}
