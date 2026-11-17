import { expect, type Page } from '@playwright/test'

// Locators and flows shared by the specs.

export const heading = (page: Page, name: string | RegExp) =>
  page.getByRole('heading', { name, level: 1 })

/** Opens the app and waits until the first screen is drawn. */
export async function openToday(page: Page) {
  await page.goto('./')
  await expect(heading(page, 'Today')).toBeVisible()
}

/** Every attempt row in the app database, read straight from IndexedDB. */
export async function storedAttempts(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('learn-swedish')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const rows = await new Promise<
      { itemId: string; score: number; selfMarked: boolean }[]
    >((resolve, reject) => {
      const request = db
        .transaction('attempts')
        .objectStore('attempts')
        .getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    db.close()
    return rows
  })
}
