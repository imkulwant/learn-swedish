import { Link } from 'react-router'
import { Screen } from '../../ui/Screen'
import { MockList } from '../mock/MockScreen'

const PARTS = [
  { to: 'lasa', name: 'Läsa – reading', ready: true },
  { to: 'hora', name: 'Höra – listening', ready: true },
  { to: 'skriva', name: 'Skriva – writing', ready: true },
  { to: 'tala', name: 'Tala – speaking', ready: true },
]

export function ExamScreen() {
  return (
    <Screen title="Exam">
      <p className="text-muted">
        The SFI national test has four parts. Practise each one in the formats
        the test uses.
      </p>
      <ul className="flex flex-col gap-2">
        {PARTS.map((part) =>
          part.ready ? (
            <li key={part.to}>
              <Link
                to={part.to}
                className="tap-target flex items-center rounded-card border border-border bg-surface p-4 font-semibold active:bg-surface-2"
              >
                {part.name}
              </Link>
            </li>
          ) : (
            <li
              key={part.to}
              className="flex items-center justify-between rounded-card border border-border p-4 text-muted"
            >
              {part.name}
              <span className="text-sm">Coming soon</span>
            </li>
          ),
        )}
      </ul>
      <MockList />
    </Screen>
  )
}
