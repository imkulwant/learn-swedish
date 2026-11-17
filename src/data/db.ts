import Dexie, { type EntityTable } from 'dexie'
import type { Attempt, Setting } from '../domain/types'

// The name of the database inside the browser. GitHub Pages serves every one
// of the owner's project sites from one origin, so this name must not clash
// with the workout tracker's "gym-tracker" database next to it.
export const DB_NAME = 'learn-swedish'

export class SfiDb extends Dexie {
  attempts!: EntityTable<Attempt, 'id'>
  settings!: EntityTable<Setting, 'key'>

  constructor(name: string = DB_NAME) {
    super(name)
    // Version 1 declares every table in docs/PLAN.md, so later slices need no
    // migration just to add a table. Only attempts and settings are used yet.
    this.version(1).stores({
      attempts: 'id, itemId, [level+skill], answeredAt',
      cards: 'id, wordId, due, state',
      writings: 'id, promptId, updatedAt',
      recordings: 'id, taskId, createdAt, starred',
      mocks: 'id, examId, status, startedAt',
      studyDays: 'date',
      settings: 'key',
    })
  }
}

// UI code never imports this directly: it goes through src/data/repositories.
export const db = new SfiDb()
