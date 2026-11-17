import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import {
  getSetting,
  setSetting,
  type SettingValues,
} from '../../data/repositories/settings'
import { reportStorageFailure } from '../../platform/storageFailure'
import { ExamDateField } from './ExamDateField'
import { LevelPicker } from './LevelPicker'

type Goal = Pick<SettingValues, 'targetLevel' | 'examDate'>

/** A change on its way to the database. */
interface Pending<V> {
  value: V
  /** The stored values read before the write finished, once it has. */
  savedOver?: Goal
}

/**
 * The target level and test date, saved as they change. A change shows at
 * once. When its write has finished, the next value read from the database
 * takes over, so an import or a later change elsewhere is never hidden, and a
 * failed write goes back to what is stored.
 */
export function GoalSection() {
  const stored = useLiveQuery<Goal>(async () => ({
    targetLevel: await getSetting('targetLevel'),
    examDate: await getSetting('examDate'),
  }))
  // The values on screen, for a write that finishes to compare against.
  const latest = useRef(stored)
  useEffect(() => {
    latest.current = stored
  }, [stored])
  const [pending, setPending] = useState<{
    [K in keyof Goal]?: Pending<Goal[K]>
  }>({})
  const [failed, setFailed] = useState(false)

  async function save<K extends keyof Goal>(key: K, value: Goal[K]) {
    setFailed(false)
    setPending((p) => ({ ...p, [key]: { value } }))
    try {
      await setSetting(key, value as SettingValues[K])
      setPending((p) => ({
        ...p,
        [key]: { value, savedOver: latest.current },
      }))
    } catch (error) {
      reportStorageFailure(error)
      setFailed(true)
      setPending((p) => ({ ...p, [key]: undefined }))
    }
  }

  // A finished write still shows until the database has been read again.
  const show = <K extends keyof Goal>(key: K): Goal[K] | undefined => {
    const p = pending[key] as Pending<Goal[K]> | undefined
    if (!stored) return undefined
    return p && (!p.savedOver || p.savedOver === stored) ? p.value : stored[key]
  }
  const level = show('targetLevel')

  return (
    <section
      aria-labelledby="goal-heading"
      className="flex flex-col gap-4 rounded-card bg-surface p-4"
    >
      <h2 id="goal-heading" className="text-sm text-muted">
        Your goal
      </h2>
      {stored && level && (
        <>
          <LevelPicker
            value={level}
            onChange={(l) => void save('targetLevel', l)}
          />
          <ExamDateField
            value={show('examDate') ?? null}
            onChange={(d) => void save('examDate', d)}
          />
        </>
      )}
      {failed && (
        <p role="alert" className="text-danger">
          The change could not be saved. Try again.
        </p>
      )}
    </section>
  )
}
