// Validates every content source and compiles the shipped packs into
// public/content/. Fails with a list of every problem, so a broken pack can
// never reach a build. Set INCLUDE_DRAFTS=1 to ship unreviewed texts, for
// development and preview builds only.
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import {
  ReadingPack,
  type ContentManifest,
} from '../src/domain/content/schema.ts'
import {
  packProblems,
  publishable,
  uncoveredPoints,
} from '../src/domain/content/validate.ts'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const SOURCES = join(ROOT, 'content/reading')
const OUT = join(ROOT, 'public/content')
const includeDrafts = process.env.INCLUDE_DRAFTS === '1'

const problems: string[] = []
const packs: ReadingPack[] = []

for (const file of (await readdir(SOURCES))
  .filter((f) => f.endsWith('.yaml'))
  .sort()) {
  const raw: unknown = parse(await readFile(join(SOURCES, file), 'utf8'))
  const result = ReadingPack.safeParse(raw)
  if (result.success) packs.push(result.data)
  else
    for (const issue of result.error.issues)
      problems.push(`${file}: ${issue.path.join('.')}: ${issue.message}`)
}
problems.push(...packProblems(packs))

if (problems.length) {
  console.error(`Content has ${problems.length} problem(s):`)
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

const shipped = publishable(packs, includeDrafts)
await rm(OUT, { recursive: true, force: true })
await mkdir(join(OUT, 'packs'), { recursive: true })

const manifest: ContentManifest = {
  format: 'sfi-content',
  builtAt: new Date().toISOString(),
  packs: [],
}
for (const pack of shipped) {
  const file = `packs/${pack.id}.json`
  await writeFile(join(OUT, file), JSON.stringify(pack))
  manifest.packs.push({
    id: pack.id,
    version: pack.version,
    level: pack.level,
    skill: pack.skill,
    title: pack.title,
    textCount: pack.texts.length,
    itemCount: pack.texts.reduce((n, t) => n + t.items.length, 0),
    hasDrafts: pack.texts.some((t) => t.status === 'draft'),
    file,
  })
}
await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))

const drafts = packs
  .flatMap((p) => p.texts)
  .filter((t) => t.status === 'draft').length
console.log(
  `content: ${packs.length} pack(s) checked, ${shipped.length} shipped` +
    (includeDrafts ? ' with drafts' : `, ${drafts} draft text(s) held back`),
)
const missing = uncoveredPoints(packs)
if (missing.length)
  console.log(
    `content: ${missing.length} KP27 point(s) have no items yet: ${missing.join(', ')}`,
  )
