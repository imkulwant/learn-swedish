// Records the microphone with MediaRecorder. iOS Safari records AAC in an
// MP4 container (audio/mp4); other browsers pick their own format, which they
// can also play back. The stream is stopped as soon as recording ends, so the
// microphone indicator goes off.

export type RecorderError = 'denied' | 'unsupported' | 'failed'

export interface Recorded {
  bytes: ArrayBuffer
  mimeType: string
  durationMs: number
}

export interface ActiveRecording {
  startedAt: number
  /** Stops and hands back what was recorded. */
  stop(): Promise<Recorded>
  /** Stops and throws the recording away. */
  cancel(): void
}

export class RecorderFailure extends Error {
  readonly reason: RecorderError
  constructor(reason: RecorderError) {
    super(reason)
    this.reason = reason
  }
}

const PREFERRED = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']

export async function startRecording(): Promise<ActiveRecording> {
  if (
    typeof MediaRecorder === 'undefined' ||
    !navigator.mediaDevices?.getUserMedia
  )
    throw new RecorderFailure('unsupported')
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (error) {
    const name = error instanceof DOMException ? error.name : ''
    throw new RecorderFailure(
      name === 'NotAllowedError' || name === 'SecurityError'
        ? 'denied'
        : 'failed',
    )
  }
  const mimeType = PREFERRED.find((t) => MediaRecorder.isTypeSupported(t))
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
  const chunks: Blob[] = []
  recorder.addEventListener('dataavailable', (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  })
  const release = () => stream.getTracks().forEach((t) => t.stop())
  const startedAt = Date.now()
  // A timeslice makes the browser hand over data as it records, so a long
  // recording is not held in one piece until the end.
  recorder.start(1000)

  return {
    startedAt,
    stop() {
      return new Promise<Recorded>((resolve, reject) => {
        recorder.addEventListener(
          'stop',
          () => {
            release()
            const type = recorder.mimeType || mimeType || 'audio/mp4'
            new Blob(chunks, { type })
              .arrayBuffer()
              .then((bytes) =>
                resolve({
                  bytes,
                  mimeType: type,
                  durationMs: Date.now() - startedAt,
                }),
              )
              .catch(() => reject(new RecorderFailure('failed')))
          },
          { once: true },
        )
        if (recorder.state === 'inactive') release()
        else recorder.stop()
      })
    },
    cancel() {
      if (recorder.state !== 'inactive') recorder.stop()
      release()
    },
  }
}
