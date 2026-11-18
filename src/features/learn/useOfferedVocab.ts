import { useLiveQuery } from 'dexie-react-hooks'
import { loadOfferedVocab, type OfferedVocab } from '../../data/content'
import { getSetting } from '../../data/repositories/settings'
import { useAsync, type AsyncState } from '../../ui/useAsync'

/** The words the learner practises for their target level. */
export function useOfferedVocab(): AsyncState<OfferedVocab> {
  const level = useLiveQuery(() => getSetting('targetLevel'))
  const state = useAsync(
    () => (level ? loadOfferedVocab(level) : new Promise<never>(() => {})),
    level ?? '',
  )
  return level ? state : { status: 'loading' }
}
