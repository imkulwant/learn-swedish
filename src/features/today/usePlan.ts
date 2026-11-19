import { useLiveQuery } from 'dexie-react-hooks'
import { listMocks } from '../../data/content'
import { listMockRuns } from '../../data/repositories/mocks'
import { activityByDay, thisWeek } from '../../data/repositories/progress'
import { getReadiness } from '../../data/repositories/readiness'
import type { Level } from '../../domain/content/schema'
import { toLocalDate } from '../../domain/dates'
import { EXAM_ORDER } from '../../domain/examFormat'
import { currentPart } from '../../domain/mock'
import {
  streak,
  studyPlan,
  type PlanInput,
  type PlanItem,
} from '../../domain/studyPlan'
import type { LocalDate } from '../../domain/types'
import { useAsync } from '../../ui/useAsync'
import { useNow } from '../../ui/useNow'
import { useGrammar } from '../learn/grammar/useGrammar'
import { useVocabToday } from '../learn/useVocabToday'

export interface TodayPlan {
  items: PlanItem[]
  streak: number
}

/** Today's plan and streak, or undefined while anything is loading. */
export function usePlan(
  level: Level,
  examDate: LocalDate | null,
): TodayPlan | undefined {
  const today = toLocalDate(useNow(60_000))
  const words = useVocabToday()
  const grammar = useGrammar()
  const mocks = useAsync(() => listMocks(), 'mocks')
  const stored = useLiveQuery(async () => {
    const readiness = Object.fromEntries(
      await Promise.all(
        EXAM_ORDER.map(async (s) => [s, await getReadiness(level, s)] as const),
      ),
    ) as PlanInput['readiness']
    return {
      readiness,
      week: await thisWeek(today),
      activity: await activityByDay(),
      runs: await listMockRuns(),
    }
  }, [level, today])

  if (!stored || words === undefined || grammar.status === 'loading')
    return undefined
  if (mocks.status === 'loading') return undefined

  // A mock in progress comes first; otherwise one of the learner's level.
  const running = stored.runs.find((r) => r.status === 'running')
  const available =
    mocks.status === 'ready'
      ? mocks.value.find((m) => m.level === level)
      : undefined
  const partDoneToday = stored.runs.some((r) =>
    EXAM_ORDER.some((s) => {
      const done = r.parts[s].finishedAt
      return done !== null && toLocalDate(done) === today
    }),
  )
  const mock = running
    ? {
        id: running.examId,
        title: running.examId,
        nextPart: currentPart(running.parts),
        finished: false,
        partDoneToday,
      }
    : available
      ? {
          id: available.id,
          title: available.title,
          nextPart: null,
          finished: stored.runs.some(
            (r) => r.examId === available.id && r.status === 'finished',
          ),
          partDoneToday,
        }
      : null

  return {
    items: studyPlan({
      today,
      examDate,
      wordsToday: words instanceof Error ? 0 : words.due + words.newToday,
      readiness: stored.readiness,
      nextLesson:
        grammar.status === 'ready' && grammar.value.next
          ? {
              id: grammar.value.next.lesson.id,
              title: grammar.value.next.lesson.title,
            }
          : null,
      writingThisWeek: stored.week.writing,
      speakingThisWeek: stored.week.speaking,
      mock,
    }),
    streak: streak(stored.activity, today),
  }
}
