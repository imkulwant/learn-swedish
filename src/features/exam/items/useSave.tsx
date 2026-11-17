import { useState } from 'react'
import type { Answered, OnAnswered } from './types'

export const SAVE_FAILED = 'Your answer could not be saved. Try again.'

/**
 * Saves an answer and says whether it was stored. A failed save leaves the
 * question open with a message, so it can be checked again instead of looking
 * answered while nothing was stored.
 */
export function useSave(onAnswered: OnAnswered) {
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  async function save(answer: Answered): Promise<boolean> {
    setSaving(true)
    setFailed(false)
    try {
      await onAnswered(answer)
      return true
    } catch {
      setFailed(true)
      return false
    } finally {
      setSaving(false)
    }
  }

  return { save, saving, failed }
}

export function SaveFailed() {
  return (
    <p role="alert" className="text-danger">
      {SAVE_FAILED}
    </p>
  )
}
