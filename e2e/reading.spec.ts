import { expect, test, type Page } from '@playwright/test'
import { heading, openToday, storedAttempts } from './helpers.ts'

const PACK = 'Läsa D – paket 1'

async function short(page: Page, prompt: string, answer: string) {
  const group = page.getByRole('group', { name: prompt })
  await group.getByRole('textbox').fill(answer)
  await group.getByRole('button', { name: 'Check' }).click()
  return group
}

async function mc(page: Page, prompt: string, option: string) {
  const group = page.getByRole('group', { name: prompt })
  await group.getByLabel(option).check()
  await group.getByRole('button', { name: 'Check' }).click()
  await expect(group.getByRole('status')).toContainText('Right')
}

/** Picks option `n` (counted from 1) for each statement. */
async function match(page: Page, choices: [string, number][]) {
  for (const [q, option] of choices)
    await page.getByLabel(q).selectOption({ index: option })
  await page.getByRole('button', { name: 'Check' }).click()
  await expect(page.getByRole('status')).toContainText(
    `${choices.length} of ${choices.length} right`,
  )
}

const next = (page: Page) =>
  page.getByRole('button', { name: 'Next text' }).click()

test('a D reading drill from Today to a stored result', async ({ page }) => {
  await openToday(page)
  const today = page.getByRole('region', { name: /Readiness, Läsa/ })
  await expect(today).toContainText(
    'Answer 15 questions to see how ready you are (0 so far)',
  )

  await page.getByRole('link', { name: 'Practise reading' }).click()
  await expect(heading(page, 'Läsa – reading')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Level D' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await page.getByRole('link', { name: new RegExp(PACK) }).click()
  await expect(heading(page, PACK)).toBeVisible()
  await expect(
    page.getByText('Draft – not yet checked by a reviewer'),
  ).toBeVisible()

  // Text 1: open answers, one of them judged by the learner, and a choice.
  await short(page, 'Vilken kurs kostar ingenting?', ' svenska i yrkeslivet. ')
  await expect(page.getByRole('status').first()).toContainText('Right')
  await short(page, 'Vad kan man låna på cykelskolan?', 'bara en cykel')
  await expect(page.getByText('Compare with the model answer')).toBeVisible()
  await page.getByRole('button', { name: 'No' }).click()
  await expect(
    page.getByText('Not quite. The answer is: Cykel och hjälm.'),
  ).toBeVisible()
  await short(page, 'Hur många gånger träffas gruppen i datorkunskap?', '6')
  await mc(
    page,
    'Vilken kurs passar bäst för en person som vill förbereda sig inför en anställningsintervju?',
    'Svenska i yrkeslivet',
  )
  await next(page)

  // Text 2: what do the writers want?
  await expect(page.getByText('Text 2 of 6')).toBeVisible()
  await mc(page, 'A. Vad vill Lina?', 'Flytta en tid')
  await mc(page, 'B. Vad vill grannarna?', 'Tacka för något')
  await mc(page, 'C. Vad vill Omar?', 'Klaga på något')
  await next(page)

  // Text 3: interview questions matched to numbered answers.
  await match(page, [
    ['Varför valde du att arbeta inom äldreomsorgen?', 3],
    ['Hur hinner du med både jobbet och studierna?', 1],
    ['Vad är det svåraste med ditt arbete?', 5],
    ['Var ser du dig själv om fem år?', 6],
  ])
  await next(page)

  // Text 4: who is the text for?
  await mc(page, 'Text A vänder sig till …', 'hyresgäster')
  await mc(page, 'Text B vänder sig till …', 'föräldrar')
  await next(page)

  // Text 5: who thinks what, matched to names.
  await match(page, [
    ['Personen kan inte arbeta hemifrån på grund av sitt yrke.', 3],
    ['Personen tycker att det är svårt att fokusera hemma.', 4],
    ['Personen använder tiden som hen sparar till motion.', 1],
    ['Personen tycker att gemenskapen på jobbet är viktig.', 2],
  ])
  await next(page)

  // Text 6: the longer article.
  await mc(
    page,
    'Vad handlar artikeln främst om?',
    'Att fler personer cyklar till jobbet, även på vintern.',
  )
  await mc(
    page,
    'Varför cyklar fler på vintern nu än tidigare?',
    'Cykelvägarna sköts bättre när det snöar.',
  )
  await short(page, 'Hur långt cyklar Linnea Berg till jobbet?', 'Sex km')
  await mc(
    page,
    'Vad menar Erik Holm när han säger att ”en bil klarar lite snö bättre än en cykel gör”?',
    'Han förklarar varför cykelvägarna plogas först.',
  )
  await mc(
    page,
    'Vad är kommunens mål till år 2030?',
    'Att hälften av resorna till jobb och skola ska ske utan bil.',
  )
  await page.getByRole('button', { name: 'See result' }).click()

  await expect(page.getByRole('region', { name: 'Result' })).toContainText(
    '21 of 22 points',
  )

  const rows = await storedAttempts(page)
  expect(rows).toHaveLength(16)
  expect(rows.filter((r) => r.selfMarked)).toEqual([
    expect.objectContaining({ itemId: 'd-lasa-1-kurser-lana', score: 0 }),
  ])

  // The result survives a reload and shows on Today.
  await page.reload()
  await openToday(page)
  await expect(today).toContainText('95%')
  await expect(today).toContainText('Ready')
  await expect(today).toContainText('not an official score')
})

test('an answer is stored the moment it is checked', async ({ page }) => {
  await page.goto('exam/lasa/d-lasa-1')
  await short(
    page,
    'Hur många gånger träffas gruppen i datorkunskap?',
    'sex gånger',
  )
  await expect(page.getByRole('status').first()).toContainText('Right')

  await page.reload()
  await expect(heading(page, PACK)).toBeVisible()
  expect(await storedAttempts(page)).toEqual([
    expect.objectContaining({
      itemId: 'd-lasa-1-kurser-ganger',
      score: 1,
      selfMarked: false,
    }),
  ])
})

test('level C has no reviewed texts yet and says so', async ({ page }) => {
  await page.goto('exam/lasa')
  await page.getByRole('button', { name: 'Level C' }).click()
  await expect(page.getByText('No reading texts for C yet')).toBeVisible()
})

/** Makes the next write to IndexedDB fail with the named error, once. */
async function failNextWrite(page: Page, name: string) {
  await page.evaluate((errorName) => {
    const add = IDBObjectStore.prototype.add
    IDBObjectStore.prototype.add = function () {
      IDBObjectStore.prototype.add = add
      throw new DOMException('Simulated failure', errorName)
    }
  }, name)
}

const INTERVIEW =
  'Vilken kurs passar bäst för en person som vill förbereda sig inför en anställningsintervju?'

test('a failed save leaves the question open to check again', async ({
  page,
}) => {
  await page.goto('exam/lasa/d-lasa-1')
  const group = page.getByRole('group', { name: INTERVIEW })
  await group.getByLabel('Svenska i yrkeslivet').check()

  await failNextWrite(page, 'DataError')
  await group.getByRole('button', { name: 'Check' }).click()
  await expect(group.getByRole('alert')).toHaveText(
    'Your answer could not be saved. Try again.',
  )
  await expect(group.getByRole('status')).toHaveCount(0)
  expect(await storedAttempts(page)).toEqual([])

  await group.getByRole('button', { name: 'Check' }).click()
  await expect(group.getByRole('status')).toContainText('Right')
  await expect(group.getByRole('alert')).toHaveCount(0)
  expect(await storedAttempts(page)).toHaveLength(1)
})

test('a device that refuses writes blocks the app with a message', async ({
  page,
}) => {
  await page.goto('exam/lasa/d-lasa-1')
  const group = page.getByRole('group', { name: INTERVIEW })
  await group.getByLabel('Svenska i yrkeslivet').check()

  await failNextWrite(page, 'QuotaExceededError')
  await group.getByRole('button', { name: 'Check' }).click()

  await expect(
    page.getByRole('dialog', { name: 'Could not save to this device' }),
  ).toBeVisible()
})
