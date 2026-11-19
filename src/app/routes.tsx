import { Link, Route, Routes } from 'react-router'
import { EverydayScreen } from '../features/everyday/EverydayScreen'
import { ScenarioScreen } from '../features/everyday/ScenarioScreen'
import { MockScreen } from '../features/mock/MockScreen'
import { ExamScreen } from '../features/exam/ExamScreen'
import { ListeningDrillScreen } from '../features/exam/ListeningDrillScreen'
import { PartScreen } from '../features/exam/PartScreen'
import { ReadingDrillScreen } from '../features/exam/ReadingDrillScreen'
import { GrammarScreen } from '../features/learn/grammar/GrammarScreen'
import { LessonScreen } from '../features/learn/grammar/LessonScreen'
import { LearnScreen } from '../features/learn/LearnScreen'
import { VocabScreen } from '../features/learn/VocabScreen'
import { ProgressScreen } from '../features/progress/ProgressScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { PairScreen } from '../features/speaking/PairScreen'
import { SpeakingPartScreen } from '../features/speaking/SpeakingPartScreen'
import { SpeakingTaskScreen } from '../features/speaking/SpeakingTaskScreen'
import { TodayScreen } from '../features/today/TodayScreen'
import { WritingPartScreen } from '../features/writing/WritingPartScreen'
import { WritingScreen } from '../features/writing/WritingScreen'
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
        <Route path="exam/skriva" element={<WritingPartScreen />} />
        <Route path="exam/skriva/:promptId" element={<WritingScreen />} />
        <Route path="exam/tala" element={<SpeakingPartScreen />} />
        <Route path="exam/tala/:taskId" element={<SpeakingTaskScreen />} />
        <Route path="exam/tala/par/:topicId" element={<PairScreen />} />
        <Route path="exam/prov/:examId" element={<MockScreen />} />
        <Route path="learn" element={<LearnScreen />} />
        <Route path="learn/ord" element={<VocabScreen />} />
        <Route path="learn/grammatik" element={<GrammarScreen />} />
        <Route path="learn/grammatik/:lessonId" element={<LessonScreen />} />
        <Route path="everyday" element={<EverydayScreen />} />
        <Route path="everyday/:scenarioId" element={<ScenarioScreen />} />
        <Route path="progress" element={<ProgressScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  )
}
