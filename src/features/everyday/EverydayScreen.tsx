import { Link } from 'react-router'
import { loadManifest, loadScenarios } from '../../data/content'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { OfflineAudio } from '../exam/OfflineAudio'

/** Everyday situations, for every level. */
export function EverydayScreen() {
  const scenarios = useAsync(() => loadScenarios(), 'scenarios')
  const packs = useAsync(
    async () =>
      (await loadManifest()).packs.filter((p) => p.skill === 'vardag'),
    'vardag-packs',
  )

  return (
    <Screen title="Everyday">
      <p className="text-muted">
        Swedish for real life: calling the health centre, the pharmacy, work and
        more. Learn the key phrases, listen to a dialogue, then play your part.
      </p>
      {scenarios.status === 'loading' && <Loading />}
      {scenarios.status === 'error' && (
        <EmptyState
          title="Scenarios could not be loaded"
          description={scenarios.message}
        />
      )}
      {scenarios.status === 'ready' && !scenarios.value.length && (
        <EmptyState
          title="No scenarios yet"
          description="They appear here once a reviewer has checked them."
        />
      )}
      {scenarios.status === 'ready' && (
        <ul className="flex flex-col gap-2">
          {scenarios.value.map(({ scenario }) => (
            <li key={scenario.id}>
              <Link
                to={scenario.id}
                className="tap-target flex flex-col rounded-card border border-border bg-surface p-4 active:bg-surface-2"
              >
                <span lang="sv" className="font-semibold">
                  {scenario.title}
                </span>
                <span className="text-sm text-muted">
                  {scenario.en}
                  {scenario.status === 'draft' && ' · draft'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {packs.status === 'ready' && <OfflineAudio packs={packs.value} />}
    </Screen>
  )
}
