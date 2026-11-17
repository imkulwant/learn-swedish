import { describe, expect, it } from 'vitest'
import type { ListeningClip } from '../../src/domain/content/schema.ts'
import {
  clipHash,
  publishedAudioPath,
  readWav,
  silence,
  writeWav,
} from './listening.ts'

const clip = (): ListeningClip => ({
  id: 'c',
  status: 'draft',
  kp27: ['lyssna-lasa.strategier'],
  theme: 'trafik',
  kind: 'dialog',
  instruction: 'Lyssna.',
  title: 'C',
  lines: [
    {
      voice: 'nst',
      speaker: 'A',
      text: 'Klockan 9.15.',
      say: 'Klockan kvart över nio.',
    },
    { voice: 'alma', speaker: 'B', text: 'Bra.' },
  ],
  items: [
    {
      type: 'mc',
      id: 'i',
      prompt: '?',
      options: ['a', 'b'],
      answer: 0,
      explain: '-',
    },
  ],
})

describe('clipHash', () => {
  it('changes when anything that is heard changes', () => {
    const base = clipHash(clip())
    const said = clip()
    said.lines[0]!.say = 'Klockan nio och femton.'
    const voice = clip()
    voice.lines[1]!.voice = 'nst'
    expect(clipHash(said)).not.toBe(base)
    expect(clipHash(voice)).not.toBe(base)
  })

  it('stays the same when only what is shown or asked changes', () => {
    const base = clipHash(clip())
    const shown = clip()
    shown.lines[0]!.text = 'Klockan 09:15.'
    shown.lines[0]!.speaker = 'Anna'
    shown.title = 'Another title'
    shown.items = []
    expect(clipHash(shown)).toBe(base)
  })
})

describe('WAV handling', () => {
  const pcm = {
    sampleRate: 22050,
    samples: Buffer.from([1, 0, 2, 0, 255, 127]),
  }

  it('reads back what it writes', () => {
    expect(readWav(writeWav(pcm))).toEqual(pcm)
  })

  it('skips other chunks, including an odd-sized one with its pad byte', () => {
    const wav = writeWav(pcm)
    const list = Buffer.alloc(8 + 3 + 1)
    list.write('LIST', 0, 'ascii')
    list.writeUInt32LE(3, 4)
    // RIFF header, then the odd chunk, then fmt and data.
    const withList = Buffer.concat([
      wav.subarray(0, 12),
      list,
      wav.subarray(12),
    ])
    expect(readWav(withList)).toEqual(pcm)
  })

  it('refuses what it cannot join', () => {
    expect(() => readWav(Buffer.from('not a wav file at all, really'))).toThrow(
      /not a WAV/,
    )
    const stereo = writeWav(pcm)
    stereo.writeUInt16LE(2, 22)
    expect(() => readWav(stereo)).toThrow(/16-bit mono/)
  })

  it('makes silence of the asked length', () => {
    expect(silence(22050, 0.5)).toHaveLength(22050)
  })
})

describe('publishedAudioPath', () => {
  it('names the file after the clip and the fingerprint of its audio', () => {
    expect(publishedAudioPath('d-hora-1-tag', 'bc5ab83671defd35')).toBe(
      'audio/d-hora-1-tag-bc5ab83671defd35.m4a',
    )
  })
})
