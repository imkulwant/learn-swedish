import { useId, useState } from 'react'
import { isLocalDate } from '../../domain/dates'
import type { LocalDate } from '../../domain/types'

/** A date is taken only once it is whole and in this century. */
const usable = (value: string): value is LocalDate =>
  isLocalDate(value) && value >= '2000-01-01'

/**
 * The test day, or nothing when the learner does not know it yet. The typed
 * text is kept while it is being entered, because a desktop browser reports
 * half-typed years such as 0002 along the way.
 */
export function ExamDateField({
  value,
  onChange,
}: {
  value: LocalDate | null
  onChange: (date: LocalDate | null) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-semibold">
        Test date <span className="font-normal text-muted">(optional)</span>
      </label>
      <input
        id={id}
        type="date"
        value={draft ?? value ?? ''}
        onChange={(e) => {
          const text = e.target.value
          if (text === '') {
            setDraft(null)
            onChange(null)
          } else if (usable(text)) {
            setDraft(null)
            onChange(text)
          } else setDraft(text)
        }}
        className="tap-target rounded-control border border-border bg-surface px-3 text-text"
      />
      <p className="text-sm text-muted">
        Your school or kommun tells you the date. You can add or change it later
        in Settings.
      </p>
    </div>
  )
}
