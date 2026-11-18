import { useEffect, useId, useRef, useState } from 'react'
import {
  createWriting,
  saveWritingText,
  submitWriting,
  type WritingSource,
} from '../../data/repositories/writings'
import type { Writing } from '../../domain/types'
import { countWords, type WritingTask } from '../../domain/writingChecks'
import { dataMarker } from '../../platform/dataMarker'
import { reportStorageFailure } from '../../platform/storageFailure'
import { Button } from '../../ui/Button'
import { Dialog } from '../../ui/Dialog'
import { CheckPanel } from './CheckPanel'

/** How long typing pauses before the text is stored. */
const SAVE_AFTER_MS = 400

type SaveState = 'saved' | 'unsaved' | 'failed'

/**
 * The text of one draft. It is stored shortly after each pause in typing, and
 * at once when the app is hidden or the screen left, so a force-quit loses at
 * most the last moment of typing. The first stored text creates the draft.
 */
export function Editor({
  source,
  draft,
  task,
}: {
  source: WritingSource
  /** The stored draft to continue, or null for a new text. */
  draft: Writing | null
  task: WritingTask
}) {
  const fieldId = useId()
  const countId = useId()
  const [text, setText] = useState(draft?.text ?? '')
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [hasDraft, setHasDraft] = useState(draft !== null)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitFailed, setSubmitFailed] = useState(false)

  // Saves run one after another, so two can never create two drafts.
  const id = useRef<string | null>(draft?.id ?? null)
  const latest = useRef(text)
  const stored = useRef(text)
  const queue = useRef<Promise<void>>(Promise.resolve())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function flush(): Promise<void> {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    queue.current = queue.current.then(async () => {
      const value = latest.current
      if (value === stored.current) return
      try {
        if (id.current) await saveWritingText(id.current, value)
        else {
          if (!value.trim()) return
          id.current = (await createWriting(source, value)).id
          dataMarker.mark()
          setHasDraft(true)
        }
        stored.current = value
        if (latest.current === value) setSaveState('saved')
      } catch (error) {
        reportStorageFailure(error)
        setSaveState('failed')
      }
    })
    return queue.current
  }

  // Leaving the screen, or iOS hiding the app, stores what is typed.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    const onPageHide = () => void flush()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onPageHide)
      void flush()
    }
    // flush reads refs only, so the first one stays correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function change(value: string) {
    setText(value)
    latest.current = value
    setSaveState('unsaved')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void flush(), SAVE_AFTER_MS)
  }

  async function handIn() {
    setSubmitting(true)
    setSubmitFailed(false)
    try {
      await flush()
      if (!id.current) throw new Error('Nothing is stored yet.')
      await submitWriting(id.current, latest.current)
      // The screen moves on once the stored text says it is handed in.
    } catch (error) {
      reportStorageFailure(error)
      setSubmitFailed(true)
      setConfirming(false)
    } finally {
      setSubmitting(false)
    }
  }

  const words = countWords(text)
  return (
    <section className="flex flex-col gap-3">
      <label htmlFor={fieldId} className="font-semibold">
        Your text
      </label>
      <textarea
        id={fieldId}
        lang="sv"
        value={text}
        onChange={(e) => change(e.target.value)}
        onBlur={() => void flush()}
        aria-describedby={countId}
        rows={12}
        autoCapitalize="sentences"
        spellCheck={false}
        className="min-h-64 rounded-control border border-border bg-surface p-3 text-text"
      />
      <p id={countId} className="flex justify-between text-sm text-muted">
        <span>
          {words} words · aim for {task.words.min}–{task.words.max}
        </span>
        <span role="status">
          {saveState === 'failed' ? (
            <span className="text-danger">Not saved</span>
          ) : saveState === 'unsaved' ? (
            'Saving…'
          ) : hasDraft ? (
            'Saved'
          ) : null}
        </span>
      </p>
      {saveState === 'failed' && (
        <p role="alert" className="text-danger">
          Your text could not be saved. Keep this screen open and try typing
          again.
        </p>
      )}
      <CheckPanel text={text} task={task} />
      {submitFailed && (
        <p role="alert" className="text-danger">
          Your text could not be handed in. Try again.
        </p>
      )}
      <Button disabled={words === 0} onClick={() => setConfirming(true)}>
        Hand in
      </Button>
      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Hand in your text?"
      >
        <p className="text-muted">
          You cannot change it afterwards. You will see a model answer and
          assess your text against the test's criteria.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            disabled={submitting}
            onClick={() => void handIn()}
          >
            Hand in
          </Button>
          <Button
            className="flex-1"
            variant="secondary"
            onClick={() => setConfirming(false)}
          >
            Keep writing
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
