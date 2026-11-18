import { useLiveQuery } from 'dexie-react-hooks'
import { loadPrompts, type OfferedPrompt } from '../../data/content'
import { latestWriting } from '../../data/repositories/writings'
import { LEVELS } from '../../domain/content/schema'
import { useAsync } from '../../ui/useAsync'

/** One prompt, looked up in the packs of every level. */
export function usePrompt(promptId: string) {
  return useAsync(async (): Promise<OfferedPrompt | null> => {
    const all = (await Promise.all(LEVELS.map(loadPrompts))).flat()
    return all.find((p) => p.prompt.id === promptId) ?? null
  }, promptId)
}

/**
 * The latest stored text for a prompt. Undefined while loading; `writing` is
 * undefined when nothing has been written yet.
 */
export const useLatestWriting = (promptId: string) =>
  useLiveQuery(
    async () => ({ writing: await latestWriting(promptId) }),
    [promptId],
  )
