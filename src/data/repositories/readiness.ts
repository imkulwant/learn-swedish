import type { Level, Skill } from '../../domain/content/schema'
import { readiness, type Readiness } from '../../domain/readiness'
import { rubricShare } from '../../domain/speaking'
import { rubricPercent, selfAssessedReadiness } from '../../domain/writing'
import { listAttempts } from './attempts'
import { assessedPairSessions } from './pairs'
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
  // Solo answers and pair discussions both count for Tala.
  if (skill === 'tala')
    return selfAssessedReadiness(
      [
        ...(await assessedRecordings(level)),
        ...(await assessedPairSessions(level)),
      ].map((r) => ({
        percent: rubricShare(r.rubric!),
        assessedAt: r.assessedAt!,
      })),
    )
  return readiness(await listAttempts(level, skill))
}
