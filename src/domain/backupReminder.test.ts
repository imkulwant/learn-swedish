import { describe, expect, it } from 'vitest'
import { backupOverdue } from './backupReminder.ts'

const DAY = 86_400_000
const now = 100 * DAY

describe('backupOverdue', () => {
  it('never nags with nothing unsaved, however old the last backup', () => {
    expect(backupOverdue({ oldestUnsavedAt: null, now })).toBe(false)
  })

  it('nags once the oldest unsaved answer is more than 14 days old', () => {
    expect(backupOverdue({ oldestUnsavedAt: now - 14 * DAY, now })).toBe(false)
    expect(backupOverdue({ oldestUnsavedAt: now - 14 * DAY - 1, now })).toBe(
      true,
    )
  })
})
