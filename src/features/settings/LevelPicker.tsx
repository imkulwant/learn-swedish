import { LEVELS, type Level } from '../../domain/content/schema'

const DESCRIPTION: Record<Level, string> = {
  C: 'For everyday situations: short texts, informal writing.',
  D: 'The final SFI level. Longer texts, formal writing, discussions.',
}

/** Choose the test level, as a radio group. */
export function LevelPicker({
  value,
  onChange,
}: {
  value: Level
  onChange: (level: Level) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 font-semibold">
        Which test are you preparing for?
      </legend>
      {LEVELS.map((level) => (
        <label
          key={level}
          className={`tap-target flex items-start gap-3 rounded-control border bg-surface p-3 ${
            value === level ? 'border-accent-fg' : 'border-border'
          }`}
        >
          <input
            type="radio"
            name="target-level"
            checked={value === level}
            onChange={() => onChange(level)}
            className="mt-1 size-5 accent-[var(--color-accent-fg)]"
          />
          <span className="flex flex-col">
            <span className="font-semibold">SFI {level}</span>
            <span className="text-sm text-muted">{DESCRIPTION[level]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
