import {
  CompiledListeningPack,
  ContentManifest,
  ReadingPack,
  type Level,
  type PackSummary,
  type Skill,
} from '../domain/content/schema'
import { pruneAudio } from '../platform/audioCache'

// Content is static JSON next to the app, cached by the service worker. It is
// checked again here, so a damaged file shows an error instead of a broken drill.

/** The full address of a file the app serves, such as a clip's audio. */
export const appUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(appUrl(`content/${path}`))
  if (!response.ok)
    throw new Error(`content/${path} answered ${response.status}`)
  return response.json()
}

let manifest: Promise<ContentManifest> | null = null

export function loadManifest(): Promise<ContentManifest> {
  if (!manifest) {
    manifest = getJson('manifest.json').then((raw) => {
      const parsed = ContentManifest.parse(raw)
      // Audio of clips that changed or left the app is dropped from storage.
      void pruneAudio(
        parsed.packs.flatMap((p) => p.audio?.files ?? []).map(appUrl),
      ).catch(() => {})
      return parsed
    })
    // A failed load is not kept, so the next screen can try again.
    manifest.catch(() => {
      manifest = null
    })
  }
  return manifest
}

export async function listPacks(
  level: Level,
  skill: Skill,
): Promise<PackSummary[]> {
  const { packs } = await loadManifest()
  return packs.filter((p) => p.level === level && p.skill === skill)
}

async function packFile(id: string, skill: Skill): Promise<unknown> {
  const summary = (await loadManifest()).packs.find(
    (p) => p.id === id && p.skill === skill,
  )
  if (!summary) throw new Error(`There is no pack called ${id} here.`)
  return getJson(summary.file)
}

export async function loadReadingPack(id: string): Promise<ReadingPack> {
  return ReadingPack.parse(await packFile(id, 'lasa'))
}

export async function loadListeningPack(
  id: string,
): Promise<CompiledListeningPack> {
  return CompiledListeningPack.parse(await packFile(id, 'hora'))
}
