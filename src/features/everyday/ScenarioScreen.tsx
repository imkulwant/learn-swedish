import { useLiveQuery } from 'dexie-react-hooks'
import { useRef, useState } from 'react'
import { useParams } from 'react-router'
import { appUrl, loadScenarios, type OfferedScenario } from '../../data/content'
import { listPairSessions } from '../../data/repositories/pairs'
import type { Item } from '../../domain/content/schema'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { EmptyState } from '../../ui/EmptyState'
import { Loading } from '../../ui/Loading'
import { Screen } from '../../ui/Screen'
import { useAsync } from '../../ui/useAsync'
import { Question } from '../exam/DrillRunner'
import { ListeningClipView } from '../exam/ListeningClipView'
import { storeAnswer } from '../exam/items/storeAnswer'
import type { Answered } from '../exam/items/types'
import { ConversationPlayer, PairSessionList } from '../speaking/Conversation'
import { ScriptedPartner } from '../speaking/ScriptedPartner'

/** The key phrases: tap one to hear it. */
function Phrases({ offered }: { offered: OfferedScenario }) {
  const { scenario, audio } = offered
  const player = useRef<HTMLAudioElement>(null)
  const [failed, setFailed] = useState(false)
  function play(i: number) {
    const element = player.current
    if (!element) return
    setFailed(false)
    element.src = appUrl(audio[`${scenario.id}-fras-${i + 1}`]!)
    // Tapping the next phrase interrupts this one: that is not a failure.
    element.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        setFailed(true)
    })
  }
  return (
    <section aria-label="Phrases" className="flex flex-col gap-2">
      <audio ref={player} onError={() => setFailed(true)} className="hidden" />
      {failed && (
        <p role="alert" className="text-danger">
          The phrase could not be played. Check the connection, or download the
          audio on the Everyday screen.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {scenario.phrases.map((phrase, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => play(i)}
              className="tap-target flex w-full items-center gap-3 rounded-card border border-border bg-surface p-3 text-left active:bg-surface-2"
            >
              <span aria-hidden="true" className="text-accent-fg">
                ▶
              </span>
              <span className="sr-only">Play: </span>
              <span className="flex flex-col">
                <span lang="sv" className="font-semibold">
                  {phrase.sv}
                </span>
                <span className="text-sm text-muted">{phrase.en}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The dialogue and its questions, each answer stored as it is checked. */
function Dialogue({ offered }: { offered: OfferedScenario }) {
  const { scenario, pack, audio } = offered
  const [answers, setAnswers] = useState<Record<string, Answered>>({})
  const items = scenario.dialog.items
  const done = items.every((item) => answers[item.id])

  async function answered(item: Item, answer: Answered) {
    await storeAnswer({ ...pack, skill: 'vardag' }, item.id, answer)
    setAnswers((a) => ({ ...a, [item.id]: answer }))
  }

  return (
    <section aria-label="Dialogue" className="flex flex-col gap-5">
      <ListeningClipView
        // The screen already shows the draft badge once.
        clip={{
          ...scenario.dialog,
          status: 'reviewed',
          kp27: scenario.kp27,
          theme: scenario.theme,
        }}
        audioPath={audio[scenario.dialog.id]!}
        answeredAll={done}
      />
      {items.map((item) => (
        <Question
          key={item.id}
          item={item}
          onAnswered={(a) => answered(item, a)}
        />
      ))}
    </section>
  )
}

/** The role-play: the partner speaks, the learner answers, then listens back. */
function RolePlay({ offered }: { offered: OfferedScenario }) {
  const { scenario, script } = offered
  const sessions = useLiveQuery(
    () => listPairSessions(scenario.id),
    [scenario.id],
  )
  const [open, setOpen] = useState<string | null>(null)
  const [round, setRound] = useState(0)
  const session = sessions?.find((s) => s.id === open)

  if (!sessions) return <Loading />
  if (session)
    return (
      <section aria-label="Role-play" className="flex flex-col gap-4">
        <ConversationPlayer script={script} session={session} />
        <section aria-labelledby="examples" className="flex flex-col gap-2">
          <h2 id="examples" className="text-lg font-semibold">
            What you could have said
          </h2>
          <ol className="flex flex-col gap-2">
            {scenario.roleplay.hints.map((hint, i) => (
              <li key={i} className="text-sm">
                <span className="text-muted">{hint.en} </span>
                <span lang="sv" className="italic">
                  {hint.example}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <Button
          onClick={() => {
            setOpen(null)
            setRound((r) => r + 1)
          }}
        >
          Play it again
        </Button>
      </section>
    )
  return (
    <section aria-label="Role-play" className="flex flex-col gap-4">
      <p className="text-muted">{scenario.roleplay.intro}</p>
      <ScriptedPartner key={round} script={script} onFinished={setOpen} />
      <PairSessionList sessions={sessions} onOpen={setOpen} assessed={false} />
    </section>
  )
}

type Part = 'phrases' | 'dialogue' | 'roleplay'

const PARTS: { id: Part; name: string }[] = [
  { id: 'phrases', name: 'Phrases' },
  { id: 'dialogue', name: 'Dialogue' },
  { id: 'roleplay', name: 'Role-play' },
]

export function ScenarioScreen() {
  const { scenarioId = '' } = useParams()
  const offered = useAsync(
    async () =>
      (await loadScenarios()).find((s) => s.scenario.id === scenarioId) ?? null,
    scenarioId,
  )
  const [part, setPart] = useState<Part>('phrases')
  const value = offered.status === 'ready' ? offered.value : null

  return (
    <Screen title={value ? value.scenario.title : 'Everyday'} back="/everyday">
      {offered.status === 'loading' && <Loading />}
      {offered.status === 'error' && (
        <EmptyState
          title="This scenario could not be opened"
          description={offered.message}
        />
      )}
      {offered.status === 'ready' && !value && (
        <EmptyState
          title="There is no such scenario"
          description="It may not be checked by a reviewer yet."
        />
      )}
      {value && (
        <>
          {value.scenario.status === 'draft' && (
            <p className="self-start rounded-full border border-warning px-3 py-0.5 text-xs text-warning">
              Draft – not yet checked by a reviewer
            </p>
          )}
          <p className="text-muted">{value.scenario.about}</p>
          <div role="group" aria-label="Part" className="flex gap-2">
            {PARTS.map((p) => (
              <Chip
                key={p.id}
                selected={part === p.id}
                onClick={() => setPart(p.id)}
              >
                {p.name}
              </Chip>
            ))}
          </div>
          {/* All parts stay mounted, so answers, the clip and a recording in
              progress survive switching between them. */}
          <div hidden={part !== 'phrases'}>
            <Phrases offered={value} />
          </div>
          <div hidden={part !== 'dialogue'}>
            <Dialogue offered={value} />
          </div>
          <div hidden={part !== 'roleplay'}>
            <RolePlay offered={value} />
          </div>
        </>
      )}
    </Screen>
  )
}
