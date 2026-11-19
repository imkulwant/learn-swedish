import { useLiveQuery } from 'dexie-react-hooks'
import { getStudyDay, vocabStatus } from '../../data/repositories/vocab'
import { toLocalDate } from '../../domain/dates'
import { SRS, dueToday } from '../../domain/srs'
import { useNow } from '../../ui/useNow'
import { useOfferedVocab } from './useOfferedVocab'

export interface VocabToday {
  /** Cards due now, capped at the answers left today. */
  due: number
  /** New words that can still be started today. */
  newToday: number
  known: number
  /** Words in the packs for the learner's level. */
  offered: number
}

/** Where the learner is with words today, or undefined while loading. */
export function useVocabToday(): VocabToday | undefined | Error {
  const offered = useOfferedVocab()
  const now = useNow(60_000)
  const words = offered.status === 'ready' ? offered.value.words : null
  const status = useLiveQuery(async () => {
    if (!words) return undefined
    const [s, today] = await Promise.all([
      vocabStatus(words, now),
      getStudyDay(toLocalDate(now)),
    ])
    const newLeft = Math.max(0, SRS.newWordsPerDay - today.newWords)
    const due = dueToday(s.due, today)
    const answersLeft = Math.max(0, SRS.reviewsPerDay - today.reviews - due)
    return {
      due,
      newToday: Math.min(newLeft, s.unstarted, answersLeft),
      known: s.known,
      offered: words.length,
    }
  }, [words, now])
  if (offered.status === 'error') return new Error(offered.message)
  return status
}
