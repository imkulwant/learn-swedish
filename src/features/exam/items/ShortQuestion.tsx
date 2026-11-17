import { useId, useState } from 'react'
import { gradeShort } from '../../../domain/answerCheck'
import type { ShortItem } from '../../../domain/content/schema'
import { Button } from '../../../ui/Button'
import { Feedback } from './Feedback'
import type { Answered, OnAnswered } from './types'
import { SaveFailed, useSave } from './useSave'

type Stage = 'answering' | 'judging' | 'right' | 'wrong'

/**
 * An open answer. A listed answer is marked right at once. Anything else may
 * still be right in other words, so the learner compares it with the model
 * answer and says which it was.
 */
export function ShortQuestion({
  item,
  onAnswered,
}: {
  item: ShortItem
  onAnswered: OnAnswered
}) {
  const inputId = useId()
  const labelId = useId()
  const [text, setText] = useState('')
  const [stage, setStage] = useState<Stage>('answering')
  const { save, saving, failed } = useSave(onAnswered)

  async function finish(answer: Answered) {
    if (await save(answer)) setStage(answer.score ? 'right' : 'wrong')
  }

  function check() {
    if (gradeShort(item, text) === 'correct')
      void finish({ score: 1, maxScore: 1, selfMarked: false, response: text })
    else setStage('judging')
  }

  function judge(right: boolean) {
    void finish({
      score: right ? 1 : 0,
      maxScore: 1,
      selfMarked: true,
      response: text,
    })
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-col gap-2">
      <label id={labelId} htmlFor={inputId} lang="sv" className="font-semibold">
        {item.prompt}
      </label>
      <input
        id={inputId}
        lang="sv"
        value={text}
        disabled={stage !== 'answering'}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) =>
          e.key === 'Enter' && text.trim() && !saving && check()
        }
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        className="tap-target rounded-control border border-border bg-surface px-3 text-text"
      />
      {failed && <SaveFailed />}
      {stage === 'answering' && (
        <Button disabled={!text.trim() || saving} onClick={check}>
          Check
        </Button>
      )}
      {stage === 'judging' && (
        <div className="flex flex-col gap-2 rounded-control border border-border p-3">
          <p>
            Compare with the model answer:{' '}
            <span lang="sv" className="font-semibold">
              {item.model}
            </span>
          </p>
          <p className="text-sm text-muted">Does your answer mean the same?</p>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={saving}
              onClick={() => judge(true)}
            >
              Yes, it does
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              disabled={saving}
              onClick={() => judge(false)}
            >
              No
            </Button>
          </div>
        </div>
      )}
      {(stage === 'right' || stage === 'wrong') && (
        <Feedback
          right={stage === 'right'}
          title={
            stage === 'right'
              ? 'Right'
              : `Not quite. The answer is: ${item.model}`
          }
        >
          <p>{item.explain}</p>
        </Feedback>
      )}
    </div>
  )
}
