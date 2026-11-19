import { expect, test } from '@playwright/test'
import { heading, openToday } from './helpers.ts'

test('Today plans the day, and Progress shows readiness, the calendar and the archive', async ({
  page,
}) => {
  await openToday(page, { examDate: '2027-01-18' })
  const plan = page.getByRole('region', { name: 'Today’s plan' })
  await expect(plan).toContainText('No streak yet')
  // A part without practice is the weakest; Läsa comes first in the test.
  await expect(
    plan.getByRole('link', { name: /10 minutes of Läsa – reading/ }),
  ).toBeVisible()
  await expect(plan.getByRole('link', { name: /Write a text/ })).toBeVisible()

  // Five answers make today a study day.
  await page.goto('learn/grammatik/g-v2')
  for (const [prompt, option] of [
    ['Vilken mening är rätt?', 'I går var jag sjuk.'],
  ] as const) {
    const group = page.getByRole('group', { name: prompt }).first()
    await group.getByLabel(option).check()
    await group.getByRole('button', { name: 'Check' }).click()
  }
  for (const [prompt, chunks] of [
    ['Börja med "I dag".', ['I dag', 'jobbar', 'jag', 'hemma']],
    [
      'Börja med "På lördagar".',
      ['På lördagar', 'handlar', 'vi', 'mat', 'på torget'],
    ],
    ['Gör en ja- eller nej-fråga.', ['Har', 'du', 'tid', 'i morgon']],
    [
      'Börja med "När jag kom hem".',
      ['När jag kom hem,', 'lagade', 'jag', 'mat'],
    ],
  ] as const) {
    const group = page.getByRole('group', { name: prompt, exact: true })
    for (const chunk of chunks)
      await group
        .getByRole('group', { name: 'Words to place' })
        .getByRole('button', { name: chunk, exact: true })
        .click()
    await group.getByRole('button', { name: 'Check' }).click()
    await expect(group.getByRole('status')).toBeVisible()
  }

  await page.goto('./')
  await expect(
    page.getByRole('region', { name: 'Today’s plan' }),
  ).toContainText('1-day streak')

  await page.getByRole('link', { name: 'Progress', exact: true }).click()
  await expect(heading(page, 'Progress')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Ready for D' })).toContainText(
    'Not ready for SFI D yet',
  )
  await expect(page.getByRole('region', { name: 'In numbers' })).toContainText(
    '1day streak',
  )
  await expect(page.locator('[data-date]').last()).toHaveAttribute(
    'aria-label',
    /5 things done/,
  )
  await expect(page.getByText('No mock finished yet.')).toBeVisible()
  await expect(page.getByText('No texts handed in yet.')).toBeVisible()
})
