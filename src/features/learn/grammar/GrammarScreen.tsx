import { Link } from 'react-router'
import { EmptyState } from '../../../ui/EmptyState'
import { Loading } from '../../../ui/Loading'
import { Screen } from '../../../ui/Screen'
import { isDone, useGrammar } from './useGrammar'

const linkClass =
  'tap-target flex items-center justify-center rounded-control px-4 py-2 font-semibold'

/** The next grammar lesson, with a way in. Shown on Today and Learn. */
export function GrammarStatusCard() {
  const grammar = useGrammar()
  if (grammar.status === 'ready' && grammar.value.lessons.length === 0)
    return null
  const total = grammar.status === 'ready' ? grammar.value.lessons.length : 0
  const next = grammar.status === 'ready' ? grammar.value.next : null

  return (
    <section
      aria-label="Grammar"
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4"
    >
      <h2 className="font-semibold">Grammar</h2>
      {grammar.status === 'error' ? (
        <p role="alert" className="text-danger">
          Lessons could not be loaded: {grammar.message}
        </p>
      ) : grammar.status === 'loading' ? (
        <p className="text-muted">Checking…</p>
      ) : next ? (
        <p className="text-muted">
          Next: lesson{' '}
          {grammar.value.lessons.findIndex(
            (l) => l.lesson.id === next.lesson.id,
          ) + 1}{' '}
          of {total}, <span lang="sv">{next.lesson.title}</span>
        </p>
      ) : (
        <p className="text-muted">All {total} lessons done.</p>
      )}
      <div className="flex gap-2">
        {next && (
          <Link
            to={`/learn/grammatik/${next.lesson.id}`}
            className={`${linkClass} flex-1 bg-accent text-on-accent`}
          >
            Open lesson
          </Link>
        )}
        <Link
          to="/learn/grammatik"
          className={`${linkClass} flex-1 ${next ? 'bg-surface-2 text-text' : 'bg-accent text-on-accent'}`}
        >
          All lessons
        </Link>
      </div>
    </section>
  )
}

/** Every grammar lesson for the learner's level, in the order they are taught. */
export function GrammarScreen() {
  const grammar = useGrammar()

  return (
    <Screen title="Grammar" back="/learn">
      <p className="text-muted">
        Short lessons on the grammar the test asks for, each with exercises.
        Take them in order.
      </p>
      {grammar.status === 'loading' && <Loading />}
      {grammar.status === 'error' && (
        <EmptyState
          title="Lessons could not be loaded"
          description={grammar.message}
        />
      )}
      {grammar.status === 'ready' && grammar.value.lessons.length === 0 && (
        <EmptyState
          title="No grammar lessons yet"
          description="They appear here once a reviewer has checked them."
        />
      )}
      {grammar.status === 'ready' && (
        <ol className="flex flex-col gap-2">
          {grammar.value.lessons.map(({ lesson }, i) => {
            const answered = grammar.value.answered.get(lesson.id)!
            const progress = isDone(lesson, answered)
              ? 'Done'
              : answered > 0
                ? `${answered} of ${lesson.items.length} exercises done`
                : `${lesson.items.length} exercises`
            return (
              <li key={lesson.id}>
                <Link
                  to={lesson.id}
                  className="tap-target flex flex-col rounded-card border border-border bg-surface p-4 active:bg-surface-2"
                >
                  <span className="font-semibold">
                    {i + 1}. <span lang="sv">{lesson.title}</span>
                  </span>
                  <span className="text-sm text-muted">
                    {lesson.en} · {progress}
                    {lesson.status === 'draft' && ' · draft'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </Screen>
  )
}
