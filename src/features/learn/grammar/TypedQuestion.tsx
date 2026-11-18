import { useId, useState } from 'react'
import {
  GAP,
  type GapItem,
  type TransformItem,
} from '../../../domain/content/schema'
import { scoreTyped } from '../../../domain/grammar'
import { Button } from '../../../ui/Button'
import { Feedback } from '../../exam/items/Feedback'
import type { OnAnswered } from '../../exam/items/types'
import { SaveFailed, useSave } from '../../exam/items/useSave'

/**
 * A typed form (gap) or sentence (transform). It is right only when it is one
 * of the accepted answers; there is no self-marking for grammar.
 */
export function TypedQuestion({
  item,
  onAnswered,
}: {
  item: GapItem | TransformItem
  onAnswered: OnAnswered
}) {
  const promptId = useId()
  const inputId = useId()
  const [text, setText] = useState('')
  const [checked, setChecked] = useState(false)
  const { save, saving, failed } = useSave(onAnswered)
  const right = scoreTyped(item.accept, text).score === 1

  async function check() {
    const answer = {
      ...scoreTyped(item.accept, text),
      selfMarked: false,
      response: text,
    }
    if (await save(answer)) setChecked(true)
  }

  const input = (
    <input
      id={inputId}
      lang="sv"
      aria-labelledby={promptId}
      aria-describedby={item.type === 'gap' ? `${inputId}-sentence` : undefined}
      value={text}
      disabled={checked}
      onChange={(e) => setText(e.target.value)}
      onKeyDown={(e) =>
        e.key === 'Enter' && text.trim() && !saving && void check()
      }
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      enterKeyHint="done"
      className={`tap-target rounded-control border bg-surface px-3 text-text ${
        item.type === 'gap' ? 'w-36' : 'w-full'
      } ${checked ? (right ? 'border-accent' : 'border-danger') : 'border-border'}`}
    />
  )
  const [before, after] =
    item.type === 'gap' ? item.sentence.split(GAP) : ['', '']
  const answer =
    item.type === 'gap'
      ? item.sentence.replace(GAP, item.accept[0]!)
      : item.accept[0]!

  return (
    <div
      role="group"
      aria-labelledby={promptId}
      className="flex flex-col gap-2"
    >
      <p id={promptId} lang="sv" className="font-semibold">
        {item.prompt}
        {item.type === 'gap' && item.hint && (
          <span className="font-normal text-muted"> ({item.hint})</span>
        )}
      </p>
      {item.type === 'gap' ? (
        <p
          id={`${inputId}-sentence`}
          lang="sv"
          className="flex flex-wrap items-center gap-x-1 gap-y-2"
        >
          <span>{before}</span>
          {input}
          <span>{after}</span>
        </p>
      ) : (
        <>
          <p lang="sv" className="rounded-control bg-surface p-3">
            {item.from}
          </p>
          {input}
        </>
      )}
      {checked ? (
        <Feedback
          right={right}
          title={right ? 'Right' : `Not quite. The answer is: ${answer}`}
        >
          <p>{item.explain}</p>
        </Feedback>
      ) : (
        <>
          {failed && <SaveFailed />}
          <Button
            disabled={!text.trim() || saving}
            onClick={() => void check()}
          >
            Check
          </Button>
        </>
      )}
    </div>
  )
}
