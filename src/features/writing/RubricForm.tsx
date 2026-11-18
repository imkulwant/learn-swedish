import { useState } from 'react'
import { assessWriting } from '../../data/repositories/writings'
import {
  RUBRIC,
  type CriterionId,
  type Rubric,
  type RubricScore,
} from '../../domain/writing'
import { reportStorageFailure } from '../../platform/storageFailure'
import { Button } from '../../ui/Button'

const SCORES: { value: RubricScore; label: string }[] = [
  { value: 0, label: 'Not yet' },
  { value: 1, label: 'Partly' },
  { value: 2, label: 'Yes' },
]

/** The learner compares their text with the model and scores each criterion. */
export function RubricForm({ writingId }: { writingId: string }) {
  const [scores, setScores] = useState<Partial<Rubric>>({})
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const complete = RUBRIC.every((c) => scores[c.id] !== undefined)

  async function save() {
    setSaving(true)
    setFailed(false)
    try {
      await assessWriting(writingId, scores as Rubric)
    } catch (error) {
      reportStorageFailure(error)
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const choose = (id: CriterionId, value: RubricScore) =>
    setScores((s) => ({ ...s, [id]: value }))

  return (
    <section aria-labelledby="assess" className="flex flex-col gap-4">
      <h2 id="assess" className="text-lg font-semibold">
        Assess your text
      </h2>
      <p className="text-sm text-muted">
        Compare your text with the model answer. Be strict: the test is. Your
        answers make up your Skriva readiness.
      </p>
      {RUBRIC.map((c) => (
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
                    ? 'border-accent bg-surface-2'
                    : 'border-border bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name={c.id}
                  checked={scores[c.id] === s.value}
                  onChange={() => choose(c.id, s.value)}
                  className="size-4 accent-[var(--color-accent)]"
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
