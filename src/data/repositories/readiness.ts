import type { Level, Skill } from '../../domain/content/schema'
import { readiness, type Readiness } from '../../domain/readiness'
import { listAttempts } from './attempts'

/** Readiness of one level and part, from the stored attempts. */
export async function getReadiness(
  level: Level,
  skill: Skill,
): Promise<Readiness> {
  return readiness(await listAttempts(level, skill))
}
