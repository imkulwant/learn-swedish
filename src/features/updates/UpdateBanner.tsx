import { useSyncExternalStore } from 'react'
import { updates } from '../../platform/updates'
import { Button } from '../../ui/Button'

const subscribe = (onChange: () => void) => updates.subscribe(onChange)

/**
 * Offers a waiting new version, and switches only when tapped, because that
 * reloads the app. Once mock exams exist, it must stay hidden during one.
 */
export function UpdateBanner() {
  const ready = useSyncExternalStore(subscribe, updates.isReady)
  if (!ready) return null

  return (
    <section
      aria-label="Update"
      className="flex flex-col gap-2 rounded-card border border-accent bg-surface p-4"
    >
      <p className="font-semibold">A new version is ready</p>
      <p className="text-sm text-muted">
        Updating reloads the app. Your progress is kept.
      </p>
      <Button onClick={() => updates.apply()}>Update</Button>
    </section>
  )
}
