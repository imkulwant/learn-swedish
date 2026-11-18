import { hasProgress } from '../data/repositories/attempts'
import { openDatabase } from '../data/repositories/database'
import { dataMarker } from '../platform/dataMarker'
import { requestPersistence } from '../platform/storage'

export interface BootResult {
  /** The device once held progress but now holds none: offer a restore first. */
  needsRestore: boolean
}

/**
 * Work that must finish before the first screen: ask the browser to keep the
 * app's storage, open the database, and check that the progress is still
 * there. Rejects if storage cannot be opened, so the app can say so instead of
 * showing screens that cannot save.
 */
export async function bootstrap(): Promise<BootResult> {
  // Never throws.
  await requestPersistence()
  await openDatabase()
  if (await hasProgress()) dataMarker.mark()
  else if (dataMarker.isSet()) return { needsRestore: true }
  return { needsRestore: false }
}
