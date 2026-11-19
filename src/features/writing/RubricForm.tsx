import { useState } from 'react'
import { reportStorageFailure } from '../../platform/storageFailure'
import { Button } from '../../ui/Button'

type Score = 0 | 1 | 2

const SCORES: { value: Score; label: string }[] = [
  { value: 0, label: 'Not yet' },
  { value: 1, label: 'Partly' },
  { value: 2, label: 'Yes' },
]

export interface Criterion {
  id: string
  name: string
  question: string
}

/**
 * The learner compares their answer with the model and scores each
 * criterion 0–2. Used for writing and speaking.
 */
export function RubricForm<C extends readonly Criterion[]>({
  criteria,
  intro,
  onSave,
}: {
  criteria: C
  intro: string
  onSave: (scores: Record<C[number]['id'], Score>) => Promise<void>
}) {
  const [scores, setScores] = useState<Partial<Record<string, Score>>>({})
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const complete = criteria.every((c) => scores[c.id] !== undefined)

  async function save() {
    setSaving(true)
    setFailed(false)
    try {
      await onSave(scores as Record<C[number]['id'], Score>)
    } catch (error) {
      reportStorageFailure(error)
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="assess" className="flex flex-col gap-4">
      <h2 id="assess" className="text-lg font-semibold">
        Assess your answer
      </h2>
      <p className="text-sm text-muted">{intro}</p>
      {criteria.map((c) => (
        <fieldset key={c.id} className="flex flex-col gap-2">
          <legend className="mb-1">
            <span className="font-semibold">{c.name}.</span> {c.question}
          </legend>
          <div className="flex gap-2">
            {SCORES.map((s) => (
              <label
                key={s.value}
                className={`tap-target flex flex-1 items-center justify-center gap-2 rounded-control border px-2 ${
                  scores[c.id] === s.value
                    ? 'border-accent-fg bg-surface-2'
                    : 'border-border bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name={c.id}
                  checked={scores[c.id] === s.value}
                  onChange={() =>
                    setScores((all) => ({ ...all, [c.id]: s.value }))
                  }
                  className="size-4 accent-[var(--color-accent-fg)]"
                />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {failed && (
        <p role="alert" className="text-danger">
          Your assessment could not be saved. Try again.
        </p>
      )}
      <Button disabled={!complete || saving} onClick={() => void save()}>
        Save assessment
      </Button>
    </section>
  )
}
