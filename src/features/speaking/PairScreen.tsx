import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useParams } from 'react-router'
import { loadPairTopics, type OfferedPair } from '../../data/content'
import {
  assessPairSession,
  listPairSessions,
} from '../../data/repositories/pairs'
import { LEVELS } from '../../domain/content/schema'
import {
  PAIR_MINUTES,
  PAIR_RUBRIC,
  formatDuration,
  rubricShare,
} from '../../domain/speaking'
import type { PairSession } from '../../domain/types'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { useNow } from '../../ui/useNow'
import { ReadinessCard } from '../exam/ReadinessCard'
import { RubricForm } from '../writing/RubricForm'
import { ConversationPlayer, PairSessionList } from './Conversation'
import { ScriptedPartner } from './ScriptedPartner'

/** The question in the middle, the ideas around it, and the goal. */
export function MindMap({ offered: { topic } }: { offered: OfferedPair }) {
  return (
    <section
      aria-label="Mind map"
      className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface p-4"
    >
      {topic.status === 'draft' && (
        <p className="rounded-full border border-warning px-3 py-0.5 text-xs text-warning">
          Draft – not yet checked by a reviewer
        </p>
      )}
      <p
        lang="sv"
        className="rounded-card border-2 border-accent-fg px-4 py-3 text-center text-lg font-bold"
      >
        {topic.question}
      </p>
      <ul lang="sv" className="flex flex-wrap justify-center gap-2">
        {topic.mindmap.map((idea) => (
          <li
            key={idea}
            className="rounded-full border border-border bg-surface-2 px-3 py-1"
          >
            {idea}
          </li>
        ))}
      </ul>
      <p lang="sv" className="text-center font-semibold">
        {topic.goal}
      </p>
    </section>
  )
}

export function PhraseCards({ offered }: { offered: OfferedPair }) {
  return (
    <details className="rounded-card border border-border bg-surface p-4">
      <summary className="tap-target flex items-center font-semibold text-accent-fg">
        Phrases for the discussion
      </summary>
      <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
        {offered.phraseCards.map((card) => (
          <div key={card.title}>
            <h3 className="text-sm text-muted">{card.title}</h3>
            <ul lang="sv">
              {card.phrases.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  )
}

/** Talking with a friend: the mind map, the phrases and the test's 10 minutes. */
function WithFriend() {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const now = useNow(250)
  const left = endsAt === null ? PAIR_MINUTES * 60_000 : endsAt - now
  return (
    <section aria-label="With a friend" className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        Sit with a friend or classmate. Talk about the question, use the ideas
        in the mind map, and agree on what matters most. Nothing is recorded.
      </p>
      <div className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface p-4">
        <p className="text-4xl font-bold tabular-nums" role="timer">
          {formatDuration(left)}
        </p>
        {endsAt !== null && left <= 0 && (
          <p role="status" className="font-semibold">
            Time is up. Did you agree?
          </p>
        )}
        {endsAt === null ? (
          <Button
            className="w-full"
            onClick={() => setEndsAt(Date.now() + PAIR_MINUTES * 60_000)}
          >
            Start {PAIR_MINUTES} minutes
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setEndsAt(null)}
          >
            Reset
          </Button>
        )}
      </div>
    </section>
  )
}

function Review({
  offered,
  session,
  onDone,
}: {
  offered: OfferedPair
  session: PairSession
  onDone: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      {session.rubric && (
        <section
          aria-label="Result"
          className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4"
        >
          <h2 className="text-lg font-semibold">Your assessment</h2>
          <p className="text-2xl font-bold">{rubricShare(session.rubric)}%</p>
        </section>
      )}
      <ConversationPlayer script={offered.script} session={session} />
      {session.rubric ? (
        <>
          <ReadinessCard level={offered.pack.level} skill="tala" />
          <Button onClick={onDone}>Done</Button>
        </>
      ) : (
        <RubricForm
          criteria={PAIR_RUBRIC}
          intro="Listen to the discussion. On the test, the examiner looks for how you keep the talk going, not only for correct Swedish."
          onSave={(rubric) => assessPairSession(session.id, rubric)}
        />
      )}
    </div>
  )
}

type Mode = 'partner' | 'friend'

function Pair({ offered }: { offered: OfferedPair }) {
  const sessions = useLiveQuery(
    () => listPairSessions(offered.topic.id),
    [offered.topic.id],
  )
  const [mode, setMode] = useState<Mode>('partner')
  const [reviewing, setReviewing] = useState<string | null>(null)
  // A new key starts a fresh discussion after one has been reviewed.
  const [round, setRound] = useState(0)
  const open = sessions?.find((s) => s.id === reviewing)

  if (!sessions) return <Loading />
  if (open)
    return (
      <Review
        offered={offered}
        session={open}
        onDone={() => {
          setReviewing(null)
          setRound((r) => r + 1)
        }}
      />
    )
  return (
    <>
      <MindMap offered={offered} />
      <PhraseCards offered={offered} />
      <div role="group" aria-label="Who you talk with" className="flex gap-2">
        <Chip selected={mode === 'partner'} onClick={() => setMode('partner')}>
          Scripted partner
        </Chip>
        <Chip selected={mode === 'friend'} onClick={() => setMode('friend')}>
          With a friend
        </Chip>
      </div>
      {mode === 'partner' ? (
        <>
          <ScriptedPartner
            key={round}
            script={offered.script}
            onFinished={setReviewing}
          />
          <PairSessionList sessions={sessions} onOpen={setReviewing} />
        </>
      ) : (
        <WithFriend />
      )}
    </>
  )
}

export function PairScreen() {
  const { topicId = '' } = useParams()
  const offered = useAsync(async () => {
    const all = (await Promise.all(LEVELS.map(loadPairTopics))).flat()
    return all.find((t) => t.topic.id === topicId) ?? null
  }, topicId)

  return (
    <Screen
      title={
        offered.status === 'ready' && offered.value
          ? offered.value.topic.title
          : 'Samtal i par'
      }
      back="/exam/tala"
    >
      {offered.status === 'loading' && <Loading />}
      {offered.status === 'error' && (
        <EmptyState
          title="This discussion could not be opened"
          description={offered.message}
        />
      )}
      {offered.status === 'ready' && !offered.value && (
        <EmptyState
          title="There is no such discussion"
          description="It may not be checked by a reviewer yet."
        />
      )}
      {offered.status === 'ready' && offered.value && (
        <Pair key={offered.value.topic.id} offered={offered.value} />
      )}
    </Screen>
  )
}
