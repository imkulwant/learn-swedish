import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { heading } from './helpers.ts'

const SCREENS: [string, string][] = [
  ['./', 'Today'],
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
