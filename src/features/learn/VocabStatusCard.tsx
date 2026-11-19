import { Link } from 'react-router'
import { useVocabToday } from './useVocabToday'

/** How many words are waiting today, with a way in. */
export function VocabStatusCard() {
  const status = useVocabToday()
  if (status && !(status instanceof Error) && status.offered === 0) return null
  return (
    <section
      aria-label="Words"
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
    >
      <h2 className="font-semibold">Words</h2>
      {status instanceof Error ? (
        <p role="alert" className="text-danger">
          Words could not be loaded: {status.message}
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
