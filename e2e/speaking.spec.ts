import { expect, test, type Page } from '@playwright/test'
import { heading, openToday } from './helpers.ts'

// WebKit records from a fake microphone once the permission is granted.
test.use({ permissions: ['microphone'] })

const recordings = (page: Page) =>
  page
    .getByRole('region', { name: 'Your recordings' })
    .or(page.locator('section[aria-labelledby="recordings"]'))
    .getByRole('listitem')

test('a solo answer is planned, recorded, kept across a reload and self-assessed', async ({
  page,
}) => {
  await openToday(page)
  await page.goto('exam')
  await page.getByRole('link', { name: 'Tala – speaking' }).click()
  await expect(
    page.getByRole('region', { name: /Readiness, Tala/ }),
  ).toContainText('Record and assess 3 answers')
  await page.getByRole('link', { name: /Att börja på ett nytt jobb/ }).click()
  await expect(heading(page, 'Att börja på ett nytt jobb')).toBeVisible()

  await page.getByRole('button', { name: 'Plan for 2 minutes' }).click()
  await expect(page.getByRole('timer')).toHaveText(/^[12]:\d\d$/)
  await page.getByRole('button', { name: 'Start speaking' }).click()
  await expect(page.getByText('● Recording')).toBeVisible()
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: 'Stop' }).click()

  // The review opens on the new recording.
  await expect(
    page.getByRole('heading', { name: 'Listen to yourself' }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Model answer' }),
  ).toBeVisible()
  await expect(page.getByText(/äldreboende i Ekdala/)).toBeVisible()
  const scores = {
    'The task': 'Yes',
    Understandable: 'Yes',
    Connected: 'Partly',
    'The listener': 'Yes',
    'Grammar and words': 'Partly',
    'Keeping going': 'Not yet',
  }
  for (const [criterion, score] of Object.entries(scores))
    await page
      .getByRole('group', { name: new RegExp(`^${criterion}\\.`) })
      .getByLabel(score)
      .check()
  await page.getByRole('button', { name: 'Save assessment' }).click()
  await expect(page.getByRole('region', { name: 'Result' })).toContainText(
    '66%',
  )
  await page.getByRole('button', { name: 'Done' }).click()

  // The recording is stored with its audio, and survives a reload.
  await page.reload()
  await expect(recordings(page)).toHaveCount(1)
  await expect(recordings(page).first()).toContainText('Assessed · 66%')
  const duration = await page.evaluate(async () => {
    const audio = document.querySelector('audio')!
    if (audio.readyState < 1)
      await new Promise((r) => audio.addEventListener('loadedmetadata', r))
    return audio.duration
  })
  expect(duration).toBeGreaterThan(0.5)

  await recordings(page).first().getByRole('button', { name: '☆ Star' }).click()
  await expect(
    recordings(page).first().getByRole('button', { name: '★ Starred' }),
  ).toHaveAttribute('aria-pressed', 'true')

  await page.goto('settings')
  await expect(page.getByRole('region', { name: 'Recordings' })).toContainText(
    '1 recording',
  )
  await page.goto('exam/tala')
  await expect(
    page.getByRole('link', { name: /Att börja på ett nytt jobb/ }),
  ).toContainText('Assessed · 66%')
})

test('a recording can be deleted', async ({ page }) => {
  await openToday(page)
  await page.goto('exam/tala/t-ma-bra')
  await page.getByRole('button', { name: 'Start speaking now' }).click()
  await expect(page.getByText('● Recording')).toBeVisible()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(
    page.getByRole('heading', { name: 'Listen to yourself' }),
  ).toBeVisible()
  await page.goto('exam/tala/t-ma-bra')
  await expect(recordings(page)).toHaveCount(1)
  await recordings(page).first().getByRole('button', { name: 'Delete' }).click()
  await page
    .getByRole('dialog', { name: 'Delete this recording?' })
    .getByRole('button', { name: 'Delete' })
    .click()
  await expect(recordings(page)).toHaveCount(0)
})
