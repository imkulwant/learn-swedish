// Turns every listening clip into speech with Piper and keeps it as
// content/audio/<clip id>.m4a, committed. Runs on the author's Mac only (it
// needs Piper in .tools/ and macOS afconvert), so CI and the content build
// never need it. Run scripts/setup-audio.sh once first.
//
// A clip is remade only when its words, voices or SYNTH_VERSION change. Each
// clip's lock entry is written as soon as its audio is in place, so a run that
// fails halfway leaves a lock that matches the files.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ListeningClip, Voice } from '../src/domain/content/schema.ts'
import { packProblems } from '../src/domain/content/validate.ts'
import {
  AUDIO_DIR,
  AUDIO_LOCK,
  ROOT,
  clipHash,
  readListeningSources,
  readLock,
  readWav,
  silence,
  sourceAudioFile,
  writeWav,
  type AudioLock,
} from './lib/listening.ts'

const PIPER = join(ROOT, '.tools/piper-venv/bin/piper')
const voiceModel = (voice: Voice) =>
  join(ROOT, `.tools/voices/sv_SE-${voice}-medium.onnx`)

// Seconds of silence: before the first line, between lines of one voice,
// when the voice changes, and after the last line.
const LEAD_IN = 0.4
const SAME_SPEAKER = 0.35
const NEW_SPEAKER = 0.7

function run(command: string, args: string[], input?: string) {
  const result = spawnSync(command, args, { input, encoding: 'utf8' })
  if (result.status !== 0)
    throw new Error(
      `${command} failed: ${result.stderr || result.error?.message}`,
    )
}

/** Makes the clip's audio in `work`, then moves it into place in one step. */
async function synthesize(clip: ListeningClip, work: string): Promise<void> {
  const parts: Buffer[] = []
  let rate = 0
  for (const [i, line] of clip.lines.entries()) {
    const wav = join(work, `${i}.wav`)
    // Text goes in on stdin, never through a shell.
    run(PIPER, ['-m', voiceModel(line.voice), '-f', wav], line.say ?? line.text)
    const pcm = readWav(await readFile(wav))
    rate ||= pcm.sampleRate
    if (pcm.sampleRate !== rate) throw new Error('voices differ in sample rate')
    const gap =
      i === 0
        ? LEAD_IN
        : line.voice === clip.lines[i - 1]!.voice
          ? SAME_SPEAKER
          : NEW_SPEAKER
    parts.push(silence(rate, gap), pcm.samples)
  }
  parts.push(silence(rate, LEAD_IN))
  const joined = join(work, 'clip.wav')
  await writeFile(
    joined,
    writeWav({ sampleRate: rate, samples: Buffer.concat(parts) }),
  )
  const encoded = join(work, 'clip.m4a')
  run('afconvert', [
    '-f',
    'm4af',
    '-d',
    'aac',
    '-b',
    '48000',
    '-c',
    '1',
    joined,
    encoded,
  ])
  await rename(encoded, sourceAudioFile(clip.id))
}

const sortedLock = (lock: AudioLock) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(lock).sort(([a], [b]) => a.localeCompare(b)),
    ),
    null,
    2,
  ) + '\n'

if (!existsSync(PIPER)) {
  console.error('Piper is not set up. Run scripts/setup-audio.sh first.')
  process.exit(1)
}

const { packs, problems } = await readListeningSources()
problems.push(...packProblems(packs))
if (problems.length) {
  console.error(
    `Listening content has problems:\n  - ${problems.join('\n  - ')}`,
  )
  process.exit(1)
}

await mkdir(AUDIO_DIR, { recursive: true })
const lock = await readLock()
const clips = packs.flatMap((p) => p.clips)
let made = 0
for (const clip of clips) {
  const hash = clipHash(clip)
  if (lock[clip.id] === hash && existsSync(sourceAudioFile(clip.id))) continue
  // The old entry goes first: if this clip fails, it is not taken as current.
  delete lock[clip.id]
  await writeFile(AUDIO_LOCK, sortedLock(lock))
  const work = await mkdtemp(join(tmpdir(), 'sfi-audio-'))
  try {
    await synthesize(clip, work)
  } finally {
    await rm(work, { recursive: true, force: true })
  }
  lock[clip.id] = hash
  await writeFile(AUDIO_LOCK, sortedLock(lock))
  made++
  console.log(`audio: made ${clip.id}.m4a`)
}

// Audio and lock entries of clips that no longer exist are removed.
const ids = new Set(clips.map((c) => c.id))
for (const id of Object.keys(lock)) if (!ids.has(id)) delete lock[id]
for (const file of await readdir(AUDIO_DIR))
  if (file.endsWith('.m4a') && !ids.has(file.slice(0, -4))) {
    await rm(join(AUDIO_DIR, file))
    console.log(`audio: removed ${file}, which no clip uses`)
  }
await writeFile(AUDIO_LOCK, sortedLock(lock))
console.log(`audio: ${made} clip(s) made, ${clips.length - made} up to date`)
