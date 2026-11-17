import { Component, type ReactNode } from 'react'
import { SaveBackupButton } from '../features/settings/SaveBackupButton'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'

function Fallback() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
      <EmptyState
        title="Something went wrong"
        description="The app hit an unexpected error. Your progress is still stored on this device. Save a backup if you like, then reload."
      />
      <div className="flex w-full max-w-sm flex-col gap-2">
        <Button onClick={() => window.location.reload()}>Reload</Button>
        <SaveBackupButton label="Export backup" variant="secondary" />
      </div>
    </div>
  )
}

/** Catches an error thrown while drawing a screen, so the app never goes blank. */
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    // Stays on the device: the console is the only place it goes.
    console.error('The app failed to draw a screen.', error)
  }

  render() {
    return this.state.failed ? <Fallback /> : this.props.children
  }
}
