// Validates every content source and compiles the shipped packs into
// public/content/, with the audio of shipped clips and words in public/audio/.
// Fails with a list of every problem, so a broken pack can never reach a
// build. Set INCLUDE_DRAFTS=1 to ship unreviewed content, for development and
// preview builds only.
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
  audioHash,
  clipSource,
  publishedAudioPath,
  readAudioSources,
  readGrammarSources,
  readWritingSources,
  speakingSource,
  pairAudio,
  scenarioAudio,
  readLock,
  sourceAudioFile,
  wordSource,
  type AudioSource,
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
const audio = await readAudioSources()
packs.push(
  ...audio.listening,
  ...audio.vocab,
  ...audio.speaking,
  ...audio.everyday,
)
problems.push(...audio.problems)
for (const read of [readGrammarSources, readWritingSources]) {
  const sources = await read()
  packs.push(...sources.packs)
  problems.push(...sources.problems)
}
problems.push(...packProblems(packs))

const shipped = publishable(packs, includeDrafts)

// Every clip and word needs audio made from its current words, and every
// audio file a source: a stale or stray file means a learner hears the wrong thing.
const lock = await readLock()
for (const source of audio.sources) {
  if (!existsSync(sourceAudioFile(source.id)))
    problems.push(`${source.id}: no audio. Run npm run audio.`)
  else if (lock[source.id] !== audioHash(source))
    problems.push(
      `${source.id}: the audio is out of date with the text. Run npm run audio.`,
    )
}
const sourceIds = new Set(audio.sources.map((s) => s.id))
for (const file of existsSync(AUDIO_DIR) ? await readdir(AUDIO_DIR) : [])
  if (file.endsWith('.m4a') && !sourceIds.has(file.slice(0, -4)))
    problems.push(`content/audio/${file}: nothing uses it. Run npm run audio.`)

if (problems.length) {
  console.error(`Content has ${problems.length} problem(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

await rm(OUT, { recursive: true, force: true })
await mkdir(join(OUT, 'packs'), { recursive: true })
// Only the audio of shipped content is published, under names that change
// whenever the audio does.
await rm(PUBLIC_AUDIO_DIR, { recursive: true, force: true })
await mkdir(PUBLIC_AUDIO_DIR, { recursive: true })

/** Publishes the audio of these sources; maps each unit id to its address. */
async function publishAudio(
  units: { id: string; source: AudioSource }[],
): Promise<{ paths: Record<string, string>; bytes: number }> {
  const paths: Record<string, string> = {}
  let bytes = 0
  for (const { id, source } of units) {
    const path = publishedAudioPath(source.id, audioHash(source))
    await copyFile(sourceAudioFile(source.id), join(ROOT, 'public', path))
    paths[id] = path
    bytes += statSync(sourceAudioFile(source.id)).size
  }
  return { paths, bytes }
}

const manifest: ContentManifest = {
  format: 'sfi-content',
  builtAt: new Date().toISOString(),
  packs: [],
}
for (const pack of shipped) {
  const file = `packs/${pack.id}.json`
  const units = packUnits(pack)
  const published =
    pack.skill === 'hora'
      ? await publishAudio(
          pack.clips.map((c) => ({ id: c.id, source: clipSource(c) })),
        )
      : pack.skill === 'ord'
        ? await publishAudio(
            pack.words.map((w) => ({ id: w.id, source: wordSource(w) })),
          )
        : pack.skill === 'tala'
          ? await publishAudio([
              ...pack.tasks.map((t) => ({
                id: t.id,
                source: speakingSource(t),
              })),
              ...pack.pairs.flatMap((topic) =>
                pairAudio(topic).map((a) => ({ id: a.key, source: a.source })),
              ),
            ])
          : pack.skill === 'vardag'
            ? await publishAudio(
                pack.scenarios.flatMap((s) =>
                  scenarioAudio(s).map((a) => ({
                    id: a.key,
                    source: a.source,
                  })),
                ),
              )
            : null
  await writeFile(
    join(OUT, file),
    JSON.stringify(published ? { ...pack, audio: published.paths } : pack),
  )
  manifest.packs.push({
    id: pack.id,
    version: pack.version,
    level: pack.level,
    skill: pack.skill,
    title: pack.title,
    unitCount: units.length,
    itemCount:
      pack.skill === 'ord' ||
      pack.skill === 'skriva' ||
      pack.skill === 'tala' ||
      pack.skill === 'vardag'
        ? units.length
        : units.reduce((n, u) => n + u.items.length, 0),
    hasDrafts: units.some((u) => u.status === 'draft'),
    file,
    ...(published && {
      audio: { files: Object.values(published.paths), bytes: published.bytes },
    }),
  })
}
await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))

const drafts = packs
  .flatMap((p) => packUnits(p))
  .filter((u) => u.status === 'draft').length
console.log(
  `content: ${packs.length} pack(s) checked, ${shipped.length} shipped` +
    (includeDrafts ? ' with drafts' : `, ${drafts} draft item(s) held back`),
)
const missing = uncoveredPoints(packs)
if (missing.length)
  console.log(
    `content: ${missing.length} KP27 point(s) have no items yet: ${missing.join(', ')}`,
  )
