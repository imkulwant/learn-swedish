import type { Level, Skill } from '../../domain/content/schema'
import { readiness, type Readiness } from '../../domain/readiness'
import { rubricPercent, selfAssessedReadiness } from '../../domain/writing'
import { listAttempts } from './attempts'
import { assessedWritings } from './writings'

/**
 * Readiness of one level and part. Läsa and Höra come from scored answers,
 * Skriva from the learner's own assessments of their texts.
 */
export async function getReadiness(
  level: Level,
  skill: Skill,
): Promise<Readiness> {
  if (skill === 'skriva')
    return selfAssessedReadiness(
      (await assessedWritings(level)).map((w) => ({
        percent: rubricPercent(w.rubric!),
        assessedAt: w.assessedAt!,
      })),
    )
  return readiness(await listAttempts(level, skill))
}
