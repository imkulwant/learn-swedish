// Audio is kept by the service worker for offline use (see vite.config.ts).
// These helpers check for it, fetch a whole set ahead of time, and drop files
// the app no longer uses. File names change whenever their audio does, so a
// stored file is never out of date, only unused.

/** The cache the service worker keeps audio in. Must match vite.config.ts. */
export const AUDIO_CACHE = 'sfi-audio-v1'

const cachesApi = (): CacheStorage | undefined =>
  typeof caches === 'undefined' ? undefined : caches

/** How many of these addresses are stored for offline use. Throws if the device cannot store any. */
export async function countCached(urls: string[]): Promise<number> {
  const api = cachesApi()
  if (!api) throw new Error('This browser cannot store audio for offline use.')
  const cache = await api.open(AUDIO_CACHE)
  const found = await Promise.all(urls.map((url) => cache.match(url)))
  return found.filter(Boolean).length
}

export interface StoreResult {
  /** Files that could not be fetched. */
  failed: number
  /** True when the device ran out of space. */
  full: boolean
}

/**
 * Stores every address for offline use. Fetches go straight into the cache,
 * so this works before the service worker controls the page too.
 */
export async function storeAll(urls: string[]): Promise<StoreResult> {
  const api = cachesApi()
  if (!api) return { failed: urls.length, full: false }
  const cache = await api.open(AUDIO_CACHE)
  let failed = 0
  for (const url of urls) {
    try {
      if (await cache.match(url)) continue
      const response = await fetch(url)
      if (!response.ok) throw new Error(String(response.status))
      await cache.put(url, response)
    } catch (error) {
      if ((error as { name?: string })?.name === 'QuotaExceededError')
        return { failed: failed + 1, full: true }
      failed++
    }
  }
  return { failed, full: false }
}

/** Removes stored audio that is not in `keep` (full addresses). */
export async function pruneAudio(keep: string[]): Promise<void> {
  const api = cachesApi()
  if (!api || !(await api.has(AUDIO_CACHE))) return
  const wanted = new Set(keep.map((url) => new URL(url, location.href).href))
  const cache = await api.open(AUDIO_CACHE)
  for (const request of await cache.keys())
    if (!wanted.has(request.url)) await cache.delete(request)
}
