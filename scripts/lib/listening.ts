// Shared by the audio and content builds: reading the listening sources and
// the fingerprint that ties a clip's audio to the words it says.
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import {
  ListeningPack,
  VocabPack,
  type Line,
  type ListeningClip,
  type Voice,
  type Word,
} from '../../src/domain/content/schema.ts'

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))
export const LISTENING_SOURCES = join(ROOT, 'content/listening')
export const VOCAB_SOURCES = join(ROOT, 'content/vocab')
/** Where the made audio is kept, committed: one `<clip id>.m4a` per clip. */
export const AUDIO_DIR = join(ROOT, 'content/audio')
/** Where the build publishes the audio of shipped clips (generated). */
export const PUBLIC_AUDIO_DIR = join(ROOT, 'public/audio')
export const AUDIO_LOCK = join(ROOT, 'content/audio.lock.json')

/** Bump when the voices, encoding or pauses change, so all audio is remade. */
export const SYNTH_VERSION = 'piper-1.8.0/medium/aac-48k-mono/v1'

/** Something that gets audio: a listening clip, or a word. */
export interface AudioSource {
  /** The audio file's name without `.m4a`, unique across all sources. */
  id: string
  kind: string
  lines: Line[]
}

export const clipSource = (clip: ListeningClip): AudioSource => clip

/** The voice that reads single words. */
export const WORD_VOICE: Voice = 'alma'

/** A word is read once, in the form its card shows (or its `say`). */
export const wordSource = (word: Word): AudioSource => ({
  id: `ord-${word.id}`,
  kind: 'ord',
  lines: [{ voice: WORD_VOICE, text: word.forms[0]!, say: word.say }],
})

/** The fingerprint of what a source's audio says and how it was made. */
export function audioHash(source: Pick<AudioSource, 'kind' | 'lines'>): string {
  const spoken = source.lines.map((l) => ({
    voice: l.voice,
    say: l.say ?? l.text,
  }))
  return createHash('sha256')
    .update(JSON.stringify({ synth: SYNTH_VERSION, kind: source.kind, spoken }))
    .digest('hex')
    .slice(0, 16)
}

/** A listening clip's fingerprint, which is its source's. */
export const clipHash = (clip: ListeningClip) => audioHash(clip)

export type AudioLock = Record<string, string>

export async function readLock(): Promise<AudioLock> {
  try {
    return JSON.parse(await readFile(AUDIO_LOCK, 'utf8')) as AudioLock
  } catch {
    return {}
  }
}

interface Parser<T> {
  safeParse(raw: unknown):
    | { success: true; data: T }
    | {
        success: false
        error: { issues: { path: PropertyKey[]; message: string }[] }
      }
}

/** Every YAML pack in a folder, parsed; problems are returned, not thrown. */
async function readPacks<T>(
  dir: string,
  schema: Parser<T>,
): Promise<{ packs: T[]; problems: string[] }> {
  const packs: T[] = []
  const problems: string[] = []
  let files: string[]
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith('.yaml')).sort()
  } catch {
    return { packs, problems }
  }
  for (const file of files) {
    const raw: unknown = parse(await readFile(join(dir, file), 'utf8'))
    const result = schema.safeParse(raw)
    if (result.success) packs.push(result.data)
    else
      for (const issue of result.error.issues)
        problems.push(`${file}: ${issue.path.join('.')}: ${issue.message}`)
  }
  return { packs, problems }
}

export const readListeningSources = () =>
  readPacks<ListeningPack>(LISTENING_SOURCES, ListeningPack)

export const readVocabSources = () =>
  readPacks<VocabPack>(VOCAB_SOURCES, VocabPack)

/** Every audio source of every pack, drafts included. */
export async function readAudioSources(): Promise<{
  sources: AudioSource[]
  listening: ListeningPack[]
  vocab: VocabPack[]
  problems: string[]
}> {
  const l = await readListeningSources()
  const v = await readVocabSources()
  const sources = [
    ...l.packs.flatMap((p) => p.clips.map(clipSource)),
    ...v.packs.flatMap((p) => p.words.map(wordSource)),
  ]
  const problems = [...l.problems, ...v.problems]
  // Clip ids and word audio ids ("ord-…") share one folder of files.
  const seen = new Set<string>()
  for (const s of sources) {
    if (seen.has(s.id)) problems.push(`audio ${s.id} is made by two sources`)
    seen.add(s.id)
  }
  return { sources, listening: l.packs, vocab: v.packs, problems }
}

/** The made audio of a clip, in content/audio/. */
export const sourceAudioFile = (clipId: string) =>
  join(AUDIO_DIR, `${clipId}.m4a`)

/** Where the app finds a clip's audio, relative to its base. */
export const publishedAudioPath = (clipId: string, hash: string) =>
  `audio/${clipId}-${hash}.m4a`

/** The PCM data of a 16-bit mono WAV file. */
export interface Pcm {
  sampleRate: number
  samples: Buffer // 16-bit little-endian mono
}

export function readWav(file: Buffer): Pcm {
  if (
    file.toString('ascii', 0, 4) !== 'RIFF' ||
    file.toString('ascii', 8, 12) !== 'WAVE'
  )
    throw new Error('not a WAV file')
  let offset = 12
  let sampleRate = 0
  while (offset + 8 <= file.length) {
    const id = file.toString('ascii', offset, offset + 4)
    const size = file.readUInt32LE(offset + 4)
    if (id === 'fmt ') {
      const format = file.readUInt16LE(offset + 8)
      const channels = file.readUInt16LE(offset + 10)
      const bits = file.readUInt16LE(offset + 22)
      if (format !== 1 || channels !== 1 || bits !== 16)
        throw new Error('expected 16-bit mono PCM')
      sampleRate = file.readUInt32LE(offset + 12)
    }
    if (id === 'data') {
      if (!sampleRate) throw new Error('WAV data comes before its format')
      return {
        sampleRate,
        samples: file.subarray(offset + 8, offset + 8 + size),
      }
    }
    // Chunks are padded to an even length.
    offset += 8 + size + (size & 1)
  }
  throw new Error('WAV file has no data')
}

export function writeWav({ sampleRate, samples }: Pcm): Buffer {
  const header = Buffer.alloc(44)
  header.write('RIFF', 0, 'ascii')
  header.writeUInt32LE(36 + samples.length, 4)
  header.write('WAVEfmt ', 8, 'ascii')
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(sampleRate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36, 'ascii')
  header.writeUInt32LE(samples.length, 40)
  return Buffer.concat([header, samples])
}

/** Silence of the given length, as 16-bit samples. */
export const silence = (sampleRate: number, seconds: number) =>
  Buffer.alloc(Math.round(sampleRate * seconds) * 2)
