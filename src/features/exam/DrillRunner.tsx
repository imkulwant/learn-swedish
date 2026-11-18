import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { Item, Level, Skill } from '../../domain/content/schema'
import { Button } from '../../ui/Button'
import { MatchQuestion } from './items/MatchQuestion'
import { McQuestion } from './items/McQuestion'
import { ShortQuestion } from './items/ShortQuestion'
import { storeAnswer } from './items/storeAnswer'
import type { Answered, OnAnswered } from './items/types'
import { ReadinessCard } from './ReadinessCard'

/** One question of any reading or listening format. */
export function Question({
  item,
  onAnswered,
}: {
  item: Item
  onAnswered: OnAnswered
}) {
  switch (item.type) {
    case 'mc':
      return <McQuestion item={item} onAnswered={onAnswered} />
    case 'short':
      return <ShortQuestion item={item} onAnswered={onAnswered} />
    case 'match':
      return <MatchQuestion item={item} onAnswered={onAnswered} />
  }
}

/** One text or clip of a drill. */
export interface DrillUnit {
  id: string
  items: Item[]
  /** The text or clip, shown above its questions. */
  render: (answeredAll: boolean) => ReactNode
}

export interface DrillPack {
  id: string
  version: number
  level: Level
  skill: Skill
}

/**
 * Works through a pack one text or clip at a time, the same way for every
 * part of the test. Every answer is stored as it is checked.
 */
export function DrillRunner({
  pack,
  units,
  unitName,
  backTo,
}: {
  pack: DrillPack
  units: DrillUnit[]
  /** "Text" or "Clip", for "Text 2 of 6". */
  unitName: string
  /** The pack list, for "Choose another pack". */
  backTo: string
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, Answered>>({})
  const [finished, setFinished] = useState(false)

  const all = Object.values(answers)
  const points = all.reduce((n, a) => n + a.score, 0)
  const max = all.reduce((n, a) => n + a.maxScore, 0)

  if (finished) {
    return (
      <div className="flex flex-col gap-4">
        <section
          aria-label="Result"
          className="rounded-card border border-border bg-surface p-4"
        >
          <h2 className="text-lg font-semibold">Drill finished</h2>
          <p className="text-2xl font-bold">
            {points} of {max} points
          </p>
        </section>
        <ReadinessCard level={pack.level} skill={pack.skill} />
        <Link to={backTo} className="font-semibold text-accent">
          Choose another pack
        </Link>
      </div>
    )
  }

  const unit = units[index]!
  const done = unit.items.every((item) => answers[item.id])
  const last = index === units.length - 1

  async function answered(item: Item, answer: Answered) {
    await storeAnswer(pack, item.id, answer)
    setAnswers((a) => ({ ...a, [item.id]: answer }))
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        {unitName} {index + 1} of {units.length}
      </p>
      {/* Keyed on the unit, so the next one starts fresh. */}
      <div key={unit.id} className="flex flex-col gap-5">
        {unit.render(done)}
        <div className="flex flex-col gap-6">
          {unit.items.map((item) => (
            <Question
              key={item.id}
              item={item}
              onAnswered={(a) => answered(item, a)}
            />
          ))}
        </div>
      </div>
      {done && (
        <Button
          onClick={() => {
            if (last) setFinished(true)
            else {
              setIndex(index + 1)
              window.scrollTo({ top: 0 })
            }
          }}
        >
          {last ? 'See result' : `Next ${unitName.toLowerCase()}`}
        </Button>
      )}
    </div>
  )
}
