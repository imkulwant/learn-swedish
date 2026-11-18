import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { getStudyDay, vocabStatus } from '../../data/repositories/vocab'
import { toLocalDate } from '../../domain/dates'
import { SRS, dueToday } from '../../domain/srs'
import { useNow } from '../../ui/useNow'
import { useOfferedVocab } from './useOfferedVocab'

/** How many words are waiting today, with a way in. */
export function VocabStatusCard() {
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
      ...s,
      due,
      newToday: Math.min(newLeft, s.unstarted, answersLeft),
    }
  }, [words, now])

  if (offered.status === 'ready' && offered.value.words.length === 0)
    return null
  return (
    <section
      aria-label="Words"
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
    >
      <h2 className="font-semibold">Words</h2>
      {offered.status === 'error' ? (
        <p role="alert" className="text-danger">
          Words could not be loaded: {offered.message}
        </p>
      ) : status ? (
        <p className="text-muted">
          {status.due} due · {status.newToday} new today · {status.known}{' '}
          learned
        </p>
      ) : (
        <p className="text-muted">Checking…</p>
      )}
      <Link
        to="/learn/ord"
        className="tap-target flex items-center justify-center rounded-control bg-accent px-4 py-2 font-semibold text-on-accent"
      >
        Practise words
      </Link>
    </section>
  )
}
