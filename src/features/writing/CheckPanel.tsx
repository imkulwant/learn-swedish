import { useState } from 'react'
import {
  checkWriting,
  type WritingCheck,
  type WritingTask,
} from '../../domain/writingChecks'
import { Button } from '../../ui/Button'

/**
 * Hints about the text as it was when the learner asked. They are patterns,
 * not a teacher, so they say "check this" and never "wrong".
 */
export function CheckPanel({
  text,
  task,
}: {
  text: string
  task: WritingTask
}) {
  const [checks, setChecks] = useState<WritingCheck[] | null>(null)
  const toLook = checks?.filter((c) => c.status === 'check').length ?? 0

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        disabled={!text.trim()}
        onClick={() => setChecks(checkWriting(text, task))}
      >
        {checks ? 'Check again' : 'Check my text'}
      </Button>
      {checks && (
        <section
          aria-label="Check this"
          className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
        >
          <h2 className="font-semibold">
            {toLook
              ? `${toLook} thing${toLook === 1 ? '' : 's'} to look at`
              : 'Nothing to look at'}
          </h2>
          <p className="text-sm text-muted">
            These hints look for patterns. They can miss a mistake or point at a
            right sentence.
          </p>
          <ul className="flex flex-col gap-3">
            {checks.map((c) => (
              <li key={c.id} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className={c.status === 'ok' ? 'text-accent' : 'text-warning'}
                >
                  {c.status === 'ok' ? '✓' : '!'}
                </span>
                <div className="flex flex-col gap-0.5">
                  <p className="font-semibold">
                    <span className="sr-only">
                      {c.status === 'ok' ? 'Fine: ' : 'Check this: '}
                    </span>
                    {c.title}
                  </p>
                  <p className="text-sm text-muted">{c.detail}</p>
                  {c.status === 'check' && c.quotes && c.quotes.length > 0 && (
                    <ul lang="sv" className="text-sm italic">
                      {c.quotes.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
