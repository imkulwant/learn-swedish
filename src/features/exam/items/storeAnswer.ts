import { recordAttempt } from '../../../data/repositories/attempts'
import type { AttemptSkill, Level } from '../../../domain/content/schema'
import { dataMarker } from '../../../platform/dataMarker'
import { reportStorageFailure } from '../../../platform/storageFailure'
import type { Answered } from './types'

/** The pack an answered item came from. */
export interface AnswerSource {
  id: string
  version: number
  level: Level
  skill: AttemptSkill
}

/**
 * Stores one checked answer. The answer counts only once it is stored: a
 * device that refuses writes opens the storage-failure gate, and any failure
 * is thrown, so the question stays open.
 */
export async function storeAnswer(
  pack: AnswerSource,
  itemId: string,
  answer: Answered,
): Promise<void> {
  try {
    await recordAttempt({
      ...answer,
      itemId,
      packId: pack.id,
      packVersion: pack.version,
      level: pack.level,
      skill: pack.skill,
      mode: 'drill',
    })
  } catch (error) {
    reportStorageFailure(error)
    throw error
  }
  // From now on, an empty database at launch means progress was lost.
  dataMarker.mark()
}
