import { expect, test } from '@playwright/test'
import { firstScreen, openToday } from './helpers.ts'

// The app makes no third-party requests (docs/PLAN.md, architecture rule 4):
// no analytics, fonts or CDNs. Every request goes to the page's own origin.
test.use({ permissions: ['microphone'] })

test('no request leaves the app’s own origin, on any screen', async ({
  page,
  context,
  baseURL,
}) => {
  const origin = new URL(baseURL!).origin
  const elsewhere: string[] = []
  // The context also sees what the service worker fetches by itself.
  context.on('request', (request) => {
    const url = new URL(request.url())
    if (url.protocol === 'blob:' || url.protocol === 'data:') return
    if (url.origin !== origin) elsewhere.push(request.url())
  })

  await page.goto('./')
  await expect(firstScreen(page)).toBeVisible()
  await openToday(page)
  await page.evaluate(() => navigator.serviceWorker.ready)
  for (const path of [
    './',
    'exam',
    'exam/lasa/d-lasa-1',
    'exam/hora/d-hora-1',
    'exam/skriva/s-felanmalan',
    'exam/tala/t-nytt-jobb',
    'exam/tala/par/p-trivas-jobbet',
    'exam/prov/d-prov-1',
    'learn',
    'learn/ord',
    'learn/grammatik/g-v2',
    'everyday',
    'everyday/v-apoteket',
    'progress',
    'settings',
  ]) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  // Audio, words and recording too.
  await page.goto('exam/hora/d-hora-1')
  await page.getByRole('button', { name: 'Play' }).first().click()
  await page.goto('learn/ord')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.goto('exam/tala/t-ma-bra')
  await page.getByRole('button', { name: 'Start speaking now' }).click()
  await expect(page.getByText('● Recording')).toBeVisible()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(
    page.getByRole('heading', { name: 'Listen to yourself' }),
  ).toBeVisible()

  // A running mock, with a clip played in exam conditions.
  await page.goto('exam/prov/d-prov-1')
  await page.getByRole('button', { name: 'Start the mock' }).click()
  await page.getByRole('button', { name: 'Start Läsa – reading' }).click()
  await page.getByRole('button', { name: 'Hand in this part' }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Hand in' })
    .click()
  await page.getByRole('button', { name: 'Start Höra – listening' }).click()
  await page.getByRole('button', { name: 'Play' }).first().click()
  await expect(page.getByText('1 of 2 plays used').first()).toBeVisible()

  expect(elsewhere).toEqual([])
})
