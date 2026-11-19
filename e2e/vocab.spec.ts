import { expect, test, type Page } from '@playwright/test'
import { heading, openToday } from './helpers.ts'

const card = (page: Page) => page.getByRole('region', { name: 'Word card' })

async function rate(page: Page, grade: 'Again' | 'Hard' | 'Good' | 'Easy') {
  await page.getByRole('button', { name: 'Show answer' }).click()
  await page
    .getByRole('group', { name: 'How well did you know it?' })
    .getByRole('button', { name: new RegExp(`^${grade}`) })
    .click()
}

const storedCards = (page: Page) =>
  page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('learn-swedish')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const rows = await new Promise<{ id: string; reps: number }[]>(
      (resolve, reject) => {
        const request = db.transaction('cards').objectStore('cards').getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      },
    )
    db.close()
    return rows.map((r) => `${r.id}:${r.reps}`).sort()
  })

test('words are learned in Swedish first, then heard, and kept across a reload', async ({
  page,
}) => {
  await openToday(page)
  // Today's plan points to the words waiting.
  await expect(
    page.getByRole('link', { name: /Practise 15 words/ }),
  ).toBeVisible()
  await page.goto('learn')
  const words = page.getByRole('region', { name: 'Words' })
  await expect(words).toContainText('0 due · 15 new today · 0 learned')
  await words.getByRole('link', { name: 'Practise words' }).click()
  await expect(heading(page, 'Words')).toBeVisible()
  await page.getByRole('button', { name: 'Start' }).click()

  // The first new word, Swedish to English.
  await expect(page.getByText('New word')).toBeVisible()
  await expect(card(page)).toContainText('What does it mean?')
  await expect(card(page)).toContainText('en affär')
  await expect(card(page)).not.toContainText('shop')
  await expect(card(page)).toBeVisible()
  await page.getByRole('button', { name: 'Show answer' }).click()
  await expect(card(page)).toContainText('shop')
  // Focus moves to the most common answer, so a keyboard user can go on.
  await expect(page.getByRole('button', { name: /^Good/ })).toBeFocused()
  await expect(card(page)).toContainText('affärerna')
  await expect(card(page)).toContainText('Affären på hörnet har öppet till klockan 22.')
  // Each answer shows when the card comes back.
  const grades = page.getByRole('group', { name: 'How well did you know it?' })
  await expect(grades.getByRole('button', { name: /^Good/ })).toContainText(
    /\d+ days?/,
  )
  await grades.getByRole('button', { name: /^Good/ }).click()

  // Knowing it once opens listening for that word, due straight away.
  await expect(page.getByText('Review')).toBeVisible()
  await expect(card(page)).toContainText('Listen. What does it mean?')
  await expect(card(page)).not.toContainText('affär')
  await rate(page, 'Good')

  // Then the next new word.
  await expect(card(page)).toContainText('ett pris')
  await rate(page, 'Again')

  // The next new word is on screen, so it has started too, unanswered.
  await expect(card(page)).toContainText('en kassa')
  expect(await storedCards(page)).toEqual([
    'affar:audio:1',
    'affar:sv-en:1',
    'kassa:sv-en:0',
    'pris:sv-en:1',
  ])

  await page.reload()
  await openToday(page)
  // Today's plan counts the words still waiting: 12 new and 1 due.
  await expect(
    page.getByRole('link', { name: /Practise 13 words/ }),
  ).toBeVisible()
  await page.goto('learn')
  await expect(words).toContainText('12 new today')
  await expect(words).toContainText('1 learned')
})

test('the words in the packs are listed under Learn', async ({ page }) => {
  await page.goto('learn')
  await expect(heading(page, 'Learn')).toBeVisible()
  const packs = page.getByRole('region', { name: 'Word packs' })
  await expect(packs).toContainText('Ord – arbete')
  await expect(packs).toContainText('Level D · 30 words')
  await expect(packs).toContainText('Ord – hälsa och vård')
})

test('flashcards flip, move on and shuffle without touching the schedule', async ({
  page,
}) => {
  await openToday(page)
  await page.goto('learn')
  await page
    .getByRole('region', { name: 'Words' })
    .getByRole('link', { name: /Flashcards/ })
    .click()
  await expect(heading(page, 'Flashcards')).toBeVisible()
  await expect(page.getByText('Card 1 of 102')).toBeVisible()
  await expect(card(page)).toContainText('en affär')
  await expect(card(page)).not.toContainText('shop')

  await page.getByRole('button', { name: 'Show answer' }).click()
  await expect(card(page)).toContainText('shop')

  // The next card starts face down.
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText('Card 2 of 102')).toBeVisible()
  await expect(card(page)).not.toContainText('shop')
  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(page.getByText('Card 1 of 102')).toBeVisible()
  // Going back from the first card wraps to the last.
  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(page.getByText('Card 102 of 102')).toBeVisible()

  await page.getByRole('button', { name: 'Shuffle' }).click()
  await expect(page.getByText('Card 1 of 102')).toBeVisible()

  await page.getByRole('button', { name: 'English to Swedish' }).click()
  await expect(card(page)).toContainText('How do you say it in Swedish?')

  // Free practice leaves no spaced-repetition cards behind.
  expect(await storedCards(page)).toEqual([])
})

test('a level C learner gets the two C word packs', async ({ page }) => {
  await openToday(page, { level: 'C' })
  await page.goto('learn')
  const packs = page.getByRole('region', { name: 'Word packs' })
  await expect(packs).toContainText('Ord – handla och tid')
  await expect(packs).toContainText('Ord – hemmet och familjen')
  await expect(packs).toContainText('Level C · 21 words')
  await expect(packs).not.toContainText('Ord – arbete')
  await page.goto('learn/ord/kort')
  await expect(page.getByText('Card 1 of 42')).toBeVisible()
})
