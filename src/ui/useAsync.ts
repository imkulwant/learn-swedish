import { useEffect, useState } from 'react'

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string }

type Settled<T> =
  | { key: string; status: 'ready'; value: T }
  | { key: string; status: 'error'; message: string }

/**
 * Runs `load` when `key` changes and tracks its result. A result for an older
 * key reads as loading, so a screen never shows the previous pack's data.
 */
export function useAsync<T>(
  load: () => Promise<T>,
  key: string,
): AsyncState<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null)

  useEffect(() => {
    let cancelled = false
    load().then(
      (value) => !cancelled && setSettled({ key, status: 'ready', value }),
      (error: unknown) =>
        !cancelled &&
        setSettled({
          key,
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        }),
    )
    return () => {
      cancelled = true
    }
    // `load` is recreated on every render; `key` says when it really changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!settled || settled.key !== key) return { status: 'loading' }
  return settled
}
