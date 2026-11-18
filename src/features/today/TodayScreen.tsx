import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router'
import { getSetting } from '../../data/repositories/settings'
import { Screen } from '../../ui/Screen'
import { ReadinessCard } from '../exam/ReadinessCard'
import { GrammarStatusCard } from '../learn/grammar/GrammarScreen'
import { VocabStatusCard } from '../learn/VocabStatusCard'
import { Welcome } from '../onboarding/Welcome'
import { UpdateBanner } from '../updates/UpdateBanner'
import { BackupReminder } from './BackupReminder'
import { ExamCountdown } from './ExamCountdown'

function SettingsLink() {
  return (
    <Link
      to="/settings"
      aria-label="Settings"
      className="tap-target ml-auto flex items-center justify-center text-muted"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    </Link>
  )
}

export function TodayScreen() {
  const settings = useLiveQuery(async () => ({
    onboarded: await getSetting('onboarded'),
    level: await getSetting('targetLevel'),
    examDate: await getSetting('examDate'),
  }))

  if (!settings) return null
  // A new install starts with its goal; Today takes over once it is set.
  if (!settings.onboarded) return <Welcome />

  return (
    <Screen title="Today" action={<SettingsLink />}>
      <UpdateBanner />
      <BackupReminder />
      <p className="text-muted">
        Your goal: pass the SFI {settings.level} national test.
      </p>
      <ExamCountdown examDate={settings.examDate} />
      <ReadinessCard level={settings.level} skill="lasa" />
      <ReadinessCard level={settings.level} skill="hora" />
      <ReadinessCard level={settings.level} skill="skriva" />
      <VocabStatusCard />
      <GrammarStatusCard />
      <div className="flex gap-2">
        <Link
          to="/exam/lasa"
          className="tap-target flex flex-1 items-center justify-center rounded-control bg-accent px-4 py-2 font-semibold text-on-accent"
        >
          Practise reading
        </Link>
        <Link
          to="/exam/hora"
          className="tap-target flex flex-1 items-center justify-center rounded-control bg-accent px-4 py-2 font-semibold text-on-accent"
        >
          Practise listening
        </Link>
      </div>
    </Screen>
  )
}
