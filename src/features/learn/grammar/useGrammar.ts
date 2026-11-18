import { useLiveQuery } from 'dexie-react-hooks'
import {
  loadLessons,
  practiceLevels,
  type OfferedLesson,
} from '../../../data/content'
import { answeredItemIds } from '../../../data/repositories/attempts'
import { getSetting } from '../../../data/repositories/settings'
import type { GrammarLesson } from '../../../domain/content/schema'
import { useAsync, type AsyncState } from '../../../ui/useAsync'

export interface GrammarProgress {
  lessons: OfferedLesson[]
  /** Exercises answered at least once, by lesson id. */
  answered: Map<string, number>
  /** The first lesson with an exercise not yet answered, or null when all are done. */
  next: OfferedLesson | null
}

export const isDone = (lesson: GrammarLesson, answered: number) =>
  answered >= lesson.items.length

/** The lessons for the learner's level, in order, with how far they have got. */
export function useGrammar(): AsyncState<GrammarProgress> {
  const level = useLiveQuery(() => getSetting('targetLevel'))
  const levels = level ? practiceLevels(level) : null
  const lessons = useAsync(
    () => (levels ? loadLessons(levels) : new Promise<never>(() => {})),
    levels?.join() ?? '',
  )
  const ids = useLiveQuery(
    () => (levels ? answeredItemIds(levels, 'grammatik') : undefined),
    [levels?.join()],
  )

  if (lessons.status !== 'ready') return lessons
  if (!ids) return { status: 'loading' }
  const answered = new Map(
    lessons.value.map(({ lesson }) => [
      lesson.id,
      lesson.items.filter((item) => ids.has(item.id)).length,
    ]),
  )
  const next =
    lessons.value.find(
      ({ lesson }) => !isDone(lesson, answered.get(lesson.id)!),
    ) ?? null
  return { status: 'ready', value: { lessons: lessons.value, answered, next } }
}
