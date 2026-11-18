import { expect, test } from '@playwright/test'
import { heading, openToday } from './helpers.ts'

const storedMockAttempts = (page: import('@playwright/test').Page) =>
  page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('learn-swedish')
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
    const rows = await new Promise<
      { mode: string; itemId: string; score: number }[]
    >((resolve) => {
      const r = db.transaction('attempts').objectStore('attempts').getAll()
      r.onsuccess = () => resolve(r.result)
    })
    db.close()
    return rows.filter((a) => a.mode === 'mock')
  })

async function handIn(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Hand in this part' }).click()
  await page
    .getByRole('dialog', { name: 'Hand in this part?' })
    .getByRole('button', { name: 'Hand in' })
    .click()
}

test('a mock runs in exam order, resumes after a reload, and gives a reviewed result', async ({
  page,
}) => {
  await openToday(page)
  await page.goto('exam')
  await page.getByRole('link', { name: /Provövning D – 1/ }).click()
  await expect(heading(page, 'Provövning D – 1')).toBeVisible()
  await expect(page.getByRole('region', { name: 'The parts' })).toContainText(
    '90 min',
  )
  await page.getByRole('button', { name: 'Start the mock' }).click()
  await page.getByRole('button', { name: 'Start Läsa – reading' }).click()
  await expect(page.getByRole('timer', { name: 'Time left' })).toHaveText(
    /^(1:30:00|89:5\d|90:00)$/,
  )

  // Läsa: answers give no feedback and survive the app closing.
  const q1 = page.getByRole('group', {
    name: 'När kan man prata svenska på biblioteket?',
  })
  await q1.getByLabel('På tisdagar klockan 17–19').check()
  await page
    .getByRole('textbox', { name: 'Vad behöver man för att låna en dator?' })
    .fill('en dator')
  await page
    .getByRole('textbox', { name: 'Vad behöver man för att låna en dator?' })
    .blur()
  await expect(q1.getByRole('status')).toHaveCount(0)
  await page.waitForTimeout(600)
  await page.reload()
  await expect(
    page
      .getByRole('group', { name: 'När kan man prata svenska på biblioteket?' })
      .getByLabel('På tisdagar klockan 17–19'),
  ).toBeChecked()
  await expect(
    page.getByRole('textbox', {
      name: 'Vad behöver man för att låna en dator?',
    }),
  ).toHaveValue('en dator')
  await handIn(page)

  // Höra: plays are limited and counted across a reload.
  await page.getByRole('button', { name: 'Start Höra – listening' }).click()
  const announcement = page.getByRole('region', {
    name: 'Audio: Utrop på stationen',
  })
  await expect(announcement).toContainText('0 of 2 plays used')
  await expect(announcement.getByRole('group', { name: 'Speed' })).toHaveCount(
    0,
  )
  await announcement.getByRole('button', { name: 'Play' }).click()
  await expect(announcement).toContainText('1 of 2 plays used')
  await page.waitForTimeout(400)
  await page.reload()
  await expect(
    page.getByRole('region', { name: 'Audio: Utrop på stationen' }),
  ).toContainText('1 of 2 plays used')
  await handIn(page)

  // Skriva: the text is kept.
  await page.getByRole('button', { name: 'Start Skriva – writing' }).click()
  await page
    .getByRole('region', { name: 'Writing task 1' })
    .getByRole('textbox', { name: 'Your text' })
    .fill('Hej Sofia!\n\nTack för inbjudan.\n\nKram\nNadia')
  await handIn(page)

  // Tala: handed in without recording.
  await page.getByRole('button', { name: 'Start Tala – speaking' }).click()
  await handIn(page)

  // The result: the open answer that matched nothing is marked first.
  const result = page.getByRole('region', { name: 'Result' })
  await expect(result).toContainText('Mark your open answers below')
  await page
    .getByRole('group', { name: 'Vad behöver man för att låna en dator?' })
    .getByRole('button', { name: 'No' })
    .click()
  await expect(result).toContainText(/Läsa – reading\s*1 of \d+/)
  await expect(
    page.getByRole('region', { name: 'Writing task 1' }),
  ).toContainText('Tack för inbjudan.')
  await expect(
    page.getByRole('heading', { name: 'Every question' }),
  ).toBeVisible()

  const attempts = await storedMockAttempts(page)
  expect(attempts.length).toBeGreaterThan(10)
  expect(attempts.find((a) => a.itemId === 'm1-bibliotek-1')?.score).toBe(1)
  expect(attempts.find((a) => a.itemId === 'm1-bibliotek-3')?.score).toBe(0)

  await page.goto('exam')
  await expect(
    page.getByRole('link', { name: /Provövning D – 1/ }),
  ).toContainText('Finished')
})

test('a part ends by itself when its time runs out', async ({ page }) => {
  await page.clock.install()
  await openToday(page)
  await page.goto('exam/prov/d-prov-1')
  await page.getByRole('button', { name: 'Start the mock' }).click()
  await page.getByRole('button', { name: 'Start Läsa – reading' }).click()
  await expect(page.getByRole('timer', { name: 'Time left' })).toBeVisible()
  await page.clock.fastForward('01:31:00')
  await expect(
    page.getByRole('button', { name: 'Start Höra – listening' }),
  ).toBeVisible()
  await expect(page.getByRole('alert')).toContainText(
    'The time for Läsa – reading ran out.',
  )
  await expect(page.getByRole('heading', { name: /Next part/ })).toBeFocused()
})
