import { expect, type Page } from '@playwright/test'

// Locators and flows shared by the specs.

export const heading = (page: Page, name: string | RegExp) =>
  page.getByRole('heading', { name, level: 1 })

/** The first screen of the app: Welcome on a new install, Today after. */
export const firstScreen = (page: Page) =>
  heading(page, /^(Today|Welcome to SFI Prep)$/)

/**
 * Opens Today, completing the welcome screen first if this is a new install.
 * Its defaults are level D and no test date.
 */
export async function openToday(
  page: Page,
  goal: { level?: 'C' | 'D'; examDate?: string } = {},
) {
  await page.goto('./')
  await expect(firstScreen(page)).toBeVisible()
  if (await heading(page, 'Welcome to SFI Prep').isVisible()) {
    await page.getByLabel(`SFI ${goal.level ?? 'D'}`).check()
    if (goal.examDate) await page.getByLabel(/Test date/).fill(goal.examDate)
    await page.getByRole('button', { name: 'Start' }).click()
  }
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
