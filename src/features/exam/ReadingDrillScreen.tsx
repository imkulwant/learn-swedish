import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { loadReadingPack } from '../../data/content'
import { recordAttempt } from '../../data/repositories/attempts'
import type { Item, ReadingPack } from '../../domain/content/schema'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { MatchQuestion } from './items/MatchQuestion'
import { McQuestion } from './items/McQuestion'
import { ShortQuestion } from './items/ShortQuestion'
import type { Answered, OnAnswered } from './items/types'
import { dataMarker } from '../../platform/dataMarker'
import { reportStorageFailure } from '../../platform/storageFailure'
import { ReadinessCard } from './ReadinessCard'
import { ReadingTextView } from './ReadingTextView'

function Question({
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

/** Works through a pack one text at a time. Every answer is stored as it is checked. */
function Drill({ pack }: { pack: ReadingPack }) {
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
        <Link to="/exam/lasa" className="font-semibold text-accent">
          Choose another pack
        </Link>
      </div>
    )
  }

  const text = pack.texts[index]!
  const done = text.items.every((item) => answers[item.id])
  const last = index === pack.texts.length - 1

  async function answered(item: Item, answer: Answered) {
    // The answer counts only once it is stored. A device that refuses writes
    // opens the storage-failure gate, and any failure leaves the question open.
    try {
      await recordAttempt({
        ...answer,
        itemId: item.id,
        packId: pack.id,
        packVersion: pack.version,
        level: pack.level,
        skill: pack.skill,
        mode: 'drill',
      })
    } catch (error) {
      reportStorageFailure(error)
      throw error
    }
    // From now on, an empty database at launch means progress was lost.
    dataMarker.mark()
    setAnswers((a) => ({ ...a, [item.id]: answer }))
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted">
        Text {index + 1} of {pack.texts.length}
      </p>
      <ReadingTextView text={text} />
      {/* Keyed on the text, so the next text starts with fresh questions. */}
      <div key={text.id} className="flex flex-col gap-6">
        {text.items.map((item) => (
          <Question
            key={item.id}
            item={item}
            onAnswered={(a) => answered(item, a)}
          />
        ))}
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
          {last ? 'See result' : 'Next text'}
        </Button>
      )}
    </div>
  )
}

export function ReadingDrillScreen() {
  const { packId = '' } = useParams()
  const pack = useAsync(() => loadReadingPack(packId), packId)

  return (
    <Screen
      title={pack.status === 'ready' ? pack.value.title : 'Läsa'}
      back="/exam/lasa"
    >
      {pack.status === 'loading' && <Loading />}
      {pack.status === 'error' && (
        <EmptyState
          title="This pack could not be opened"
          description={pack.message}
        />
      )}
      {pack.status === 'ready' && (
        <Drill key={pack.value.id} pack={pack.value} />
      )}
    </Screen>
  )
}
