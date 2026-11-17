// Shared by the audio and content builds: reading the listening sources and
// the fingerprint that ties a clip's audio to the words it says.
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import {
  ListeningPack,
  type ListeningClip,
} from '../../src/domain/content/schema.ts'

export const ROOT = fileURLToPath(new URL('../../', import.meta.url))
export const LISTENING_SOURCES = join(ROOT, 'content/listening')
/** Where the made audio is kept, committed: one `<clip id>.m4a` per clip. */
export const AUDIO_DIR = join(ROOT, 'content/audio')
/** Where the build publishes the audio of shipped clips (generated). */
export const PUBLIC_AUDIO_DIR = join(ROOT, 'public/audio')
export const AUDIO_LOCK = join(ROOT, 'content/audio.lock.json')

/** Bump when the voices, encoding or pauses change, so all audio is remade. */
export const SYNTH_VERSION = 'piper-1.8.0/medium/aac-48k-mono/v1'

/** The fingerprint of what a clip's audio says and how it was made. */
export function clipHash(clip: ListeningClip): string {
  const spoken = clip.lines.map((l) => ({
    voice: l.voice,
    say: l.say ?? l.text,
  }))
  return createHash('sha256')
    .update(JSON.stringify({ synth: SYNTH_VERSION, kind: clip.kind, spoken }))
    .digest('hex')
    .slice(0, 16)
}

export type AudioLock = Record<string, string>

export async function readLock(): Promise<AudioLock> {
  try {
    return JSON.parse(await readFile(AUDIO_LOCK, 'utf8')) as AudioLock
  } catch {
    return {}
  }
}

/** Every listening source, parsed; problems are returned, not thrown. */
export async function readListeningSources(): Promise<{
  packs: ListeningPack[]
  problems: string[]
}> {
  const packs: ListeningPack[] = []
  const problems: string[] = []
  let files: string[]
  try {
    files = (await readdir(LISTENING_SOURCES))
      .filter((f) => f.endsWith('.yaml'))
      .sort()
  } catch {
    return { packs, problems }
  }
  for (const file of files) {
    const raw: unknown = parse(
      await readFile(join(LISTENING_SOURCES, file), 'utf8'),
    )
    const result = ListeningPack.safeParse(raw)
    if (result.success) packs.push(result.data)
    else
      for (const issue of result.error.issues)
        problems.push(`${file}: ${issue.path.join('.')}: ${issue.message}`)
  }
  return { packs, problems }
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
