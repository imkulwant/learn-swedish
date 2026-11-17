import { useState } from 'react'
import { saveFile } from '../../platform/share'
import { Button, type ButtonProps } from '../../ui/Button'
import { makeBackupFile, recordBackupSaved } from './backupFiles'

/**
 * Builds a backup and hands it to the learner. iOS opens the share sheet only
 * straight after a tap, and building the file can take too long, so a refused
 * share keeps the file and turns the button into "Save file" for a fresh tap.
 */
export function SaveBackupButton({
  label = 'Save backup',
  variant = 'primary',
}: {
  label?: string
  variant?: ButtonProps['variant']
}) {
  const [pending, setPending] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    setMessage(null)
    try {
      const file = pending ?? (await makeBackupFile())
      const result = await saveFile(file)
      if (result === 'blocked') {
        setPending(file)
        setMessage('The file is ready. Tap Save file to choose where it goes.')
        return
      }
      setPending(null)
      if (result === 'cancelled') return
      // The file has reached the learner even if this note cannot be stored.
      await recordBackupSaved().catch(() => {})
      setMessage('Backup saved.')
    } catch {
      setMessage('The backup could not be made.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant={variant} disabled={busy} onClick={() => void save()}>
        {pending ? 'Save file' : label}
      </Button>
      {message && (
        <p role="status" className="text-center text-muted">
          {message}
        </p>
      )}
    </>
  )
}
