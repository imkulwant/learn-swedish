import { Link, Route, Routes } from 'react-router'
import { ExamScreen } from '../features/exam/ExamScreen'
import { ListeningDrillScreen } from '../features/exam/ListeningDrillScreen'
import { PartScreen } from '../features/exam/PartScreen'
import { ReadingDrillScreen } from '../features/exam/ReadingDrillScreen'
import { ComingSoonScreen } from '../features/placeholder/ComingSoonScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { TodayScreen } from '../features/today/TodayScreen'
import { EmptyState } from '../ui/EmptyState'
import { Screen } from '../ui/Screen'
import { AppShell } from './AppShell'

function NotFoundScreen() {
  return (
    <Screen title="Not found" back="/">
      <EmptyState
        title="There is nothing here"
        description="This address does not match a screen."
        action={
          <Link className="font-semibold text-accent" to="/">
            Go to Today
          </Link>
        }
      />
    </Screen>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<TodayScreen />} />
        <Route path="exam" element={<ExamScreen />} />
        <Route path="exam/lasa" element={<PartScreen skill="lasa" />} />
        <Route path="exam/lasa/:packId" element={<ReadingDrillScreen />} />
        <Route path="exam/hora" element={<PartScreen skill="hora" />} />
        <Route path="exam/hora/:packId" element={<ListeningDrillScreen />} />
        <Route
          path="learn"
          element={
            <ComingSoonScreen
              title="Learn"
              description="Vocabulary with spaced repetition, grammar lessons and pronunciation."
            />
          }
        />
        <Route
          path="everyday"
          element={
            <ComingSoonScreen
              title="Everyday"
              description="Role-plays for the health centre, work, school, the landlord and more."
            />
          }
        />
        <Route
          path="progress"
          element={
            <ComingSoonScreen
              title="Progress"
              description="Readiness for every part, your study calendar and mock exam results."
            />
          }
        />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  )
}
