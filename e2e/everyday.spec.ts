import { expect, test, type Page } from '@playwright/test'
import { heading, openToday, storedAttempts } from './helpers.ts'

test.use({ permissions: ['microphone'] })

const rolePlay = (page: Page) =>
  page.getByRole('region', { name: 'Discussion', exact: true })

async function skipPartner(page: Page) {
  await page.waitForFunction(() => {
    const a = document.querySelector<HTMLAudioElement>(
      'section[aria-label="Discussion"] audio',
    )
    return !!a && a.readyState >= 1 && !a.paused
  })
  await page.evaluate(() => {
    const a = document.querySelector<HTMLAudioElement>(
      'section[aria-label="Discussion"] audio',
    )!
    a.currentTime = Math.max(0, a.duration - 0.05)
  })
}

test('a scenario has phrases to hear, a dialogue with stored answers, and a role-play with hints', async ({
  page,
}) => {
  await openToday(page)
  await page.getByRole('link', { name: 'Everyday' }).click()
  await expect(heading(page, 'Everyday')).toBeVisible()
  await page.getByRole('link', { name: /Ringa vårdcentralen/ }).click()
  await expect(heading(page, 'Ringa vårdcentralen')).toBeVisible()

  // A phrase plays when tapped.
  await page
    .getByRole('button', { name: /^Play: Jag skulle vilja boka en tid\./ })
    .click()
  await page.waitForFunction(
    () =>
      !document.querySelector<HTMLAudioElement>(
        'section[aria-label="Phrases"] audio',
      )!.paused,
  )

  // The dialogue: answers are stored, and the transcript opens at the end.
  await page.getByRole('button', { name: 'Dialogue' }).click()
  const dialogue = page.getByRole('region', { name: 'Dialogue' })
  await dialogue.getByLabel('Han vill boka en tid.').check()
  await dialogue
    .getByRole('group', { name: 'Varför ringer Ali?' })
    .getByRole('button', { name: 'Check' })
    .click()
  await dialogue
    .getByRole('textbox', { name: 'Sedan när har Ali varit sjuk?' })
    .fill('sedan i söndags')
  await dialogue
    .getByRole('group', { name: 'Sedan när har Ali varit sjuk?' })
    .getByRole('button', { name: 'Check' })
    .click()
  await dialogue.getByLabel('I morgon klockan 9.15').check()
  await dialogue
    .getByRole('group', { name: 'När får Ali en tid?' })
    .getByRole('button', { name: 'Check' })
    .click()
  await expect(dialogue.getByText('Transcript', { exact: true })).toHaveCount(0)
  // Answers survive a look at another part.
  await page.getByRole('button', { name: 'Phrases' }).click()
  await page.getByRole('button', { name: 'Dialogue' }).click()
  await expect(
    dialogue
      .getByRole('group', { name: 'När får Ali en tid?' })
      .getByRole('status'),
  ).toBeVisible()
  await dialogue.getByLabel('Ringa 1177').check()
  await dialogue
    .getByRole('group', { name: /blir sämre i natt/ })
    .getByRole('button', { name: 'Check' })
    .click()
  await expect(dialogue.getByText('Transcript', { exact: true })).toBeVisible()
  const stored = await storedAttempts(page)
  expect(stored.map((a) => `${a.itemId}:${a.score}`).sort()).toEqual([
    'v-vardcentralen-1:1',
    'v-vardcentralen-2:1',
    'v-vardcentralen-3:1',
    'v-vardcentralen-4:1',
  ])

  // The role-play, with a hint for each answer.
  await page.getByRole('button', { name: 'Role-play' }).click()
  await rolePlay(page)
    .getByRole('button', { name: 'Start the role-play' })
    .click()
  for (let turn = 1; turn <= 4; turn++) {
    await skipPartner(page)
    await expect(rolePlay(page)).toContainText('For example:')
    await rolePlay(page).getByRole('button', { name: 'Answer' }).click()
    await expect(rolePlay(page)).toContainText('● Recording your answer')
    await page.waitForTimeout(300)
    await rolePlay(page).getByRole('button', { name: 'Done' }).click()
  }
  await skipPartner(page)
  await expect(
    page.getByRole('heading', { name: 'What you could have said' }),
  ).toBeVisible()
  await expect(
    page
      .locator('section[aria-labelledby="conversation"]')
      .getByRole('listitem'),
  ).toHaveCount(9)
  await page.getByRole('button', { name: 'Play it again' }).click()
  const sessions = page
    .locator('section[aria-labelledby="sessions"]')
    .getByRole('listitem')
  await expect(sessions).toHaveCount(1)
  await expect(sessions.first()).toContainText('4 answers')
  await expect(sessions.first()).not.toContainText('assessed')
})
