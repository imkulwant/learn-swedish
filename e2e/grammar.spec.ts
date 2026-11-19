import { expect, test, type Page } from '@playwright/test'
import { heading, openToday, storedAttempts } from './helpers.ts'

const exercise = (page: Page, prompt: string) =>
  page.getByRole('group', { name: prompt, exact: true })

/** Taps the chunks of an order exercise in this order, then checks. */
async function build(page: Page, prompt: string, chunks: string[]) {
  const group = exercise(page, prompt)
  for (const chunk of chunks)
    await group
      .getByRole('group', { name: 'Words to place' })
      .getByRole('button', { name: chunk, exact: true })
      .click()
  await group.getByRole('button', { name: 'Check' }).click()
  return group
}

test('a grammar lesson is read, practised and stored, and Today moves on to the next', async ({
  page,
}) => {
  await openToday(page)
  await page.goto('learn')
  const card = page.getByRole('region', { name: 'Grammar' })
  await expect(card).toContainText('Next: lesson 1 of 9, Verbet på plats två')
  await card.getByRole('link', { name: 'Open lesson' }).click()
  await expect(heading(page, 'Verbet på plats två')).toBeVisible()
  // The explanation, with its table.
  await expect(page.getByRole('cell', { name: 'Efter kursen' })).toBeVisible()

  // A chunk can be taken back before checking.
  const first = exercise(page, 'Börja med "I dag".')
  await first.getByRole('button', { name: 'jag', exact: true }).click()
  await first.getByRole('button', { name: 'Remove jag' }).click()
  await expect(
    first
      .getByRole('group', { name: 'Words to place' })
      .getByRole('button', { name: 'jag', exact: true }),
  ).toBeVisible()
  await build(page, 'Börja med "I dag".', ['I dag', 'jobbar', 'jag', 'hemma'])
  await expect(first.getByRole('status')).toContainText('Right')

  // A wrong order shows the right one.
  const second = await build(page, 'Börja med "På lördagar".', [
    'På lördagar',
    'vi',
    'handlar',
    'mat',
    'på torget',
  ])
  await expect(second.getByRole('status')).toContainText(
    'Not quite. The answer is: På lördagar handlar vi mat på torget.',
  )

  await build(page, 'Gör en ja- eller nej-fråga.', [
    'Har',
    'du',
    'tid',
    'i morgon',
  ])
  // Two questions share the prompt "Vilken mening är rätt?".
  const pick = async (n: number, option: string) => {
    const group = exercise(page, 'Vilken mening är rätt?').nth(n)
    await group.getByLabel(option, { exact: true }).check()
    await group.getByRole('button', { name: 'Check' }).click()
  }
  await pick(0, 'I går var jag sjuk.')
  await build(page, 'Börja med "När jag kom hem".', [
    'När jag kom hem,',
    'lagade',
    'jag',
    'mat',
  ])
  await expect(page.getByRole('region', { name: 'Result' })).toHaveCount(0)
  await pick(1, 'På kvällen tittar jag på tv.')

  const result = page.getByRole('region', { name: 'Result' })
  await expect(result).toContainText('5 of 6 right')
  const stored = await storedAttempts(page)
  expect(stored.map((a) => `${a.itemId}:${a.score}`).sort()).toEqual([
    'g-v2-1:1',
    'g-v2-2:0',
    'g-v2-3:1',
    'g-v2-4:1',
    'g-v2-5:1',
    'g-v2-6:1',
  ])
  expect(stored.every((a) => !a.selfMarked)).toBe(true)

  await result.getByRole('link', { name: /Next lesson/ }).click()
  await expect(heading(page, 'Inte i bisatser')).toBeVisible()

  // The list marks the finished lesson, and Today offers the next one.
  await page.goto('learn/grammatik')
  await expect(
    page.getByRole('link', { name: /1\. Verbet på plats två/ }),
  ).toContainText('Done')
  await page.goto('./')
  await expect(
    page.getByRole('link', { name: /Grammar: Inte i bisatser/ }),
  ).toBeVisible()
})

test('typed forms are checked strictly against the accepted answers', async ({
  page,
}) => {
  await openToday(page)
  await page.goto('learn/grammatik/g-perfekt')
  await expect(heading(page, 'Perfekt och pluskvamperfekt')).toBeVisible()

  const gap = exercise(page, 'Skriv verbet i perfekt. (bo)')
  await gap.getByRole('textbox').fill('Bott')
  await gap.getByRole('textbox').press('Enter')
  await expect(gap.getByRole('status')).toContainText('Right')

  const wrong = exercise(page, 'Skriv verbet i perfekt. (läsa)')
  await wrong.getByRole('textbox').fill('läste')
  await wrong.getByRole('button', { name: 'Check' }).click()
  await expect(wrong.getByRole('status')).toContainText(
    'Not quite. The answer is: Har du läst brevet från Skatteverket?',
  )

  const rewrite = exercise(page, 'Skriv meningen i perfekt.').first()
  await rewrite
    .getByRole('textbox')
    .fill('hon har skrivit ett mejl till chefen')
  await rewrite.getByRole('button', { name: 'Check' }).click()
  await expect(rewrite.getByRole('status')).toContainText('Right')

  expect(
    (await storedAttempts(page)).map((a) => `${a.itemId}:${a.score}`).sort(),
  ).toEqual(['g-perfekt-1:1', 'g-perfekt-2:0', 'g-perfekt-6:1'])
})
