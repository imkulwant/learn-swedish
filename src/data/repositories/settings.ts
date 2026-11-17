import type { Level } from '../../domain/content/schema'
import { db } from '../db'

export interface SettingValues {
  targetLevel: Level
}

export type SettingKey = keyof SettingValues

export const SETTING_DEFAULTS: SettingValues = {
  targetLevel: 'D',
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
