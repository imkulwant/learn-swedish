import { expect, test } from '@playwright/test'

// What GitHub Pages does that a typical dev server hides. These run against
// scripts/serve-pages.mjs, which behaves like Pages: a path prefix, real 404s
// and no index fallback.
const BASE = '/learn-swedish/'

const heading = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('heading', { name, level: 1 })

test.describe('GitHub Pages hosting', () => {
  test('answers an unknown path with a 404 that still carries the app', async ({
    request,
  }) => {
    const response = await request.get('exam/lasa/d-lasa-1')

    expect(response.status()).toBe(404)
    expect(await response.text()).toContain('<div id="root">')
  })

  test('opens a deep link on the first visit despite the 404 status', async ({
    page,
  }) => {
    const response = await page.goto('exam/lasa')

    expect(response!.status()).toBe(404)
    await expect(heading(page, 'Läsa – reading')).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Back', exact: true }),
    ).toBeVisible()
  })

  test('opens a deep link with no network after the service worker is ready', async ({
    page,
    context,
  }) => {
    await page.goto('exam/lasa/d-lasa-1')
    await expect(heading(page, 'Läsa D – paket 1')).toBeVisible()
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload()

    await context.setOffline(true)
    await page.reload()

    // The pack itself comes from the service worker's cache.
    await expect(heading(page, 'Läsa D – paket 1')).toBeVisible()
    await expect(
      page.getByText('Vuxenskolan i Lindvik – kurser i vår'),
    ).toBeVisible()
  })

  test('sends every request to a path under the deployment prefix', async ({
    page,
  }) => {
    const outside: string[] = []
    page.on('request', (request) => {
      const { pathname } = new URL(request.url())
      if (!pathname.startsWith(BASE)) outside.push(pathname)
    })

    await page.goto('./')
    await expect(heading(page, 'Today')).toBeVisible()
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.goto('exam/lasa/d-lasa-1')
    await expect(heading(page, 'Läsa D – paket 1')).toBeVisible()

    // A leaked absolute path such as /icons/x.png would land here: it works on
    // a dev server at the root and 404s once deployed under a prefix.
    expect(outside).toEqual([])
  })

  test('registers the service worker for the whole deployment prefix', async ({
    page,
  }) => {
    await page.goto('./')
    await expect(heading(page, 'Today')).toBeVisible()

    const registration = await page.evaluate(async () => {
      const ready = await navigator.serviceWorker.ready
      return { scope: new URL(ready.scope).pathname }
    })

    expect(registration.scope).toBe(BASE)
  })

  test('redirects the bare prefix to its trailing-slash address', async ({
    request,
  }) => {
    const response = await request.get('/learn-swedish', {
      maxRedirects: 0,
    })

    expect(response.status()).toBe(301)
    expect(response.headers()['location']).toBe(BASE)
  })
})
