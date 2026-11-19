import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router'
import type { OfferedVocab } from '../../data/content'
import { getSetting } from '../../data/repositories/settings'
import { shuffled } from '../../domain/flashcards'
import type { CardDirection } from '../../domain/types'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useOfferedVocab } from './useOfferedVocab'
import { WordCard } from './WordCard'

type Direction = Extract<CardDirection, 'sv-en' | 'en-sv'>

const DIRECTIONS: [Direction, string][] = [
  ['sv-en', 'Swedish to English'],
  ['en-sv', 'English to Swedish'],
]

/**
 * Free practice with every word of the level: flip a card, go on, shuffle.
 * It never changes the spaced-repetition schedule.
 */
function Deck({ vocab }: { vocab: OfferedVocab }) {
  const [order, setOrder] = useState(() => vocab.words.map((_, i) => i))
  const [position, setPosition] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [direction, setDirection] = useState<Direction>('sv-en')

  const offered = vocab.words[order[position]!]!
  const go = (step: number) => {
    setPosition((p) => (p + step + order.length) % order.length)
    setRevealed(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Direction" className="flex gap-2">
        {DIRECTIONS.map(([d, label]) => (
          <Chip
            key={d}
            selected={direction === d}
            onClick={() => {
              setDirection(d)
              setRevealed(false)
            }}
          >
            {label}
          </Chip>
        ))}
      </div>
      <p className="text-sm text-muted" aria-live="polite">
        Card {position + 1} of {order.length}
      </p>
      <WordCard
        key={`${offered.wordId}-${direction}`}
        word={offered.word}
        direction={direction}
        audioPath={offered.audioPath}
        revealed={revealed}
      />
      {!revealed && (
        <Button onClick={() => setRevealed(true)}>Show answer</Button>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" onClick={() => go(-1)}>
          Previous
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setOrder((o) => shuffled(o))
            setPosition(0)
            setRevealed(false)
          }}
        >
          Shuffle
        </Button>
        <Button variant="secondary" onClick={() => go(1)}>
          Next
        </Button>
      </div>
    </div>
  )
}

export function FlashcardsScreen() {
  const offered = useOfferedVocab()
  const level = useLiveQuery(() => getSetting('targetLevel'))
  return (
    <Screen title="Flashcards" back="/learn">
      {offered.status === 'loading' && <Loading />}
      {offered.status === 'error' && (
        <EmptyState
          title="Words could not be loaded"
          description={offered.message}
        />
      )}
      {offered.status === 'ready' &&
        (offered.value.words.length ? (
          <Deck vocab={offered.value} />
        ) : (
          <EmptyState
            title={`No words for level ${level} yet`}
            description="Word packs appear here once a reviewer has checked them."
            action={
              <Link to="/learn" className="font-semibold text-accent-fg">
                Back to Learn
              </Link>
            }
          />
        ))}
    </Screen>
  )
}
