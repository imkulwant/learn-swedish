import type { Word } from '../../domain/content/schema'
import type { CardDirection } from '../../domain/types'
import { WordAudio } from './WordAudio'

const PROMPT: Record<CardDirection, string> = {
  'sv-en': 'What does it mean?',
  audio: 'Listen. What does it mean?',
  'en-sv': 'How do you say it in Swedish?',
}

const FORM_LABELS: Record<Word['pos'], string[]> = {
  noun: ['singular', 'definite', 'plural', 'definite plural'],
  verb: ['infinitive', 'present', 'past', 'supine', 'imperative'],
  adjective: ['en word', 'ett word', 'plural / definite'],
  phrase: ['phrase'],
}

/** One side or both sides of a word card. */
export function WordCard({
  word,
  direction,
  audioPath,
  revealed,
}: {
  word: Word
  direction: CardDirection
  audioPath: string
  revealed: boolean
}) {
  const swedish = (
    <p lang="sv" className="text-3xl font-bold">
      {word.forms[0]}
    </p>
  )
  const english = <p className="text-2xl font-semibold">{word.en}</p>
  const listen = (
    <WordAudio
      path={audioPath}
      label={`Listen to ${direction === 'audio' && !revealed ? 'the word' : word.forms[0]}`}
    />
  )

  return (
    <section
      aria-label="Word card"
      className="flex flex-col items-center gap-4 rounded-card border border-border bg-surface p-6 text-center"
    >
      <p className="text-sm text-muted">{PROMPT[direction]}</p>
      {direction === 'sv-en' && (
        <>
          {swedish}
          {listen}
        </>
      )}
      {direction === 'audio' && listen}
      {direction === 'en-sv' && english}

      {revealed && (
        <div className="flex w-full flex-col items-center gap-3 border-t border-border pt-4">
          {direction !== 'sv-en' && swedish}
          {direction !== 'en-sv' && english}
          {direction === 'en-sv' && listen}
          <dl
            lang="sv"
            className="grid w-full grid-cols-2 gap-x-3 gap-y-1 text-left text-sm"
          >
            {word.forms.map((form, i) => (
              <div key={i} className="contents">
                <dt lang="en" className="text-muted">
                  {FORM_LABELS[word.pos][i]}
                </dt>
                <dd>{form}</dd>
              </div>
            ))}
          </dl>
          <div className="w-full rounded-control bg-surface-2 p-3 text-left">
            <p lang="sv">{word.example.sv}</p>
            <p className="text-sm text-muted">{word.example.en}</p>
          </div>
        </div>
      )}
    </section>
  )
}
