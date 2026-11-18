import type { Level, Skill } from '../../domain/content/schema'
import { readiness, type Readiness } from '../../domain/readiness'
import { speakingPercent } from '../../domain/speaking'
import { rubricPercent, selfAssessedReadiness } from '../../domain/writing'
import { listAttempts } from './attempts'
import { assessedRecordings } from './recordings'
import { assessedWritings } from './writings'

/**
 * Readiness of one level and part. Läsa and Höra come from scored answers,
 * Skriva and Tala from the learner's own assessments of texts and recordings.
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
  if (skill === 'tala')
    return selfAssessedReadiness(
      (await assessedRecordings(level)).map((r) => ({
        percent: speakingPercent(r.rubric!),
        assessedAt: r.assessedAt!,
      })),
    )
  return readiness(await listAttempts(level, skill))
}
