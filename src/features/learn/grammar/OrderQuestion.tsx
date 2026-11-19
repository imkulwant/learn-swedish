import { useId, useMemo, useState } from 'react'
import type { OrderItem } from '../../../domain/content/schema'
import {
  orderSentence,
  scoreOrder,
  shuffledChunks,
} from '../../../domain/grammar'
import { Button } from '../../../ui/Button'
import { Feedback } from '../../exam/items/Feedback'
import type { OnAnswered } from '../../exam/items/types'
import { SaveFailed, useSave } from '../../exam/items/useSave'

const chunkClass =
  'tap-target rounded-control border px-3 py-1 font-semibold transition-colors motion-reduce:transition-none'

/**
 * Builds a sentence from shuffled chunks. Tapping a chunk moves it into the
 * sentence; tapping it there moves it back.
 */
export function OrderQuestion({
  item,
  onAnswered,
}: {
  item: OrderItem
  onAnswered: OnAnswered
}) {
  const sentenceId = useId()
  const shown = useMemo(
    () => shuffledChunks(item) ?? item.chunks.map((_, i) => i),
    [item],
  )
  const [picked, setPicked] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  const { save, saving, failed } = useSave(onAnswered)
  const left = shown.filter((i) => !picked.includes(i))
  const right = scoreOrder(item, picked).score === 1

  async function check() {
    const answer = {
      ...scoreOrder(item, picked),
      selfMarked: false,
      response: orderSentence(item, picked),
    }
    if (await save(answer)) setChecked(true)
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend lang="sv" className="mb-2 font-semibold">
        {item.prompt}
      </legend>
      <p id={sentenceId} className="text-sm text-muted">
        Your sentence
      </p>
      <div
        role="group"
        aria-labelledby={sentenceId}
        lang="sv"
        className={`flex min-h-14 flex-wrap items-center gap-2 rounded-control border border-dashed p-2 ${
          checked
            ? right
              ? 'border-accent-fg'
              : 'border-danger'
            : 'border-border'
        }`}
      >
        {picked.map((i) => (
          <button
            key={i}
            type="button"
            disabled={checked}
            aria-label={`Remove ${item.chunks[i]}`}
            onClick={() => setPicked((p) => p.filter((c) => c !== i))}
            className={`${chunkClass} border-accent-fg bg-surface-2 text-text`}
          >
            {item.chunks[i]}
          </button>
        ))}
        {picked.length > 0 && <span aria-hidden="true">{item.end}</span>}
      </div>
      {!checked && (
        <div
          role="group"
          aria-label="Words to place"
          lang="sv"
          className="flex flex-wrap gap-2"
        >
          {left.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPicked((p) => [...p, i])}
              className={`${chunkClass} border-border bg-surface text-text active:bg-surface-2`}
            >
              {item.chunks[i]}
            </button>
          ))}
        </div>
      )}
      {checked ? (
        <Feedback
          right={right}
          title={
            right
              ? 'Right'
              : `Not quite. The answer is: ${item.chunks.join(' ')}${item.end}`
          }
        >
          <p>{item.explain}</p>
        </Feedback>
      ) : (
        <>
          {failed && <SaveFailed />}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={left.length > 0 || saving}
              onClick={() => void check()}
            >
              Check
            </Button>
            <Button
              variant="secondary"
              disabled={picked.length === 0 || saving}
              onClick={() => setPicked([])}
            >
              Start over
            </Button>
          </div>
        </>
      )}
    </fieldset>
  )
}
