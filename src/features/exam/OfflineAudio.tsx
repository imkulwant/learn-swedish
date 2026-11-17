import { useEffect, useState } from 'react'
import { appUrl } from '../../data/content'
import type { PackSummary } from '../../domain/content/schema'
import { formatBytes } from '../../domain/format'
import { countCached, storeAll } from '../../platform/audioCache'
import { Button } from '../../ui/Button'

type Count = { key: string; count: number | 'unsupported' }

/** Shows whether a level's audio is stored for offline use, and stores it. */
export function OfflineAudio({ packs }: { packs: PackSummary[] }) {
  const urls = packs.flatMap((p) => p.audio?.files ?? []).map(appUrl)
  const bytes = packs.reduce((n, p) => n + (p.audio?.bytes ?? 0), 0)
  const key = urls.join('|')
  const [cached, setCached] = useState<Count | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function recount(): Promise<Count> {
    try {
      return { key, count: await countCached(urls) }
    } catch {
      return { key, count: 'unsupported' }
    }
  }

  useEffect(() => {
    let cancelled = false
    void recount().then((result) => {
      if (!cancelled) setCached(result)
    })
    return () => {
      cancelled = true
    }
    // `urls` is rebuilt every render; `key` holds the same list as text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!urls.length) return null
  const count = cached?.key === key ? cached.count : null

  async function download() {
    setBusy(true)
    setMessage(null)
    try {
      const { failed, full } = await storeAll(urls)
      if (full)
        setMessage(
          'This device is out of space. Free some space and try again.',
        )
      else if (failed)
        setMessage(
          `${failed} ${failed === 1 ? 'clip' : 'clips'} could not be downloaded. Check the connection and try again.`,
        )
    } catch {
      setMessage('The audio could not be stored on this device.')
    } finally {
      setCached(await recount())
      setBusy(false)
    }
  }

  return (
    <section
      aria-label="Offline audio"
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
    >
      <h2 className="font-semibold">Offline audio</h2>
      <p className="text-sm text-muted">
        {count === null
          ? 'Checking…'
          : count === 'unsupported'
            ? 'This browser cannot store audio, so listening needs an internet connection.'
            : count === urls.length
              ? `All ${urls.length} clips are on this device and play without internet.`
              : `${count} of ${urls.length} clips are on this device. Download all (${formatBytes(bytes)}) to listen without internet.`}
      </p>
      {typeof count === 'number' && count < urls.length && (
        <Button disabled={busy} onClick={() => void download()}>
          {busy ? 'Downloading…' : 'Download audio'}
        </Button>
      )}
      {message && (
        <p role="alert" className="text-danger">
          {message}
        </p>
      )}
    </section>
  )
}
