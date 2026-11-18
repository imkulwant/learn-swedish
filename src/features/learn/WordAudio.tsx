import { useRef, useState } from 'react'
import { appUrl } from '../../data/content'
import { Button } from '../../ui/Button'

/** Says a word aloud. */
export function WordAudio({ path, label }: { path: string; label: string }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [failed, setFailed] = useState(false)

  async function play() {
    const element = audio.current
    if (!element) return
    element.currentTime = 0
    try {
      await element.play()
      setFailed(false)
    } catch (error) {
      if ((error as { name?: string })?.name !== 'AbortError') setFailed(true)
    }
  }

  return (
    <span className="inline-flex flex-col items-center gap-1">
      <audio
        ref={audio}
        src={appUrl(path)}
        preload="none"
        onError={() => setFailed(true)}
      />
      <Button
        variant="secondary"
        aria-label={label}
        onClick={() => void play()}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11 5 6 9H3v6h3l5 4z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
        Listen
      </Button>
      {failed && (
        <span role="alert" className="text-sm text-danger">
          Audio unavailable offline.
        </span>
      )}
    </span>
  )
}
