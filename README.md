# learn-swedish (SFI Prep)

An offline-first web app for passing the Swedish SFI national test at level D, and for everyday Swedish. It is a static site on GitHub Pages, with no accounts. Progress is stored on the device.

The plan is in [`docs/PLAN.md`](docs/PLAN.md). Decisions are in [`docs/DECISIONS.md`](docs/DECISIONS.md), status in [`docs/PROGRESS.md`](docs/PROGRESS.md), and content review in [`docs/CONTENT.md`](docs/CONTENT.md).

## Development

```sh
npm install
npm run dev          # builds content with drafts, then starts Vite at localhost:5173
npm run verify       # lint, typecheck, unit tests, production build, bundle-size check
npm run test:e2e     # Playwright (WebKit, iPhone profile) against a Pages-like server
npm run content      # validate content/ and compile it into public/content/
```

Content lives in `content/` as YAML. Drafts appear only in dev and test builds, until a reviewer marks them `reviewed`.

## Deployment

Every push to `master` runs `verify` in GitHub Actions and deploys `dist/` to `https://imkulwant.github.io/learn-swedish/`. In the repository settings, GitHub Pages must be set to "GitHub Actions" as its source.
