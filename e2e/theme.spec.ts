import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { heading, openToday } from './helpers.ts'

// Screens fade in for 150 ms, which axe sees as low contrast.
test.use({ reducedMotion: 'reduce' })

const NIGHT_BG = 'rgb(20, 38, 56)' // #142638
const DAY_BG = 'rgb(243, 246, 249)' // #f3f6f9
const YELLOW = 'rgb(255, 204, 0)' // #ffcc00

const pageColour = (page: Page) =>
  page.locator('html').evaluate((el) => getComputedStyle(el).backgroundColor)

const practiseButtonColour = (page: Page) =>
  page
    .getByRole('link', { name: 'Practise words' })
    .evaluate((el) => getComputedStyle(el).backgroundColor)

async function choose(page: Page, name: string) {
  await page.goto('settings')
  await expect(heading(page, 'Settings')).toBeVisible()
  await page
    .getByRole('region', { name: 'Appearance' })
    .getByRole('radio', { name: new RegExp(`^${name}`) })
    .check()
}

test('a new install is Night, on #142638 with yellow #ffcc00 buttons', async ({
  page,
}) => {
  await openToday(page)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await pageColour(page)).toBe(NIGHT_BG)
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    'content',
    '#142638',
  )

  await page.goto('learn')
  await expect(page.getByRole('link', { name: 'Practise words' })).toBeVisible()
  expect(await practiseButtonColour(page)).toBe(YELLOW)
})

test('Day and Night are chosen in Settings and kept across a reload', async ({
  page,
}) => {
  await openToday(page)
  await choose(page, 'Day')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await pageColour(page)).toBe(DAY_BG)

  await page.reload()
  await expect(heading(page, 'Settings')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await expect(page.getByRole('radio', { name: /^Day/ })).toBeChecked()

  // The buttons keep their yellow in Day mode.
  await page.goto('learn')
  await expect(page.getByRole('link', { name: 'Practise words' })).toBeVisible()
  expect(await practiseButtonColour(page)).toBe(YELLOW)

  await choose(page, 'Night')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await pageColour(page)).toBe(NIGHT_BG)
})

test('"Match my phone" follows the phone, also while the app is open', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await openToday(page)
  await choose(page, 'Match my phone')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')

  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(await pageColour(page)).toBe(NIGHT_BG)
})

test('a stored value that is not a choice shows Night', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('sfi.theme', 'purple'))
  await openToday(page)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

const DAY_SCREENS: [string, string][] = [
  ['./', 'Today'],
  ['settings', 'Settings'],
  ['learn', 'Learn'],
  ['learn/ord/kort', 'Flashcards'],
  ['exam', 'Exam'],
  ['exam/lasa/d-lasa-1', 'Läsa D – paket 1'],
  ['progress', 'Progress'],
  ['learn/grammatik/g-v2', 'Verbet på plats två'],
]

for (const [path, title] of DAY_SCREENS) {
  test(`${title} has no contrast or other automatic accessibility problems in Day mode`, async ({
    page,
  }) => {
    await openToday(page)
    await page.evaluate(() => localStorage.setItem('sfi.theme', 'light'))
    await page.goto(path)
    await expect(heading(page, title)).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
}
