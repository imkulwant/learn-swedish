// Renders the app icons and iPhone startup images into public/.
//
// Run with `npm run icons` after changing the glyph or the colours below, and
// paste the printed <link rel="apple-touch-startup-image"> tags into index.html.
// Uses the Playwright WebKit that `npm run test:e2e` already needs.
import { mkdir, writeFile } from 'node:fs/promises'
import { devices, webkit } from '@playwright/test'

const BG = '#142638'
const BLUE = '#2F6FD6'
const YELLOW = '#FFCC00'
const OUT = new URL('../public/', import.meta.url)

// An original glyph, drawn on a 1024 x 1024 grid: a speech bubble with a
// check mark, for "speak Swedish, pass the test".
const GLYPH = `
  <path d="M232 220h560a72 72 0 0 1 72 72v352a72 72 0 0 1-72 72H500l-170 128v-128h-98a72 72 0 0 1-72-72V292a72 72 0 0 1 72-72z" fill="${BLUE}"/>
  <path d="M352 470l118 118 210-236" fill="none" stroke="${YELLOW}" stroke-width="72" stroke-linecap="round" stroke-linejoin="round"/>`

const iconSvg = (size) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="${BG}"/>${GLYPH}
  </svg>`

// Portrait iPhone screens from Playwright's device data: iPhone 12 and newer,
// one entry per distinct screen size and pixel ratio.
function startupScreens() {
  const seen = new Map()
  for (const [name, device] of Object.entries(devices)) {
    if (!/^iPhone (1[2-9]|Air)/.test(name) || name.includes('landscape')) {
      continue
    }
    const { width, height } = device.screen
    const ratio = device.deviceScaleFactor
    seen.set(`${width}x${height}@${ratio}`, { width, height, ratio })
  }
  return [...seen.values()].sort(
    (a, b) => a.width - b.width || a.height - b.height,
  )
}

async function render(browser, { width, height, ratio = 1 }, html, file) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: ratio,
  })
  const page = await context.newPage()
  await page.setContent(
    `<style>html,body{margin:0;background:${BG}}svg{display:block}</style>${html}`,
  )
  await writeFile(new URL(file, OUT), await page.screenshot({ type: 'png' }))
  await context.close()
}

await mkdir(new URL('icons/', OUT), { recursive: true })
await writeFile(new URL('favicon.svg', OUT), iconSvg(64).trim() + '\n')

const browser = await webkit.launch()
for (const [file, size] of [
  ['icons/apple-touch-icon-180.png', 180],
  ['icons/icon-192.png', 192],
  ['icons/icon-512.png', 512],
]) {
  await render(browser, { width: size, height: size }, iconSvg(size), file)
  console.log(`wrote public/${file}`)
}

const links = []
for (const { width, height, ratio } of startupScreens()) {
  const file = `icons/startup-${width * ratio}x${height * ratio}.png`
  // The glyph takes 40% of the screen width, centred.
  const glyph = Math.round(width * 0.4)
  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${BG}"/>
      <svg x="${(width - glyph) / 2}" y="${(height - glyph) / 2}" width="${glyph}" height="${glyph}" viewBox="0 0 1024 1024">${GLYPH}</svg>
    </svg>`
  await render(browser, { width, height, ratio }, html, file)
  console.log(`wrote public/${file}`)
  links.push(
    `    <link rel="apple-touch-startup-image" media="(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)" href="/${file}" />`,
  )
}
await browser.close()

console.log('\nPaste into the <head> of index.html:\n')
console.log(links.join('\n'))
