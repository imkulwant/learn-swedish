import { expect, test, type Page } from '@playwright/test'
import { heading, openToday } from './helpers.ts'

test.use({ permissions: ['microphone'] })

const discussion = (page: Page) =>
  page.getByRole('region', { name: 'Discussion', exact: true })

/** Skips to the end of the partner's line, so the test need not wait for it. */
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

test('a discussion with the scripted partner works offline, is stored turn by turn and self-assessed', async ({
  page,
  context,
}) => {
  await openToday(page)
  await page.goto('exam/tala')
  await page.getByRole('link', { name: /Att trivas på jobbet/ }).click()
  await expect(heading(page, 'Att trivas på jobbet')).toBeVisible()

  // Store the partner's audio, then lose the connection.
  await page
    .getByRole('link', { name: 'Back' })
    .or(page.getByRole('button', { name: 'Back' }))
    .click()
  await page.getByRole('button', { name: 'Download audio' }).click()
  await expect(
    page.getByText(/^All \d+ clips are on this device/),
  ).toBeVisible()
  await context.setOffline(true)
  await page.goto('exam/tala/par/p-trivas-jobbet')
  await expect(page.getByRole('region', { name: 'Mind map' })).toContainText(
    'Vad är viktigast för att trivas på jobbet?',
  )

  await discussion(page)
    .getByRole('button', { name: 'Start the discussion' })
    .click()
  for (let turn = 1; turn <= 5; turn++) {
    await expect(discussion(page)).toContainText(
      `The partner speaks (${turn} of 5)`,
    )
    await skipPartner(page)
    await discussion(page).getByRole('button', { name: 'Answer' }).click()
    await expect(discussion(page)).toContainText('● Recording your answer')
    await page.waitForTimeout(400)
    await discussion(page).getByRole('button', { name: 'Done' }).click()
  }
  await expect(discussion(page)).toContainText(
    'The partner ends the conversation',
  )
  await skipPartner(page)

  // The review: the whole discussion in order, then the assessment.
  await expect(
    page.getByRole('heading', { name: 'The conversation' }),
  ).toBeVisible()
  const parts = page
    .locator('section[aria-labelledby="conversation"]')
    .getByRole('listitem')
  await expect(parts).toHaveCount(11)
  await expect(parts.nth(1)).toContainText('You: Your answer')
  await expect(parts.last()).toContainText('Tack för ett trevligt samtal!')
  for (const criterion of [
    'Answering',
    'Opinions',
    'Asking',
    'Moving on',
    'Agreeing',
    'Language',
  ])
    await page
      .getByRole('group', { name: new RegExp(`^${criterion}\\.`) })
      .getByLabel('Partly')
      .check()
  await page.getByRole('button', { name: 'Save assessment' }).click()
  await expect(page.getByRole('region', { name: 'Result' })).toContainText(
    '50%',
  )
  await page.getByRole('button', { name: 'Done' }).click()

  const sessions = page
    .locator('section[aria-labelledby="sessions"]')
    .getByRole('listitem')
  await expect(sessions).toHaveCount(1)
  await expect(sessions.first()).toContainText('5 answers')
  await expect(sessions.first()).toContainText('Assessed · 50%')
})

test('with a friend, the mind map comes with a 10-minute timer', async ({
  page,
}) => {
  await openToday(page)
  await page.goto('exam/tala/par/p-lara-svenska')
  await page.getByRole('button', { name: 'With a friend' }).click()
  const friend = page.getByRole('region', { name: 'With a friend' })
  await expect(friend.getByRole('timer')).toHaveText('10:00')
  await friend.getByRole('button', { name: 'Start 10 minutes' }).click()
  await expect(friend.getByRole('timer')).toHaveText(/^9:5\d$/)
  await page.getByText('Phrases for the discussion').click()
  await expect(page.getByText('Jag förstår vad du menar, men …')).toBeVisible()
})
