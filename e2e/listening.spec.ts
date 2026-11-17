import { expect, test, type Page } from '@playwright/test'
import { heading, openToday, storedAttempts } from './helpers.ts'

const PACK = 'Höra D – paket 1'

const audioState = (page: Page) =>
  page.locator('audio').evaluate((el: HTMLAudioElement) => ({
    duration: el.duration,
    paused: el.paused,
    rate: el.playbackRate,
    src: new URL(el.currentSrc || el.src).pathname,
  }))

async function mc(page: Page, prompt: string, option: string) {
  const group = page.getByRole('group', { name: prompt })
  await group.getByLabel(option).check()
  await group.getByRole('button', { name: 'Check' }).click()
  await expect(group.getByRole('status')).toContainText('Right')
}

test('a listening clip plays, is answered, and then shows its transcript', async ({
  page,
}) => {
  await openToday(page)
  await expect(
    page.getByRole('region', { name: /Readiness, Höra/ }),
  ).toContainText('(0 so far)')
  await page.getByRole('link', { name: 'Practise listening' }).click()
  await expect(heading(page, 'Höra – listening')).toBeVisible()
  await page.getByRole('link', { name: new RegExp(PACK) }).click()
  await expect(heading(page, PACK)).toBeVisible()
  await expect(page.getByText('Clip 1 of 5')).toBeVisible()
  await expect(
    page.getByText('Draft – not yet checked by a reviewer'),
  ).toHaveCount(0)

  // The clip's audio is served under the deployment path and loads.
  await expect
    .poll(async () => (await audioState(page)).duration)
    .toBeGreaterThan(10)
  // Its name carries a fingerprint of the audio, so a changed clip gets a new address.
  expect((await audioState(page)).src).toMatch(
    /^\/learn-swedish\/audio\/d-hora-1-tag-[0-9a-f]{16}\.m4a$/,
  )

  const player = page.getByRole('region', { name: /^Audio:/ })
  await expect(player).toContainText('Not played yet')
  await player.getByRole('button', { name: 'Play' }).click()
  await expect(player).toContainText('Played 1 time')
  await expect(player.getByRole('button', { name: 'Pause' })).toBeVisible()
  await player.getByRole('button', { name: '0.75×' }).click()
  expect((await audioState(page)).rate).toBe(0.75)

  // No transcript until every question is answered.
  await expect(page.getByText('Transcript', { exact: true })).toHaveCount(0)
  await mc(page, 'Hur mycket är tåget försenat?', 'Cirka tjugo minuter')
  await mc(page, 'Varför är tåget försenat?', 'Det är fel på en signal')
  const track = page.getByRole('group', {
    name: 'Från vilket spår avgår tåget nu?',
  })
  await track.getByRole('textbox').fill('spår 5')
  await track.getByRole('button', { name: 'Check' }).click()
  await expect(track.getByRole('status')).toContainText('Right')

  await page.getByText('Transcript', { exact: true }).click()
  await expect(
    page.locator('details').getByText(/Tåget avgår från spår 5/),
  ).toBeVisible()
  expect(await storedAttempts(page)).toHaveLength(3)

  await page.getByRole('button', { name: 'Next clip' }).click()
  await expect(page.getByText('Clip 2 of 5')).toBeVisible()
  await expect(player).toContainText('Not played yet')
  // The chosen speed is kept for the next clip.
  await expect(player.getByRole('button', { name: '0.75×' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect.poll(async () => (await audioState(page)).rate).toBe(0.75)
})

test('downloaded audio plays with no network', async ({ page, context }) => {
  await page.goto('exam/hora')
  await expect(heading(page, 'Höra – listening')).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()

  const offline = page.getByRole('region', { name: 'Offline audio' })
  await expect(offline).toContainText('0 of 5 clips are on this device')
  await offline.getByRole('button', { name: 'Download audio' }).click()
  await expect(offline).toContainText(
    'All 5 clips are on this device and play without internet.',
  )

  await context.setOffline(true)
  await page.goto('exam/hora/d-hora-1')
  await expect(heading(page, PACK)).toBeVisible()
  await expect
    .poll(async () => (await audioState(page)).duration)
    .toBeGreaterThan(10)
})

test('a clip that cannot load offline says so, and plays after a reload online', async ({
  page,
  context,
}) => {
  // The clip page is never opened online, so no copy of its audio exists
  // anywhere, not even in the browser's memory.
  await page.goto('exam/hora')
  await expect(heading(page, 'Höra – listening')).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect(heading(page, 'Höra – listening')).toBeVisible()

  await context.setOffline(true)
  await page.goto('exam/hora/d-hora-1')
  await expect(heading(page, PACK)).toBeVisible()
  const player = page.getByRole('region', { name: /^Audio:/ })
  await player.getByRole('button', { name: 'Play' }).click()
  await expect(player.getByRole('alert')).toContainText(
    'The audio could not be loaded',
  )
  await expect(player).toContainText('Not played yet')

  await context.setOffline(false)
  await player.getByRole('button', { name: 'Reload' }).click()
  await expect(heading(page, PACK)).toBeVisible()
  await player.getByRole('button', { name: 'Play' }).click()
  await expect(player).toContainText('Played 1 time')
  await expect(player.getByRole('alert')).toHaveCount(0)
})
