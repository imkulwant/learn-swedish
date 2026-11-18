import type { Level, Skill } from './content/schema.ts'

/**
 * How the test is run, part by part. Skolverket publishes only that the
 * written parts take four to five hours in all (Elevbrev sfi 2026–2027), so
 * these are the app's estimates, chosen by Kul and Anna on 2026-11-18, and
 * the app says so. Mocks follow them; drills do not.
 */
export const EXAM_FORMAT = {
  confirmed: false,
  /** Dictionaries and other aids are not allowed in mocks. */
  aids: false,
  parts: {
    lasa: { minutes: 90 },
    hora: { minutes: 45, plays: 2 },
    skriva: { minutes: 90 },
    tala: { minutes: 25 },
  },
} as const satisfies {
  confirmed: boolean
  aids: boolean
  parts: Record<Skill, { minutes: number; plays?: number }>
}

/** The parts in the order the test gives them. */
export const EXAM_ORDER: Skill[] = ['lasa', 'hora', 'skriva', 'tala']

/** How many writing tasks a level's test has. */
export const WRITING_TASKS: Record<Level, number> = { C: 1, D: 2 }

export const PART_NAMES: Record<Skill, string> = {
  lasa: 'Läsa – reading',
  hora: 'Höra – listening',
  skriva: 'Skriva – writing',
  tala: 'Tala – speaking',
}
