import type { WritingPrompt } from '../../domain/content/schema'

/** A text that passes, with notes on why its phrases work. */
export function ModelAnswer({ model }: { model: WritingPrompt['model'] }) {
  return (
    <section aria-labelledby="model-answer" className="flex flex-col gap-3">
      <h2 id="model-answer" className="text-lg font-semibold">
        Model answer
      </h2>
      <p className="text-sm text-muted">
        A text that would pass at this level. It is not perfect, and yours does
        not need to look like it.
      </p>
      <div
        lang="sv"
        className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
      >
        {model.lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
      <h3 className="font-semibold">Why it works</h3>
      <dl className="flex flex-col gap-3">
        {model.notes.map((n, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <dt lang="sv" className="font-semibold italic">
              {n.quote}
            </dt>
            <dd className="text-muted">{n.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
