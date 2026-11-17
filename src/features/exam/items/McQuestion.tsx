import { useId, useState } from 'react'
import { scoreMc } from '../../../domain/answerCheck'
import type { McItem } from '../../../domain/content/schema'
import { Button } from '../../../ui/Button'
import { Feedback } from './Feedback'
import type { OnAnswered } from './types'
import { SaveFailed, useSave } from './useSave'

export function McQuestion({
  item,
  onAnswered,
}: {
  item: McItem
  onAnswered: OnAnswered
}) {
  const name = useId()
  const [choice, setChoice] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const { save, saving, failed } = useSave(onAnswered)

  async function check() {
    if (choice === null) return
    const answer = {
      ...scoreMc(item, choice),
      selfMarked: false,
      response: choice,
    }
    if (await save(answer)) setChecked(true)
  }

  const right = choice === item.answer
  return (
    <fieldset className="flex flex-col gap-2">
      <legend lang="sv" className="mb-2 font-semibold">
        {item.prompt}
      </legend>
      {item.options.map((option, i) => {
        const mark =
          checked && (i === item.answer ? ' ✓' : i === choice ? ' ✗' : '')
        return (
          <label
            key={i}
            className={`tap-target flex items-center gap-3 rounded-control border px-3 py-2 ${
              checked && i === item.answer
                ? 'border-accent'
                : checked && i === choice
                  ? 'border-danger'
                  : 'border-border'
            } bg-surface`}
          >
            <input
              type="radio"
              name={name}
              checked={choice === i}
              disabled={checked}
              onChange={() => setChoice(i)}
              className="size-5 accent-[var(--color-accent)]"
            />
            <span lang="sv">
              {option}
              {mark}
            </span>
          </label>
        )
      })}
      {checked ? (
        <Feedback
          right={right}
          title={
            right
              ? 'Right'
              : `Not quite. The answer is: ${item.options[item.answer]}`
          }
        >
          <p>{item.explain}</p>
        </Feedback>
      ) : (
        <>
          {failed && <SaveFailed />}
          <Button
            disabled={choice === null || saving}
            onClick={() => void check()}
          >
            Check
          </Button>
        </>
      )}
    </fieldset>
  )
}
