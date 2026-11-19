import { appUrl } from '../../data/content'
import type { ListeningClip } from '../../domain/content/schema'
import { AudioPlayer } from './AudioPlayer'

/**
 * One clip as on the test: the instruction and the audio. The transcript
 * appears once every question is answered, to check what was heard.
 */
export function ListeningClipView({
  clip,
  audioPath,
  answeredAll,
}: {
  clip: ListeningClip
  /** Where the clip's audio is served, from the compiled pack. */
  audioPath: string
  answeredAll: boolean
}) {
  return (
    <article className="flex flex-col gap-3">
      {clip.status === 'draft' && (
        <p className="self-start rounded-full border border-warning px-3 py-0.5 text-xs text-warning">
          Draft – not yet checked by a reviewer
        </p>
      )}
      <p lang="sv" className="italic text-muted">
        {clip.instruction}
      </p>
      <AudioPlayer src={appUrl(audioPath)} label={clip.title} />
      {answeredAll ? (
        <details className="rounded-card border border-border bg-surface p-4">
          <summary className="tap-target flex items-center font-semibold">
            Transcript
          </summary>
          <div lang="sv" className="mt-2 flex flex-col gap-2">
            {clip.lines.map((line, i) => (
              <p key={i}>
                {line.speaker && (
                  <span className="font-semibold text-accent-fg">
                    {line.speaker}:{' '}
                  </span>
                )}
                {line.text}
              </p>
            ))}
          </div>
        </details>
      ) : (
        <p className="text-sm text-muted">
          Answer while you listen. The transcript opens when you are done.
        </p>
      )}
    </article>
  )
}
