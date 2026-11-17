// Validates every content source and compiles the shipped packs into
// public/content/. Fails with a list of every problem, so a broken pack can
// never reach a build. Set INCLUDE_DRAFTS=1 to ship unreviewed texts and
// clips, for development and preview builds only.
import { existsSync, statSync } from 'node:fs'
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'
import {
  ReadingPack,
  type CompiledListeningPack,
  type ContentManifest,
} from '../src/domain/content/schema.ts'
import {
  packProblems,
  packUnits,
  publishable,
  uncoveredPoints,
  type Pack,
} from '../src/domain/content/validate.ts'
import {
  AUDIO_DIR,
  PUBLIC_AUDIO_DIR,
  ROOT,
  clipHash,
  publishedAudioPath,
  readListeningSources,
  readLock,
  sourceAudioFile,
} from './lib/listening.ts'

const READING_SOURCES = join(ROOT, 'content/reading')
const OUT = join(ROOT, 'public/content')
const includeDrafts = process.env.INCLUDE_DRAFTS === '1'

const problems: string[] = []
const packs: Pack[] = []

for (const file of (await readdir(READING_SOURCES))
  .filter((f) => f.endsWith('.yaml'))
  .sort()) {
  const raw: unknown = parse(
    await readFile(join(READING_SOURCES, file), 'utf8'),
  )
  const result = ReadingPack.safeParse(raw)
  if (result.success) packs.push(result.data)
  else
    for (const issue of result.error.issues)
      problems.push(`${file}: ${issue.path.join('.')}: ${issue.message}`)
}
const listening = await readListeningSources()
packs.push(...listening.packs)
problems.push(...listening.problems)
problems.push(...packProblems(packs))

const shipped = publishable(packs, includeDrafts)

// Every clip needs audio made from its current words, and every audio file a
// clip: a stale or stray file would mean a learner hears the wrong thing.
const lock = await readLock()
const allClips = packs.flatMap((p) => (p.skill === 'hora' ? p.clips : []))
for (const clip of allClips) {
  if (!existsSync(sourceAudioFile(clip.id)))
    problems.push(`${clip.id}: no audio. Run npm run audio.`)
  else if (lock[clip.id] !== clipHash(clip))
    problems.push(
      `${clip.id}: the audio is out of date with the text. Run npm run audio.`,
    )
}
const clipIds = new Set(allClips.map((c) => c.id))
for (const file of existsSync(AUDIO_DIR) ? await readdir(AUDIO_DIR) : [])
  if (file.endsWith('.m4a') && !clipIds.has(file.slice(0, -4)))
    problems.push(`content/audio/${file}: no clip uses it. Run npm run audio.`)

if (problems.length) {
  console.error(`Content has ${problems.length} problem(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

await rm(OUT, { recursive: true, force: true })
await mkdir(join(OUT, 'packs'), { recursive: true })
// Only the audio of shipped clips is published, under names that change
// whenever the audio does.
await rm(PUBLIC_AUDIO_DIR, { recursive: true, force: true })
await mkdir(PUBLIC_AUDIO_DIR, { recursive: true })

const manifest: ContentManifest = {
  format: 'sfi-content',
  builtAt: new Date().toISOString(),
  packs: [],
}
for (const pack of shipped) {
  const file = `packs/${pack.id}.json`
  const units = packUnits(pack)
  let compiled: Pack | CompiledListeningPack = pack
  let audio: { files: string[]; bytes: number } | undefined
  if (pack.skill === 'hora') {
    const paths = Object.fromEntries(
      pack.clips.map((c) => [c.id, publishedAudioPath(c.id, clipHash(c))]),
    )
    for (const clip of pack.clips)
      await copyFile(
        sourceAudioFile(clip.id),
        join(ROOT, 'public', paths[clip.id]!),
      )
    compiled = { ...pack, audio: paths }
    audio = {
      files: Object.values(paths),
      bytes: pack.clips.reduce(
        (n, c) => n + statSync(sourceAudioFile(c.id)).size,
        0,
      ),
    }
  }
  await writeFile(join(OUT, file), JSON.stringify(compiled))
  manifest.packs.push({
    id: pack.id,
    version: pack.version,
    level: pack.level,
    skill: pack.skill,
    title: pack.title,
    unitCount: units.length,
    itemCount: units.reduce((n, u) => n + u.items.length, 0),
    hasDrafts: units.some((u) => u.status === 'draft'),
    file,
    ...(audio && { audio }),
  })
}
await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))

const drafts = packs
  .flatMap((p) => packUnits(p))
  .filter((u) => u.status === 'draft').length
console.log(
  `content: ${packs.length} pack(s) checked, ${shipped.length} shipped` +
    (includeDrafts
      ? ' with drafts'
      : `, ${drafts} draft text(s) and clip(s) held back`),
)
const missing = uncoveredPoints(packs)
if (missing.length)
  console.log(
    `content: ${missing.length} KP27 point(s) have no items yet: ${missing.join(', ')}`,
  )
