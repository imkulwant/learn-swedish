import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import {
  getSetting,
  PLAYBACK_RATES,
  setSetting,
} from '../../data/repositories/settings'
import { storeAll } from '../../platform/audioCache'
import { reportStorageFailure } from '../../platform/storageFailure'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'

type Problem = 'unavailable' | 'tap-again'

const errorName = (error: unknown) =>
  typeof error === 'object' && error !== null && 'name' in error
    ? String((error as { name: unknown }).name)
    : ''

/**
 * Plays one clip. There is no seek bar, as on the test: a clip is heard from
 * the start. Drills allow any number of plays and a slower speed, which is
 * remembered; the number of plays is shown so the learner can practise with
 * two, as a habit. A play counts once audio actually starts.
 */
/** Exam conditions: speed 1, no pausing, and a fixed number of plays. */
export interface PlayLimit {
  max: number
  /** Plays already used, kept by the caller so a resumed mock keeps them. */
  used: number
  onPlayed: () => void
}

export function AudioPlayer({
  src,
  label,
  limit,
}: {
  src: string
  label: string
  limit?: PlayLimit
}) {
  const audio = useRef<HTMLAudioElement>(null)
  // Set when a play starts from the beginning, and counted once audio flows.
  const fresh = useRef(false)
  const chosenSpeed = useLiveQuery(() => getSetting('playbackRate')) ?? 1
  const speed = limit ? 1 : chosenSpeed
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState<'start' | 'middle' | 'end'>('start')
  const [plays, setPlays] = useState(0)
  const [progress, setProgress] = useState(0)
  const [problem, setProblem] = useState<Problem | null>(null)

  useEffect(() => {
    const element = audio.current
    if (element) element.defaultPlaybackRate = element.playbackRate = speed
  }, [speed])

  async function play(fromStart: boolean) {
    const element = audio.current
    if (!element) return
    // WebKit keeps a failed load on the element even once the file can be
    // fetched again, so the way back is a reload of the page.
    if (element.error) {
      setProblem('unavailable')
      return
    }
    if (fromStart || position !== 'middle') {
      element.currentTime = 0
      fresh.current = true
    }
    try {
      await element.play()
      // Keep the clip for offline use once it has been played here.
      void storeAll([src]).catch(() => {})
    } catch (error) {
      fresh.current = false
      const name = errorName(error)
      // A pause before the audio had started is not a problem.
      if (name === 'AbortError') return
      setProblem(name === 'NotAllowedError' ? 'tap-again' : 'unavailable')
    }
  }

  // Follows what the learner hears, not `element.paused`: after a failed
  // play the element still claims not to be paused.
  function toggle() {
    if (limit) {
      // On the test a clip is heard from the start and cannot be paused.
      if (playing) return
      // iOS can pause a clip itself, for a call or the lock screen: it goes
      // on without using a play.
      if (position === 'middle') void play(false)
      else if (limit.used < limit.max) void play(true)
      return
    }
    if (playing) audio.current?.pause()
    else void play(false)
  }

  function chooseSpeed(rate: (typeof PLAYBACK_RATES)[number]) {
    void setSetting('playbackRate', rate).catch(reportStorageFailure)
  }

  return (
    <section
      aria-label={`Audio: ${label}`}
      className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
    >
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlaying={() => {
          setPlaying(true)
          setProblem(null)
          if (fresh.current) {
            fresh.current = false
            setPlays((n) => n + 1)
            limit?.onPlayed()
          }
        }}
        onPause={(e) => {
          setPlaying(false)
          // A failed load also pauses; only a pause during audio is "middle".
          const { ended, currentTime, error } = e.currentTarget
          if (!ended && !error && currentTime > 0) setPosition('middle')
        }}
        onEnded={() => {
          setPlaying(false)
          setPosition('end')
        }}
        onError={() => {
          setPlaying(false)
          setPosition('start')
          setProblem('unavailable')
        }}
        onTimeUpdate={(e) => {
          const { currentTime, duration } = e.currentTarget
          setProgress(duration ? currentTime / duration : 0)
        }}
      />
      <div className="flex items-center gap-2">
        {limit ? (
          <Button
            onClick={toggle}
            // Never natively disabled, so focus stays on it; taps are
            // ignored while playing or when no plays are left.
            aria-disabled={
              playing || (position !== 'middle' && limit.used >= limit.max)
            }
          >
            {playing
              ? 'Playing…'
              : position === 'middle'
                ? 'Resume'
                : limit.used >= limit.max
                  ? 'No plays left'
                  : limit.used === 0
                    ? 'Play'
                    : 'Play again'}
          </Button>
        ) : (
          <Button onClick={toggle}>
            {playing
              ? 'Pause'
              : position === 'middle'
                ? 'Resume'
                : plays === 0
                  ? 'Play'
                  : 'Play again'}
          </Button>
        )}
        {plays > 0 && !limit && (
          <Button variant="secondary" onClick={() => void play(true)}>
            From the start
          </Button>
        )}
      </div>
      <progress
        aria-label="Played"
        max={1}
        value={progress}
        className="h-2 w-full accent-[var(--color-accent)]"
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted">
          {limit
            ? `${limit.used} of ${limit.max} plays used`
            : plays === 0
              ? 'Not played yet'
              : `Played ${plays} ${plays === 1 ? 'time' : 'times'}`}
        </p>
        {!limit && (
          <div role="group" aria-label="Speed" className="flex gap-2">
            {PLAYBACK_RATES.map((rate) => (
              <Chip
                key={rate}
                selected={speed === rate}
                onClick={() => chooseSpeed(rate)}
              >
                {rate}×
              </Chip>
            ))}
          </div>
        )}
      </div>
      {problem === 'unavailable' && (
        <p role="alert" className="text-danger">
          The audio could not be loaded. Check the connection, then reload the
          page. To listen without internet, download the audio first: on the
          Höra screen, or on a mock's start screen.
        </p>
      )}
      {problem === 'unavailable' && (
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload
        </Button>
      )}
      {problem === 'tap-again' && (
        <p role="alert" className="text-danger">
          The browser did not allow the audio to start. Tap Play again.
        </p>
      )}
    </section>
  )
}
