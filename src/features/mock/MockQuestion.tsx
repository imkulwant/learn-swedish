import { useEffect, useId, useRef, useState } from 'react'
import type { Item } from '../../domain/content/schema'
import type { MockResponse } from '../../domain/mock'

/**
 * One question as on the test: the learner answers and may change the answer
 * until the part ends. Nothing says whether it is right.
 */
export function MockQuestion({
  item,
  value,
  onChange,
  disabled,
}: {
  item: Item
  value: MockResponse | undefined
  onChange: (value: MockResponse) => void
  disabled: boolean
}) {
  const baseId = useId()
  // The choice shows at once; the stored answer follows.
  const [local, setLocal] = useState(value)
  const choose = (next: MockResponse) => {
    setLocal(next)
    onChange(next)
  }

  if (item.type === 'mc')
    return (
      <fieldset className="flex flex-col gap-2">
        <legend lang="sv" className="mb-2 font-semibold">
          {item.prompt}
        </legend>
        {item.options.map((option, i) => (
          <label
            key={i}
            className={`tap-target flex items-center gap-3 rounded-control border bg-surface px-3 py-2 ${
              local === i ? 'border-accent-fg' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name={baseId}
              checked={local === i}
              disabled={disabled}
              onChange={() => choose(i)}
              className="size-5 accent-[var(--color-accent-fg)]"
            />
            <span lang="sv">{option}</span>
          </label>
        ))}
      </fieldset>
    )

  if (item.type === 'match') {
    const choices = Array.isArray(local) ? local : item.pairs.map(() => null)
    const numbered = item.options.some((o) => o.length > 24)
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
        {item.pairs.map((pair, p) => (
          <div key={p} className="flex flex-col gap-1">
            <label htmlFor={`${baseId}-${p}`} lang="sv">
              {pair.q}
            </label>
            <select
              id={`${baseId}-${p}`}
              lang="sv"
              disabled={disabled}
              value={choices[p] ?? ''}
              onChange={(e) =>
                choose(
                  choices.map((c, i) =>
                    i === p
                      ? e.target.value === ''
                        ? null
                        : Number(e.target.value)
                      : c,
                  ),
                )
              }
              className="tap-target rounded-control border border-border bg-surface px-3 text-text"
            >
              <option value="">Choose…</option>
              {item.options.map((o, i) => (
                <option key={i} value={i}>
                  {numbered ? `${i + 1}. ${o}` : o}
                </option>
              ))}
            </select>
          </div>
        ))}
      </fieldset>
    )
  }

  return (
    <ShortAnswer
      prompt={item.prompt}
      value={typeof value === 'string' ? value : ''}
      onChange={onChange}
      disabled={disabled}
    />
  )
}

/** An open answer, stored shortly after typing pauses and when left. */
function ShortAnswer({
  prompt,
  value,
  onChange,
  disabled,
}: {
  prompt: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
}) {
  const id = useId()
  const [text, setText] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(text)
  const stored = useRef(value)
  const save = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (latest.current === stored.current) return
    stored.current = latest.current
    onChange(latest.current)
  }
  // Leaving the part, or iOS hiding the app, stores what is typed.
  useEffect(() => {
    const onHide = () => document.visibilityState === 'hidden' && save()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', save)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', save)
      save()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} lang="sv" className="font-semibold">
        {prompt}
      </label>
      <input
        id={id}
        lang="sv"
        value={text}
        disabled={disabled}
        maxLength={2000}
        onChange={(e) => {
          setText(e.target.value)
          latest.current = e.target.value
          if (timer.current) clearTimeout(timer.current)
          timer.current = setTimeout(save, 400)
        }}
        onBlur={save}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="tap-target rounded-control border border-border bg-surface px-3 text-text"
      />
    </div>
  )
}
