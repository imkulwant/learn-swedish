import { useState } from 'react'
import { Link, useParams } from 'react-router'
import type { OfferedLesson } from '../../../data/content'
import type { GrammarItem } from '../../../domain/content/schema'
import { EmptyState } from '../../../ui/EmptyState'
import { Loading } from '../../../ui/Loading'
import { Screen } from '../../../ui/Screen'
import { McQuestion } from '../../exam/items/McQuestion'
import { storeAnswer } from '../../exam/items/storeAnswer'
import type { Answered, OnAnswered } from '../../exam/items/types'
import { LessonBody } from './LessonBody'
import { OrderQuestion } from './OrderQuestion'
import { TypedQuestion } from './TypedQuestion'
import { useGrammar } from './useGrammar'

function Exercise({
  item,
  onAnswered,
}: {
  item: GrammarItem
  onAnswered: OnAnswered
}) {
  switch (item.type) {
    case 'mc':
      return <McQuestion item={item} onAnswered={onAnswered} />
    case 'order':
      return <OrderQuestion item={item} onAnswered={onAnswered} />
    case 'gap':
    case 'transform':
      return <TypedQuestion item={item} onAnswered={onAnswered} />
  }
}

/** The explanation, then the exercises, each stored as it is checked. */
function Lesson({
  offered: { lesson, pack },
  next,
}: {
  offered: OfferedLesson
  next: OfferedLesson | null
}) {
  const [answers, setAnswers] = useState<Record<string, Answered>>({})
  const done = lesson.items.every((item) => answers[item.id])
  const points = Object.values(answers).reduce((n, a) => n + a.score, 0)

  async function answered(item: GrammarItem, answer: Answered) {
    await storeAnswer({ ...pack, skill: 'grammatik' }, item.id, answer)
    setAnswers((a) => ({ ...a, [item.id]: answer }))
  }

  return (
    <div className="flex flex-col gap-5">
      {lesson.status === 'draft' && (
        <p className="self-start rounded-full border border-warning px-3 py-0.5 text-xs text-warning">
          Draft – not yet checked by a reviewer
        </p>
      )}
      <p className="text-muted">{lesson.en}</p>
      <LessonBody body={lesson.body} />
      <section aria-labelledby="exercises" className="flex flex-col gap-6">
        <h2 id="exercises" className="text-lg font-semibold">
          Exercises
        </h2>
        {lesson.items.map((item) => (
          <Exercise
            key={item.id}
            item={item}
            onAnswered={(a) => answered(item, a)}
          />
        ))}
      </section>
      {done && (
        <section
          aria-label="Result"
          className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
        >
          <h2 className="text-lg font-semibold">Lesson finished</h2>
          <p className="text-2xl font-bold">
            {points} of {lesson.items.length} right
          </p>
          {next ? (
            <Link
              to={`/learn/grammatik/${next.lesson.id}`}
              className="tap-target flex items-center justify-center rounded-control bg-accent px-4 py-2 font-semibold text-on-accent"
            >
              Next lesson: <span lang="sv">{next.lesson.title}</span>
            </Link>
          ) : (
            <Link to="/learn/grammatik" className="font-semibold text-accent">
              All lessons
            </Link>
          )}
        </section>
      )}
    </div>
  )
}

export function LessonScreen() {
  const { lessonId = '' } = useParams()
  const grammar = useGrammar()
  const lessons = grammar.status === 'ready' ? grammar.value.lessons : []
  const index = lessons.findIndex((l) => l.lesson.id === lessonId)
  const offered = lessons[index]

  return (
    <Screen
      title={offered ? offered.lesson.title : 'Grammar'}
      back="/learn/grammatik"
    >
      {grammar.status === 'loading' && <Loading />}
      {grammar.status === 'error' && (
        <EmptyState
          title="This lesson could not be opened"
          description={grammar.message}
        />
      )}
      {grammar.status === 'ready' && !offered && (
        <EmptyState
          title="There is no such lesson"
          description="It may not be part of your level, or not checked by a reviewer yet."
        />
      )}
      {offered && (
        // Keyed on the lesson, so the next one starts fresh.
        <Lesson
          key={offered.lesson.id}
          offered={offered}
          next={lessons[index + 1] ?? null}
        />
      )}
    </Screen>
  )
}
