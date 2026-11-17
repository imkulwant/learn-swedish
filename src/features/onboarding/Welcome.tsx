import { useState } from 'react'
import { completeOnboarding } from '../../data/repositories/settings'
import type { Level } from '../../domain/content/schema'
import type { LocalDate } from '../../domain/types'
import { reportStorageFailure } from '../../platform/storageFailure'
import { Button } from '../../ui/Button'
import { Screen } from '../../ui/Screen'
import { ExamDateField } from '../settings/ExamDateField'
import { LevelPicker } from '../settings/LevelPicker'

/** The first screen of a new install: the goal, then on to Today. */
export function Welcome() {
  const [level, setLevel] = useState<Level>('D')
  const [examDate, setExamDate] = useState<LocalDate | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  async function start() {
    setSaving(true)
    setFailed(false)
    try {
      // Today replaces this screen once the setting is stored.
      await completeOnboarding(level, examDate)
    } catch (error) {
      reportStorageFailure(error)
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen title="Welcome to SFI Prep">
      <p className="text-muted">
        Practise for the SFI national test with texts and questions in the
        formats the test uses, and get ready for everyday Swedish.
      </p>
      <LevelPicker value={level} onChange={setLevel} />
      <ExamDateField value={examDate} onChange={setExamDate} />
      {failed && (
        <p role="alert" className="text-danger">
          Your choices could not be saved. Try again.
        </p>
      )}
      <Button disabled={saving} onClick={() => void start()}>
        Start
      </Button>
    </Screen>
  )
}
