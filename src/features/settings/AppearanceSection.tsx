import { useState } from 'react'
import {
  readPreference,
  setPreference,
  type ThemePreference,
} from '../../platform/theme'

const CHOICES: { value: ThemePreference; name: string; about: string }[] = [
  { value: 'dark', name: 'Night', about: 'Dark colours.' },
  { value: 'light', name: 'Day', about: 'Light colours.' },
  {
    value: 'system',
    name: 'Match my phone',
    about: 'Day or Night, as the phone is set.',
  },
]

/** Night or Day mode, kept on this phone. */
export function AppearanceSection() {
  const [choice, setChoice] = useState(readPreference)

  return (
    <section
      aria-labelledby="appearance-heading"
      className="flex flex-col gap-4 rounded-card bg-surface p-4"
    >
      <h2 id="appearance-heading" className="text-sm text-muted">
        Appearance
      </h2>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-semibold">Colours</legend>
        {CHOICES.map(({ value, name, about }) => (
          <label
            key={value}
            className={`tap-target flex items-start gap-3 rounded-control border bg-surface p-3 ${
              choice === value ? 'border-accent-fg' : 'border-border'
            }`}
          >
            <input
              type="radio"
              name="theme"
              checked={choice === value}
              onChange={() => {
                setChoice(value)
                setPreference(value)
              }}
              className="mt-1 size-5 accent-[var(--color-accent-fg)]"
            />
            <span className="flex flex-col">
              <span className="font-semibold">{name}</span>
              <span className="text-sm text-muted">{about}</span>
            </span>
          </label>
        ))}
      </fieldset>
    </section>
  )
}
