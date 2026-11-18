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
  ['exam/hora', 'Höra – listening'],
  ['exam/hora/d-hora-1', 'Höra D – paket 1'],
  ['learn', 'Learn'],
  ['learn/ord', 'Words'],
  ['learn/grammatik', 'Grammar'],
  ['learn/grammatik/g-v2', 'Verbet på plats två'],
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

test('checked grammar exercises stay accessible', async ({ page }) => {
  await page.goto('learn/grammatik/g-perfekt')
  const gap = page.getByRole('group', { name: 'Skriv verbet i perfekt. (bo)' })
  await gap.getByRole('textbox').fill('bodde')
  await gap.getByRole('button', { name: 'Check' }).click()
  await expect(gap.getByRole('status')).toBeVisible()
  await page.goto('learn/grammatik/g-v2')
  const order = page.getByRole('group', { name: 'Börja med "I dag".' })
  for (const chunk of ['hemma', 'I dag', 'jag', 'jobbar'])
    await order.getByRole('button', { name: chunk, exact: true }).click()
  await order.getByRole('button', { name: 'Check' }).click()
  await expect(order.getByRole('status')).toBeVisible()
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([])
})
