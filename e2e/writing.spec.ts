import { expect, test } from '@playwright/test'
import { heading, openToday } from './helpers.ts'

const draft = `Hej Lina!

Igår jag fick ditt mejl. Det var roligt att höra att du ska börja på SFI.

Kram
Samira`

test('a text is kept across a reload, checked, handed in and self-assessed', async ({
  page,
}) => {
  await openToday(page)
  await page.goto('exam')
  await page.getByRole('link', { name: 'Skriva – writing' }).click()
  await expect(heading(page, 'Skriva – writing')).toBeVisible()
  await expect(
    page.getByRole('region', { name: /Readiness, Skriva/ }),
  ).toContainText('Write and assess 3 texts')
  await page.getByRole('link', { name: /Mejl till en kompis/ }).click()
  await expect(heading(page, 'Mejl till en kompis')).toBeVisible()
  await expect(page.getByRole('region', { name: 'The task' })).toContainText(
    'Ge Lina två tips.',
  )

  const text = page.getByRole('textbox', { name: 'Your text' })
  await text.fill(draft)
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await expect(page.getByText(/^20 words · aim for 80–200/)).toBeVisible()

  // The draft survives the app being closed.
  await page.reload()
  await expect(page.getByRole('textbox', { name: 'Your text' })).toHaveValue(
    draft,
  )

  const back = page.getByRole('link', { name: 'Back' })
  if (await back.isVisible()) await back.click()
  else await page.goto('exam/skriva')
  await expect(
    page.getByRole('link', { name: /Mejl till en kompis/ }),
  ).toContainText('Draft · 20 words')
  await page.getByRole('link', { name: /Mejl till en kompis/ }).click()

  await page.getByRole('button', { name: 'Check my text' }).click()
  const checks = page.getByRole('region', { name: 'Check this' })
  await expect(checks).toContainText('The verb may not come second')
  await expect(checks).toContainText('igår jag fick…')
  await expect(checks).toContainText('20 words')

  await page.getByRole('button', { name: 'Hand in' }).click()
  await page
    .getByRole('dialog', { name: 'Hand in your text?' })
    .getByRole('button', { name: 'Hand in' })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Model answer' }),
  ).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Your text' })).toHaveCount(0)

  const save = page.getByRole('button', { name: 'Save assessment' })
  await expect(save).toBeDisabled()
  const scores = {
    'The task': 'Partly',
    'The reader': 'Yes',
    Structure: 'Yes',
    'Linking words': 'Not yet',
    Grammar: 'Partly',
    Variation: 'Partly',
  }
  for (const [criterion, score] of Object.entries(scores))
    await page
      .getByRole('group', { name: new RegExp(`^${criterion}\\.`) })
      .getByLabel(score)
      .check()
  await save.click()

  const result = page.getByRole('region', { name: 'Result' })
  await expect(result).toContainText('7 of 12 · 58%')
  await expect(
    page.getByRole('button', { name: 'Share my text' }),
  ).toBeVisible()

  await page.goto('exam/skriva')
  await expect(
    page.getByRole('link', { name: /Mejl till en kompis/ }),
  ).toContainText('Assessed · 58%')
  await expect(
    page.getByRole('region', { name: /Readiness, Skriva/ }),
  ).toContainText('(1 so far)')

  // Writing it again starts an empty draft; the assessed text stays stored.
  await page.getByRole('link', { name: /Mejl till en kompis/ }).click()
  await page.getByRole('button', { name: 'Write it again' }).click()
  await expect(page.getByRole('textbox', { name: 'Your text' })).toHaveValue('')
})
