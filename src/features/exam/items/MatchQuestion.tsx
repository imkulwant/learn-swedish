import { useId, useState } from 'react'
import { scoreMatch } from '../../../domain/answerCheck'
import type { MatchItem } from '../../../domain/content/schema'
import { Button } from '../../../ui/Button'
import { Feedback } from './Feedback'
import type { OnAnswered } from './types'
import { SaveFailed, useSave } from './useSave'

/** Pairs each question or statement with one option, through a native picker. */
export function MatchQuestion({
  item,
  onAnswered,
}: {
  item: MatchItem
  onAnswered: OnAnswered
}) {
  const baseId = useId()
  const [choices, setChoices] = useState<(number | null)[]>(
    item.pairs.map(() => null),
  )
  const [checked, setChecked] = useState(false)
  const { save, saving, failed } = useSave(onAnswered)
  // Long options are numbered and listed once; short ones (names) need no list.
  const numbered = item.options.some((o) => o.length > 24)
  const label = (i: number) => (numbered ? `${i + 1}` : item.options[i])
  // The picker also carries the option text, so a screen reader hears more
  // than a number.
  const optionText = (i: number) =>
    numbered ? `${i + 1}. ${item.options[i]}` : item.options[i]

  async function check() {
    const answer = {
      ...scoreMatch(item, choices),
      selfMarked: false,
      response: choices,
    }
    if (await save(answer)) setChecked(true)
  }

  const points = scoreMatch(item, choices)
  return (
    <fieldset className="flex flex-col gap-3">
      <legend lang="sv" className="mb-2 font-semibold">
        {item.prompt}
      </legend>
      {numbered && (
        <ol
          lang="sv"
          className="flex flex-col gap-1 rounded-control bg-surface p-3 text-sm"
        >
          {item.options.map((o, i) => (
            <li key={i}>
              <span className="font-semibold">{i + 1}.</span> {o}
            </li>
          ))}
        </ol>
      )}
      {item.pairs.map((pair, p) => {
        const id = `${baseId}-${p}`
        const right = choices[p] === pair.answer
        return (
          <div key={p} className="flex flex-col gap-1">
            <label htmlFor={id} lang="sv">
              {pair.q}
            </label>
            <select
              id={id}
              lang="sv"
              disabled={checked}
              value={choices[p] ?? ''}
              onChange={(e) =>
                setChoices((all) =>
                  all.map((c, i) =>
                    i === p
                      ? e.target.value === ''
                        ? null
                        : Number(e.target.value)
                      : c,
                  ),
                )
              }
              className={`tap-target rounded-control border bg-surface px-3 text-text ${
                checked
                  ? right
                    ? 'border-accent-fg'
                    : 'border-danger'
                  : 'border-border'
              }`}
            >
              <option value="">Choose…</option>
              {item.options.map((_, i) => (
                <option key={i} value={i}>
                  {optionText(i)}
                </option>
              ))}
            </select>
            {checked && !right && (
              <p className="text-sm text-danger">
                Right answer: {label(pair.answer)}
              </p>
            )}
          </div>
        )
      })}
      {checked ? (
        <Feedback
          right={points.score === points.maxScore}
          title={`${points.score} of ${points.maxScore} right`}
        >
          <p>{item.explain}</p>
        </Feedback>
      ) : (
        <>
          {failed && <SaveFailed />}
          <Button
            disabled={saving || choices.some((c) => c === null)}
            onClick={() => void check()}
          >
            Check
          </Button>
        </>
      )}
    </fieldset>
  )
}
