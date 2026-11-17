import { openDatabase } from '../data/repositories/database'
import { requestPersistence } from '../platform/storage'

/**
 * Work that must finish before the first screen: ask the browser to keep the
 * app's storage, then open the database. Rejects if storage cannot be opened,
 * so the app can say so instead of showing screens that cannot save.
 */
export async function bootstrap(): Promise<void> {
  // Never throws.
  await requestPersistence()
  await openDatabase()
}
