import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RecorderFailure, startRecording } from './recorder'

/** A MediaRecorder that records one chunk and can stop by itself. */
class FakeRecorder extends EventTarget {
  static last: FakeRecorder
  static isTypeSupported = (type: string) => type === 'audio/mp4'
  state: 'inactive' | 'recording' = 'inactive'
  mimeType = 'audio/mp4'
  constructor() {
    super()
    FakeRecorder.last = this
  }
  start() {
    this.state = 'recording'
  }
  stop() {
    if (this.state === 'inactive') return
    this.state = 'inactive'
    const data = Object.assign(new Event('dataavailable'), {
      data: new Blob([new Uint8Array([1, 2, 3])]),
    })
    this.dispatchEvent(data)
    this.dispatchEvent(new Event('stop'))
  }
}

const stopTrack = vi.fn()

beforeEach(() => {
  stopTrack.mockClear()
  vi.stubGlobal('MediaRecorder', FakeRecorder)
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: async () => ({ getTracks: () => [{ stop: stopTrack }] }),
    },
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('startRecording', () => {
  it('hands back the bytes and releases the microphone', async () => {
    const recording = await startRecording()
    const recorded = await recording.stop()
    expect([...new Uint8Array(recorded.bytes)]).toEqual([1, 2, 3])
    expect(recorded.mimeType).toBe('audio/mp4')
    expect(stopTrack).toHaveBeenCalled()
  })

  it('keeps what was recorded when the recorder stopped by itself', async () => {
    const recording = await startRecording()
    FakeRecorder.last.stop() // iOS took the microphone
    const recorded = await recording.stop()
    expect(recorded.bytes.byteLength).toBe(3)
  })

  it('says the microphone was refused', async () => {
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: async () => {
          throw new DOMException('no', 'NotAllowedError')
        },
      },
    })
    await expect(startRecording()).rejects.toMatchObject({ reason: 'denied' })
    await expect(startRecording()).rejects.toBeInstanceOf(RecorderFailure)
  })
})
