import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { heading, openToday } from './helpers.ts'

// Screens fade in for 150 ms. A scan during the fade sees low contrast, so
// these checks run with motion reduced, which turns the fade off.
test.use({ reducedMotion: 'reduce' })

const SCREENS: [string, string][] = [
  ['./', 'Welcome to SFI Prep'],
  ['settings', 'Settings'],
  ['exam', 'Exam'],
  ['exam/lasa', 'Läsa – reading'],
  ['exam/lasa/d-lasa-1', 'Läsa D – paket 1'],
  ['learn', 'Learn'],
]

for (const [path, title] of SCREENS) {
  test(`${title} has no automatically detectable accessibility problems`, async ({
    page,
  }) => {
    await page.goto(path)
    await expect(heading(page, title)).toBeVisible()
    const { violations } = await new AxeBuilder({ page }).analyze()
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })
}

test('Today after the welcome screen has no detectable problems', async ({
  page,
}) => {
  await openToday(page, { examDate: '2027-01-18' })
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
})

test('a checked question with feedback stays accessible', async ({ page }) => {
  await page.goto('exam/lasa/d-lasa-1')
  const group = page.getByRole('group', {
    name:
      'Vilken kurs passar bäst' +
      ' för en person som vill förbereda sig inför en anställningsintervju?',
  })
  await group.getByLabel('Datorkunskap för nybörjare').check()
  await group.getByRole('button', { name: 'Check' }).click()
  await expect(group.getByRole('status')).toBeVisible()
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
})
