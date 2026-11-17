import type { Level } from '../../domain/content/schema'
import type { EpochMs, LocalDate } from '../../domain/types'
import { db } from '../db'

export interface SettingValues {
  /** The level the learner is preparing for. */
  targetLevel: Level
  /** The day of the test, if the learner knows it. */
  examDate: LocalDate | null
  /** Set once the welcome screen has been completed. */
  onboarded: boolean
  /** When a JSON backup last reached the learner. */
  lastBackupAt: EpochMs | null
  /** Speed of listening practice; mock exams always play at 1. */
  playbackRate: PlaybackRate
}

export const PLAYBACK_RATES = [0.75, 1] as const
export type PlaybackRate = (typeof PLAYBACK_RATES)[number]

export type SettingKey = keyof SettingValues

export const SETTING_DEFAULTS: SettingValues = {
  targetLevel: 'D',
  examDate: null,
  onboarded: false,
  lastBackupAt: null,
  playbackRate: 1,
}

/** The stored value, or the default when the setting was never written. */
export async function getSetting<K extends SettingKey>(
  key: K,
): Promise<SettingValues[K]> {
  const row = await db.settings.get(key)
  return row ? (row.value as SettingValues[K]) : SETTING_DEFAULTS[key]
}

export async function setSetting<K extends SettingKey>(
  key: K,
  value: SettingValues[K],
): Promise<void> {
  await db.settings.put({ key, value, updatedAt: Date.now() })
}

/** Saves the welcome screen's answers in one write. */
export async function completeOnboarding(
  targetLevel: Level,
  examDate: LocalDate | null,
): Promise<void> {
  const updatedAt = Date.now()
  await db.settings.bulkPut([
    { key: 'targetLevel', value: targetLevel, updatedAt },
    { key: 'examDate', value: examDate, updatedAt },
    { key: 'onboarded', value: true, updatedAt },
  ])
}
