import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { getSetting } from '../../data/repositories/settings'
import { Screen } from '../../ui/Screen'
import { ReadinessCard } from '../exam/ReadinessCard'
import { UpdateBanner } from '../updates/UpdateBanner'

export function TodayScreen() {
  const level = useLiveQuery(() => getSetting('targetLevel'))

  return (
    <Screen title="Today">
      <UpdateBanner />
      {level && (
        <>
          <p className="text-muted">
            Your goal: pass the SFI {level} national test.
          </p>
          <ReadinessCard level={level} skill="lasa" />
          <Link
            to="/exam/lasa"
            className="tap-target flex items-center justify-center rounded-control bg-accent px-4 py-2 font-semibold text-on-accent"
          >
            Practise reading
          </Link>
        </>
      )}
    </Screen>
  )
}
