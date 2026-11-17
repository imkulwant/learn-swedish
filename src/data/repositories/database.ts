import { db } from '../db'

/** Opens the database, so a broken storage is found before the first screen. */
export async function openDatabase(): Promise<void> {
  await db.open()
}
