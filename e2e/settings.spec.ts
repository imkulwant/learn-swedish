import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { heading, openToday, storedAttempts } from './helpers.ts'

const DAY = 86_400_000
// Midday on 17 November 2026, local time.
const NOW = new Date(2026, 10, 17, 12, 0).getTime()

/** Makes the browser download files instead of opening a share sheet. */
async function downloadOnly(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      value: undefined,
      configurable: true,
    })
  })
}

/** Answers one D reading question correctly, which stores one attempt. */
async function answerOne(page: Page) {
  await page.goto('exam/lasa/d-lasa-1')
  const group = page.getByRole('group', {
    name: 'Hur många gånger träffas gruppen i datorkunskap?',
  })
  await group.getByRole('textbox').fill('sex gånger')
  await group.getByRole('button', { name: 'Check' }).click()
  await expect(group.getByRole('status')).toContainText('Right')
}

async function saveBackup(page: Page) {
  await page.goto('settings')
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Save backup' }).click()
  const file = await download
  return {
    name: file.suggestedFilename(),
    text: await readFile(await file.path(), 'utf8'),
  }
}

const chooseBackup = (page: Page, text: string) =>
  page.getByLabel('Backup file').setInputFiles({
    name: 'sfi-prep-2026-11-17.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  })

test.describe('welcome and goal', () => {
  test('a new install asks for the goal, then counts down to the test', async ({
    page,
  }) => {
    await page.clock.install({ time: NOW })
    await page.goto('./')
    await expect(heading(page, 'Welcome to SFI Prep')).toBeVisible()
    await expect(page.getByLabel('SFI D')).toBeChecked()

    await page.getByLabel('SFI C').check()
    await page.getByLabel(/Test date/).fill('2027-01-18')
    await page.getByRole('button', { name: 'Start' }).click()

    await expect(heading(page, 'Today')).toBeVisible()
    await expect(
      page.getByText('Your goal: pass the SFI C national test.'),
    ).toBeVisible()
    const countdown = page.getByRole('region', { name: 'Test countdown' })
    await expect(countdown).toContainText('62 days to your test')
    await expect(countdown).toContainText('18 Jan 2027')
    await expect(
      page.getByRole('region', { name: /Readiness, Läsa.*level C/ }),
    ).toBeVisible()

    // The goal is kept: Today opens straight away next time.
    await page.reload()
    await expect(heading(page, 'Today')).toBeVisible()
  })

  test('without a date, Today offers to add one', async ({ page }) => {
    await openToday(page)
    await expect(page.getByText('Know your test date?')).toBeVisible()
    await page.getByRole('link', { name: 'Add it in Settings' }).click()
    await expect(heading(page, 'Settings')).toBeVisible()
  })

  test('changing the goal in Settings changes Today and the reading level', async ({
    page,
  }) => {
    await page.clock.install({ time: NOW })
    await openToday(page)
    await page.getByRole('link', { name: 'Settings', exact: true }).click()

    await page.getByLabel('SFI C').check()
    await page.getByLabel(/Test date/).fill('2026-11-18')
    await page.getByRole('button', { name: 'Back', exact: true }).click()

    await expect(
      page.getByText('Your goal: pass the SFI C national test.'),
    ).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'Test countdown' }),
    ).toContainText('1 day to your test')
    await page.goto('exam/lasa')
    await expect(page.getByRole('button', { name: 'Level C' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

test.describe('backup', () => {
  test('saves a dated backup with every answer and records when', async ({
    page,
  }) => {
    await downloadOnly(page)
    await openToday(page)
    await answerOne(page)

    await page.goto('settings')
    await expect(page.getByText('Never backed up')).toBeVisible()
    const { name, text } = await saveBackup(page)

    expect(name).toMatch(/^sfi-prep-\d{4}-\d{2}-\d{2}\.json$/)
    const backup = JSON.parse(text)
    expect(backup).toMatchObject({
      format: 'sfi-prep-backup',
      schemaVersion: 2,
    })
    expect(backup.data.attempts).toEqual([
      expect.objectContaining({ itemId: 'd-lasa-1-kurser-ganger', score: 1 }),
    ])
    await expect(page.getByText('Backup saved.')).toBeVisible()
    await expect(page.getByText(/^Last backup \d+ \w+ \d{4}$/)).toBeVisible()
  })

  test('restores lost progress from a backup', async ({ page }) => {
    await downloadOnly(page)
    await openToday(page)
    await answerOne(page)
    const { text } = await saveBackup(page)

    // The browser clears the app's data; the marker outside the database remains.
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase('learn-swedish')
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        }),
    )
    await page.reload()
    await expect(
      page.getByRole('heading', { name: 'Your progress is missing' }),
    ).toBeVisible()

    await chooseBackup(page, text)
    const sheet = page.getByRole('dialog', { name: 'Import backup' })
    await expect(sheet).toContainText('Answers')
    await expect(sheet).toContainText('1')
    await sheet.getByRole('button', { name: 'Replace everything' }).click()
    await page
      .getByRole('dialog', { name: 'Replace everything?' })
      .getByRole('button', { name: 'Replace', exact: true })
      .click()

    // The app carries on where it was reloaded, which was Settings.
    await expect(heading(page, 'Settings')).toBeVisible()
    expect(await storedAttempts(page)).toEqual([
      expect.objectContaining({ itemId: 'd-lasa-1-kurser-ganger' }),
    ])
  })

  test('lost progress can also be left behind on purpose', async ({ page }) => {
    await openToday(page)
    await answerOne(page)
    await page.evaluate(
      () =>
        new Promise<void>((resolve, reject) => {
          const request = indexedDB.deleteDatabase('learn-swedish')
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        }),
    )
    await page.goto('./')
    await page.getByRole('button', { name: 'Start with no data' }).click()
    await expect(heading(page, 'Welcome to SFI Prep')).toBeVisible()

    // The choice sticks: no restore screen on the next launch.
    await page.reload()
    await expect(heading(page, 'Welcome to SFI Prep')).toBeVisible()
  })

  test('replacing everything with an empty backup is not taken for lost data', async ({
    page,
  }) => {
    await downloadOnly(page)
    await openToday(page)
    const { text: empty } = await saveBackup(page)
    await answerOne(page)
    await page.goto('settings')

    await chooseBackup(page, empty)
    await page
      .getByRole('dialog', { name: 'Import backup' })
      .getByRole('button', { name: 'Replace everything' })
      .click()
    await page
      .getByRole('dialog', { name: 'Replace everything?' })
      .getByRole('button', { name: 'Replace', exact: true })
      .click()
    expect(await storedAttempts(page)).toEqual([])

    await page.reload()
    await expect(heading(page, 'Settings')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Your progress is missing' }),
    ).toHaveCount(0)
  })

  test('refuses a file that is not a backup and changes nothing', async ({
    page,
  }) => {
    await openToday(page)
    await answerOne(page)
    await page.goto('settings')

    await chooseBackup(
      page,
      JSON.stringify({ format: 'workout-tracker-backup' }),
    )

    await expect(page.getByRole('alert')).toContainText('Nothing was changed.')
    await expect(
      page.getByRole('dialog', { name: 'Import backup' }),
    ).toHaveCount(0)
    expect(await storedAttempts(page)).toHaveLength(1)
  })

  test('Today asks for a backup after two weeks of unsaved progress', async ({
    page,
  }) => {
    await downloadOnly(page)
    await page.clock.install({ time: NOW })
    await openToday(page)
    await answerOne(page)
    await openToday(page)
    const reminder = page.getByRole('region', { name: 'Backup reminder' })
    await expect(reminder).toHaveCount(0)

    await page.clock.setSystemTime(NOW + 15 * DAY)
    await page.reload()
    await expect(reminder).toBeVisible()

    await reminder
      .getByRole('link', { name: 'Save a backup in Settings' })
      .click()
    await saveBackup(page)
    await openToday(page)
    await expect(reminder).toHaveCount(0)
  })
})
