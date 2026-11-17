import {
  ContentManifest,
  ReadingPack,
  type Level,
  type PackSummary,
  type Skill,
} from '../domain/content/schema'

// Content is static JSON next to the app, cached by the service worker. It is
// checked again here, so a damaged file shows an error instead of a broken drill.

const url = (path: string) => `${import.meta.env.BASE_URL}content/${path}`

async function getJson(path: string): Promise<unknown> {
  const response = await fetch(url(path))
  if (!response.ok)
    throw new Error(`content/${path} answered ${response.status}`)
  return response.json()
}

let manifest: Promise<ContentManifest> | null = null

export function loadManifest(): Promise<ContentManifest> {
  manifest ??= getJson('manifest.json').then((raw) =>
    ContentManifest.parse(raw),
  )
  // A failed load is not kept, so the next screen can try again.
  manifest.catch(() => {
    manifest = null
  })
  return manifest
}

export async function listPacks(
  level: Level,
  skill: Skill,
): Promise<PackSummary[]> {
  const { packs } = await loadManifest()
  return packs.filter((p) => p.level === level && p.skill === skill)
}

export async function loadReadingPack(id: string): Promise<ReadingPack> {
  const summary = (await loadManifest()).packs.find((p) => p.id === id)
  if (!summary) throw new Error(`There is no pack called ${id}`)
  return ReadingPack.parse(await getJson(summary.file))
}
