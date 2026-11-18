import { Screen } from '../../ui/Screen'
import { useOfferedVocab } from './useOfferedVocab'
import { VocabStatusCard } from './VocabStatusCard'

export function LearnScreen() {
  const offered = useOfferedVocab()

  return (
    <Screen title="Learn">
      <VocabStatusCard />
      {offered.status === 'ready' && offered.value.packs.length > 0 && (
        <section aria-label="Word packs" className="flex flex-col gap-2">
          <h2 className="text-sm text-muted">Word packs</h2>
          <ul className="flex flex-col gap-2">
            {offered.value.packs.map((p) => (
              <li
                key={p.id}
                className="flex flex-col rounded-card border border-border bg-surface p-4"
              >
                <span lang="sv" className="font-semibold">
                  {p.title}
                </span>
                <span className="text-sm text-muted">
                  Level {p.level} · {p.unitCount} words
                  {p.hasDrafts && ' · includes drafts'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {offered.status === 'ready' && offered.value.packs.length === 0 && (
        <p className="text-muted">
          Word packs appear here once a reviewer has checked them.
        </p>
      )}
      <p className="text-sm text-muted">
        Grammar lessons and pronunciation practice come later.
      </p>
    </Screen>
  )
}
