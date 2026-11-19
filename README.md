# learn-swedish (SFI Prep)

An offline-first web app for passing the Swedish SFI national test at level D, and for everyday Swedish. It is a static site on GitHub Pages, with no accounts. Progress is stored on the device, and no request ever leaves the app's own site.

Live at <https://imkulwant.github.io/learn-swedish/>. On an iPhone, open it in Safari and choose Share → Add to Home Screen.

The plan is in [`docs/PLAN.md`](docs/PLAN.md). Decisions are in [`docs/DECISIONS.md`](docs/DECISIONS.md), status in [`docs/PROGRESS.md`](docs/PROGRESS.md), and content review in [`docs/CONTENT.md`](docs/CONTENT.md).

## What it has

- **Today:** a daily plan (words due, the weakest part, the next grammar lesson, writing and speaking each week, mock parts before the test), the test countdown, a streak and readiness for each part.
- **Exam:** practice for the four parts of the test in its formats. That is Läsa and Höra drills, Skriva with a check panel, model answers and self-assessment, and Tala with recording, a solo task and a pair discussion with a scripted partner. Timed mock exams that resume after the app closes.
- **Learn:** word practice with spaced repetition (FSRS) and audio, and grammar lessons with exercises.
- **Everyday:** scenarios such as calling the health centre, with phrases, a dialogue and a role-play.
- **Progress:** "Ready for D", readiness, a study calendar, mock history and an archive of texts.
- **Settings:** level and test date, backup and restore, recordings and storage.

All Swedish content is original and reviewed by a native speaker before it ships. Readiness and mock results are the app's own estimates, not official scores, and the mock timings are estimates too: Skolverket publishes only a total.

## Development

```sh
npm install
npm run dev          # builds content with drafts, then starts Vite at localhost:5173
npm run verify       # lint, typecheck, unit tests, production build, bundle-size check
npm run test:e2e     # Playwright (WebKit, iPhone profile) against a Pages-like server
npm run content      # validate content/ and compile it into public/content/
```

Content lives in `content/` as YAML, one folder per kind:

| Folder | Content |
| --- | --- |
| `reading/`, `listening/` | Läsa and Höra drill packs |
| `writing/`, `speaking/` | Skriva prompts, Tala solo tasks and pair discussions |
| `vocab/`, `grammar/` | word packs and grammar lessons |
| `everyday/` | everyday scenarios |
| `mocks/` | mock exams, with items used nowhere else |

Audio is made with Piper text-to-speech and committed, so CI never needs it:

```sh
scripts/setup-audio.sh   # once, on a Mac: Piper and two Swedish voices into .tools/
npm run audio            # make or update content/audio/*.m4a after changing any spoken line
```

Drafts appear only in dev and test builds, until a reviewer marks them `reviewed`. How to review each kind of pack is in [`docs/CONTENT.md`](docs/CONTENT.md).

## Data and privacy

Everything is stored in the browser's IndexedDB on the device. Settings → Backup saves a JSON file with answers, words, texts and mock sittings, and restores it on another phone. Recordings stay on the device and are not in backups. There are no accounts and no analytics, and the Content-Security-Policy allows only the app's own origin. An end-to-end test checks that no request leaves it.

## Deployment

Every push to `master` runs `verify` in GitHub Actions and deploys `dist/` to `https://imkulwant.github.io/learn-swedish/`. In the repository settings, GitHub Pages must be set to "GitHub Actions" as its source.
