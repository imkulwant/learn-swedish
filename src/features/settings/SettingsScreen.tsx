import { APP_VERSION } from '../../app/version'
import { Screen } from '../../ui/Screen'
import { UpdateBanner } from '../updates/UpdateBanner'
import { BackupSection } from './BackupSection'
import { GoalSection } from './GoalSection'
import { StorageStatus } from './StorageStatus'

export function SettingsScreen() {
  return (
    <Screen title="Settings" back="/">
      <UpdateBanner />
      <GoalSection />
      <BackupSection />
      <StorageStatus />
      <section
        aria-labelledby="about-heading"
        className="flex flex-col gap-2 rounded-card bg-surface p-4"
      >
        <h2 id="about-heading" className="text-sm text-muted">
          About
        </h2>
        <p className="text-lg font-semibold">SFI Prep</p>
        <p className="text-muted">Version {APP_VERSION}</p>
        <p className="text-muted">
          Practice texts are original and written in the formats of the SFI
          national test. They are not real test questions, which are
          confidential. Readiness is an estimate, not an official score.
        </p>
      </section>
    </Screen>
  )
}
