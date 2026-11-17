# SFI Prep PWA: Product and Implementation Plan

Nov 17, 2026 · for Kul · working name "SFI Prep" (repo `learn-swedish`)

## Context

Kul wants a second GitHub Pages PWA, alongside `workout-tracker-pwa`, that gets an immigrant learner through the SFI national test at level **D** and makes them comfortable in everyday Swedish conversations. All content is built around the test: its four parts, its task formats, and the official pass criteria.

Decisions already made with Kul:

| Area | Decision |
| --- | --- |
| Levels | **C and D only.** The learner already reads basic Swedish. C is the bridge, D is the goal. No A/B content. |
| Writing and speaking feedback | **Offline in v1**: model answers, checklists from the official criteria, voice recording, automatic hints. An optional AI tutor is a later phase (Phase 13). |
| UI language | **English**, with Swedish content. Content files keep translations in a per-language field, so more languages can be added later without code changes. |
| Content review | All Swedish content is original and AI-drafted. **A native speaker or SFI teacher reviews every content pack before it ships.** |
| Stack and hosting | Same as workout-tracker-pwa: static, offline-first, no accounts, data on the device, at `https://imkulwant.github.io/learn-swedish/`. |

## What the exam is (verified 17 Nov 2026, the content spec)

- **New syllabus from 2027.** KP27 (SKOLFS 2026:67) applies to SFI courses that start after 31 Dec 2026. The first new national tests for B, C and D are on 18 Jan 2027. Grading is Godkänt (pass) or not passed. Courses started before 2027 keep the old syllabus (SKOLFS 2017:91, grades A–F) and the old tests. Both tests have the same four parts, so the practice serves both.
- **2D and 3D are one target.** The two courses have identical central content and pass criteria, so the app has a single "D" track.
- **The four parts at C and D** (Skolverket and SU):
  - **Läsa:** two booklets of shorter and longer texts. Formats are open questions, multiple choice and matching. C and D always include a longer article.
  - **Höra:** monologues, dialogues, public announcements (*högtalarutrop*) and news items, with open and multiple-choice questions.
  - **Skriva:** one informal task at C. At D there are **two tasks, one of them formal**.
  - **Tala:** a solo task plus a pair discussion. At D, the solo task is "Berätta och ge råd" for 3–4 minutes with planning time. The pair task is about 10 minutes with a mind map, and the pair must agree on what matters most. The test checks that the learner moves the discussion forward, asks for and gives information, and states and answers opinions with simple arguments.
- **Official D reading formats:**
  - "Hitta information": ads and notices.
  - Messages: what does the writer want?
  - Diagrams.
  - "Para ihop frågor och svar": interview questions matched to answers (D only).
  - "Vem vänder sig texten till?": who the text is written for (D only).
  - "Vem tycker vad?": opinions from a chat page matched to names (D only).
- **Pass criteria for D (KP27, quoted in short):**
  - Understands clearly spoken Swedish on familiar topics.
  - Understands texts on familiar topics.
  - Speaks *begripligt, till viss del sammanhängande, med viss anpassning till syfte och mottagare* (understandably, partly connected, partly adapted to purpose and listener). Keeps a conversation going in a mostly working way.
  - Writes simple informal **and more formal** texts with a mostly working structure, uses grammar with some confidence, and shows some variation.
- **No real past tests are available.** SFI tests are confidential and kept locked, and students may not take them home. Only Skolverket's example tasks are public. The app therefore **copies exact formats, never real items**, and links to the official examples.
- **Why D matters for citizenship.** Since 6 Jun 2026, a passing SFI D grade is one way to prove the Swedish requirement for citizenship.
- **Not verified, confirm with the reviewer:**
  - Duration of each part.
  - How many times each audio clip is played.
  - Whether dictionaries are allowed.
  - Expected length of the writing tasks.

  These are named constants in `src/domain/examFormat.ts`.

Sources: [SKOLFS 2026:67](https://skolfs.skolverket.se/api/document/GRUNDFORFATTNING/2026:67/pdf), [SU on KP27](https://www.su.se/enheter/nationellt-centrum-for-svenska-som-andrasprak/rad-och-stod/vanliga-fragor/vad-innebar-de-nya-kursplanerna-i-svenska-for-invandrare-sfi), [Skolverket: delprov och innehåll](https://www.skolverket.se/prov-och-bedomning/nationella-prov/nationella-prov-pa-papper/delprov-och-innehall/delprov-och-innehall---komvux-svenska-for-invandrare), [Skolverket: exempeluppgifter](https://www.skolverket.se/prov-och-bedomning/nationella-prov/bestall-nationella-prov/gamla-nationella-prov), [SU FAQ](https://www.su.se/enheter/nationella-prov-i-sfi/om-sfi-proven/vanliga-fragor-och-svar), [Migrationsverket](https://www.migrationsverket.se/nyheter/nyhetsarkiv/2026-05-06-nya-regler-for-svenskt-medborgarskap-fran-6-juni-2026.html).

## Features

Five tabs, left to right: **Today, Learn, Exam, Everyday, Progress**. Settings opens from Today.

**Onboarding**
- Pick a target level, C or D.
- Optionally enter the exam date, which gives a countdown.
- Optional 20-item placement check that recommends C or D. The learner can override it.

**Today**
- The daily plan, built by rules in `domain/studyPlan.ts`:
  1. Flashcards that are due.
  2. A 10-minute focus drill on the weakest test part.
  3. The next grammar lesson.
  4. Writing and speaking twice a week each.
  5. In the last 21 days before the exam, one mock part per day. Full mocks on day −7 and day −3.
- Exam countdown, readiness rings for the four parts, streak, and the update and backup banners.

**Exam**
- **Exam guide:**
  - What happens on test day.
  - Each part explained.
  - The pass criteria in plain English.
  - Strategies, such as reading the questions before the text and listening for keywords.
  - Links to Skolverket's example tasks, how to sit the test as an external candidate (*prövning*) through your kommun, and the note about old and new syllabus.
- **Part drills (Läsa, Höra, Skriva, Tala)** for C or D, in the exact official formats.
  - Feedback comes right after each answer. Explanations point to where the answer is in the text or transcript.
- **Mock exams:** full C and D tests in exam order, timed, with no feedback until the end.
  - They resume if iOS kills the app.
  - The result report covers each part, with a review of every item.
  - Mock items are never used in drills, so remembered answers can't inflate scores.

**Learn**
- **Vocabulary:** spaced repetition with FSRS. Three card types:
  - Swedish to English.
  - English to Swedish, unlocked after two correct recognitions.
  - Audio to meaning.
- Every word has en/ett, plural or verb forms, an example sentence and audio.
- Decks follow the test themes: work, studies, housing, family and friends, leisure, shopping, traffic, culture, environment, economy, health care, society and authorities.
- In any reading text, tapping a word adds it to the learner's deck if it is in the lexicon.
- **Grammar lessons**, mapped to KP27 *Språkliga företeelser*, with exercises:
  - A word-order builder for V2 and the BIFF rule.
  - Inflection fill-ins for tense, definite forms and agreement.
  - Choosing the right linking word (*sambandsord*).
  - Transforms, for example present to perfect.
- **Pronunciation:**
  - Long and short vowels, the sj/tj sounds, the two word accents and sentence melody.
  - The learner listens, records, and compares with the model.

**Everyday**
- 15 everyday scenarios:
  1. Calling the health centre or 1177.
  2. The pharmacy.
  3. Calling in sick or VAB.
  4. Job interview.
  5. First day at work and fika.
  6. Arbetsförmedlingen and study or career guidance.
  7. Reporting a fault to the landlord.
  8. Neighbours and the laundry room.
  9. Preschool and school, including the development talk.
  10. Shopping and returning items.
  11. Public transport.
  12. The bank and BankID.
  13. Skatteverket and change of address.
  14. Café and restaurant.
  15. Making and declining plans by text message.
- Each scenario has:
  - A key-phrase bank with audio.
  - A dialogue to listen to, with questions.
  - A role-play: a scripted partner plays its lines, and the learner records theirs.
- These overlap on purpose with D speaking topics, such as interviews, workplace talk, and giving or asking for information.

**Writing (Skriva)**
- Informal and formal prompts.
- Autosaving editor with word count and an optional timer.
- **Check panel** of pure heuristics in `domain/writingChecks.ts`, shown as "check this", never as errors:
  - Word count and paragraph count.
  - Greeting and closing that fit the register.
  - Linking words used.
  - Possible V2 inversion misses, for example "Igår jag…".
  - Possible BIFF misses (*inte* placement in a subordinate clause).
  - Repeated words.
- After submitting, the learner sees an annotated model answer at pass level and self-assesses against a rubric made from the D criteria (6 criteria, 0–2 each).
- Text can be shared with a teacher through the share sheet.

**Speaking (Tala)**
- **Solo task:** planning timer, recording with a visible 3–4 minute timer, playback, model answer as audio and transcript, then the rubric.
- **Pair discussion**, in two modes:
  - Scripted partner: TTS turns with gaps where the learner records. The lines are generic, so they work whatever the learner says.
  - With a friend: mind map, phrase cards for moving the talk forward ("Vad tycker du?", "Jag håller med, men…"), and a 10-minute timer.
- Recordings are kept on the device. The learner can star them and delete old ones.

**Progress**
- Readiness for each part.
- Study calendar heatmap.
- Mock history.
- Words known.
- Archive of writing and recordings.

**Settings**
- Target level and exam date.
- Daily goal.
- Playback speed: 0.75× or 1×. Mocks always run at 1×.
- English translations on or off, for immersion.
- Download audio for offline use, and storage usage.
- Clean up recordings.
- Backup and restore.
- About, sources and licences.
- **Report a mistake** on every item: opens a prefilled GitHub issue with the item ID and content version.

## Key definitions (specification, `src/domain`)

| Concept | Definition |
| --- | --- |
| Answer check | Normalize the answer: NFC, lower case, trim, collapse spaces, strip surrounding punctuation. Then compare it with the item's `accept[]` list. Multiple choice and matching are exact. If an open answer has no match, show the model answer and let the learner mark it themselves (`selfMarked: true`). |
| Readiness, Läsa and Höra | Weighted percent correct over the last 40 scored items of that level and part. Mock items count double. Needs at least 15 items, otherwise "Not enough practice". |
| Readiness, Skriva and Tala | Mean rubric percent over the last 5 self-assessed tasks. Needs at least 3. Labelled "self-assessed". |
| Readiness bands | Below 60 is Not yet, 60–74 is Almost, 75 or more is Ready. These are named constants in `domain/readiness.ts`. **They are not official cut scores**, which I did not find published, and the UI says so. |
| "Ready for D" | All four parts are Ready, and at least one full D mock has every part at 75 or more. |
| Flashcards | `ts-fsrs` with target retention 0.9. Default 15 new cards a day, at most 150 reviews a day. Ratings are Again, Hard, Good and Easy. |
| Streak and calendar | Days with at least 5 minutes of active study. Weeks start Monday, local dates, using `dates.ts` from the workout app. |

## Content

**Volume targets for v1.** Each row is built and reviewed as separate packs.

| Type | C | D |
| --- | --- | --- |
| Reading texts, about 5 items each | 30 | 40 |
| Listening clips, of the four official kinds | 25 | 35 |
| Writing prompts, each with an annotated model answer | 6 informal | 7 informal + 7 formal |
| Speaking: solo tasks and pair mind maps | 10 and 8 | 15 and 12 |
| Mock exams, using items found nowhere else | 2 | 4 |
| Vocabulary | about 1,200 headwords across C and D, in 13 themes | |
| Grammar lessons | about 24, in sequence | |
| Everyday scenarios | 15 | |

**Authoring rules**
1. All material is original. Never copy from real tests, textbooks, or Skolverket's example tasks; link to the examples instead.
2. Businesses and towns are fictional, as Skolverket does with "Bromby". Real authorities such as 1177, Försäkringskassan and Skatteverket appear only with generic, accurate facts, never invented rules.
3. Every item is tagged with the KP27 3D central-content point it trains, for example `lyssna-lasa.tabeller-diagram-kartor`. A **coverage test fails if any point has no items**.
4. Level control:
   - C texts are shorter and use high-frequency words.
   - D texts are longer, include formal register, and include inference questions, as KP27 asks for *dra slutsatser* and *läsa mellan raderna*.
   - Word-count ranges per text type are constants.
5. Each item has a lifecycle: `status: draft → reviewed` plus `reviewedBy` and `reviewedAt`. **Production builds ship only reviewed items.** Preview builds with `INCLUDE_DRAFTS=1` show drafts with a badge.

**Review workflow, for each pack**
1. The agent drafts the pack.
2. `npm run content:check`.
3. `npm run content:review-sheet <pack>` writes a printable HTML file with item IDs, answers and transcripts.
4. **[HUMAN]** The reviewer marks it up.
5. The agent applies the fixes.
6. **[HUMAN]** `npm run content:approve <pack> --reviewer <name>`.

Status is tracked in `docs/CONTENT.md`.

## Architecture

**Stack:** the same as workout-tracker-pwa (React 19, TypeScript strict, Vite, `vite-plugin-pwa` with `registerType: 'prompt'`, Dexie, Tailwind, Zod with `jitless`, react-router, Vitest with fake-indexeddb, Playwright WebKit with iPhone profile, axe).

New dependencies, each to be recorded in `DECISIONS.md`:

| Dependency | Kind | Purpose |
| --- | --- | --- |
| `ts-fsrs` | runtime | Scheduler for spaced repetition. MIT licence, open-spaced-repetition. |
| `yaml` | dev | Parses content sources. |
| `marked` | dev | Turns lesson Markdown into a JSON token tree at build time. React renders the tree, so there is no runtime parser and no `innerHTML`. |

**Reuse from `../workout-tracker-pwa`** (copy and adapt, don't share a package):
- Config: `vite.config.ts` (with `PAGES_BASE = '/learn-swedish/'`, `spaFallback404`, `securityMeta`), `csp.ts`, `eslint.config.js` with layer boundaries, `vitest.config.ts`, `playwright.config.ts`.
- Scripts: `scripts/serve-pages.mjs`, `check-bundle-size.mjs`, `generate-icons.mjs`, `.github/workflows/verify.yml`.
- App shell: `src/app/{AppShell,TabBar,Boot,ErrorBoundary,StorageFailureGate,RestoreScreen}.tsx`.
- UI components: `src/ui/*`, including ModalShell, Sheet, Dialog, Toast, Screen, Loading, Switch and Chip.
- Platform code: `src/platform/{storage,share,updates,storageFailure,dataMarker}.ts`.
- Backup and settings: `src/data/backup/{export,import,schema}.ts` and `src/features/settings/{BackupSection,ImportBackup,StorageStatus}.tsx`.
- Updates and domain code: `src/features/updates/UpdateBanner.tsx`, `src/domain/{dates,format}.ts`.
- Heatmap: `src/features/stats/CalendarHeatmap.tsx` and its level logic from `domain/heatmaps.ts`.

**Required changes from the workout app**

1. **The origin is shared.** Both apps live on `imkulwant.github.io` and only the path differs. So:
   - The IndexedDB name is `learn-swedish`.
   - Every `localStorage` key is prefixed `sfi.`, for example `sfi.hadData`.
   - The service worker scope is `/learn-swedish/`.
   - A test checks that the two apps' caches and databases don't collide.
   - The origin's storage quota is also shared with the workout app.
2. **CSP:** add `media-src 'self' blob:`. Recordings play from blob URLs.
3. **Updates:** never reload during a mock exam or a recording. This replaces the workout app's "no reload during a workout" rule.
4. **Runtime network:** only same-origin requests for content packs and audio. The rule from the workout app stays: no third-party requests until Phase 13.

**Repository layout**
```text
content/            YAML/Markdown sources: reading/, listening/, writing/, speaking/, vocab/, grammar/, scenarios/, mocks/, guide/
content/schema.ts   Zod schemas shared by build scripts and app
scripts/            build-content.mjs, build-audio.mjs, review-sheet.mjs, approve.mjs + reused scripts
public/content/     compiled packs + manifest.json (hash, version)   public/audio/ <clipId>.mp3
src/domain/         answerCheck, readiness, studyPlan, writingChecks, srs (ts-fsrs wrapper), examFormat, dates, format
src/data/           db.ts, repositories/ (attempts, progress, cards, writings, recordings, mocks, settings), content loader, backup/
src/features/       today, onboarding, exam (guide, drills, mock), learn (vocab, grammar, pronunciation), everyday, writing, speaking, progress, settings
src/platform/       recorder.ts (MediaRecorder), audio.ts (player), + reused files
```

**Content pipeline.**
- `build-content` validates every source with Zod and checks cross-references:
  - Audio files exist.
  - IDs are unique and stable.
  - Mock items are never used in drills.
  - Exactly one correct option per multiple-choice item.
  - Coverage of KP27 points.
- It compiles one JSON pack per level and skill. The service worker precaches the packs, which are small.
- `build-audio` runs only on the author's machine, not in CI. It turns each clip's lines into speech with **Piper TTS**, using two or more Swedish voices for dialogues, and converts them to mono MP3 with ffmpeg. The MP3s are committed, so CI needs no Python.
- The service worker caches audio at runtime (cache first), with a "Download for offline" button per level.

**Dexie schema, version 1**
```ts
attempts:    'id, itemId, packId, skill, level, mode, finishedAt'   // one scored answer; mode = drill|mock|placement
cards:       'id, wordId, due, state'                               // FSRS card state per word+direction
writings:    'id, promptId, updatedAt'                              // text, wordCount, rubric{criterion:0..2}, submittedAt
recordings:  'id, taskId, createdAt, starred'                       // Blob (audio/mp4 on iOS), durationMs, rubric
mocks:       'id, examId, status, startedAt'                        // per-part state, timers as endsAt timestamps, results
studyDays:   'date'                                                 // minutes, itemsDone, per local date
settings:    'key'                                                  // targetLevel, examDate, dailyGoal, playbackRate, showTranslations, lastBackupAt, seenPacks
```
- Each row stores the content version that produced it, so changing content never breaks old results.
- Backups use JSON and leave recordings out by default, with an opt-in to include them because of size.

## Phased task list

Execution rules are the same as the workout app: one commit per task, `npm run verify` before every commit, and updates to `docs/PROGRESS.md` and `docs/DECISIONS.md`. Work stops at **[HUMAN]** tasks. Phases 0 to 12 are v1.

**Phase 0: Foundation and spikes**
- Set up a git repo in `learn-swedish/` and scaffold it from the reuse list.
- Commit this plan as `docs/PLAN.md`, together with `DECISIONS.md`, `PROGRESS.md` and `CONTENT.md`.
- Spike: choose two or more Piper Swedish voices whose licence allows redistribution. Check each licence and record it. If only one voice qualifies, fall back to one voice plus reviewer recordings in Phase 13. Generate sample MP3s.
- Spike: MediaRecorder to a Blob in IndexedDB, then a reload, then playback, in WebKit.
- **[HUMAN]** Play the sample audio and a test recording on the iPhone.
- **Acceptance:** `verify` passes on a clean clone, and audio and recording work on the iPhone.

**Phase 1: Content schema and pipeline**
- Zod schemas for every content type.
- The `build-content`, `build-audio`, `review-sheet` and `approve` scripts, and `content:check` inside `verify`.
- Coverage test and level-length tests.
- **Acceptance:** a sample pack builds, and a malformed pack fails `verify` with a message that names the problem.

**Phase 2: Domain and data**
- Dexie version 1, the repositories, and `answerCheck`, `readiness`, `srs`, `studyPlan`, `examFormat` and `writingChecks`.
- Table-driven unit tests for every definition above and every band boundary.
- **Acceptance:** all definition tests pass.

**Phase 3: Shell, onboarding and deployment**
- Tabs, routes, UI kit, PWA manifest and icons, onboarding, placement check, Settings skeleton, guarded update banner.
- **[HUMAN]** Create the GitHub repo `learn-swedish` and set Pages to deploy from GitHub Actions.
- **[HUMAN]** Install on the iPhone.
- **Acceptance:** the app launches offline from the Home Screen, and the workout app still works with its data intact.

**Phase 4: Exam guide and Läsa**
- Guide screens.
- Renderers for every official reading format: multiple choice, short answer, matching, name matching, who the text is for, and diagram/table/map (SVG and tables from content).
- Drill session flow, feedback, and the summary.
- Draft C and D reading packs 1.
- **[HUMAN]** Reviewer pass.
- **Acceptance:** an e2e test completes a D reading drill, and the attempts and readiness update.

**Phase 5: Höra**
- Audio player: play count, speed, no seeking in exam mode, and the transcript after answering.
- Offline audio download and the storage display.
- C and D listening packs 1.
- **[HUMAN]** Review.
- **Acceptance:** with Airplane Mode on, a downloaded clip plays and the drill completes.

**Phase 6: Vocabulary and SRS**
- Lexicon, word forms, themed decks, the three card types, daily limits, tap-to-add from texts.
- The 1,200 headwords, in themed packs.
- **[HUMAN]** Review.
- **Acceptance:** due cards follow FSRS across reloads, and tests use a fixed clock.

**Phase 7: Grammar and pronunciation**
- Lesson renderer.
- Exercise types: word-order builder, inflection fill-ins, linking-word choice, transforms.
- About 24 lessons: V2 and inversion, BIFF, the tenses including past perfect and future, definite forms, adjective agreement, *sin*/*hans*, prepositions of time and place, linking words, relative clauses, formal register, letter and email structure.
- Pronunciation drills.
- **[HUMAN]** Review.

**Phase 8: Skriva**
- Prompts, autosaving editor, check panel, model answers, rubric, history, sharing.
- **[HUMAN]** Review the prompts and model answers.
- **Acceptance:** text survives a force-quit, and the check heuristics pass tests built from reviewer-approved correct and incorrect sentences.

**Phase 9: Tala**
- Solo task flow, pair discussion (scripted partner and with-a-friend), phrase bank, recording management.
- **[HUMAN]** Review.
- **Acceptance:** a recording survives a reload, a starred recording is never removed automatically, and a scripted pair session works offline.

**Phase 10: Everyday scenarios**
- The 15 scenarios: phrases, dialogue with questions, role-play.
- **[HUMAN]** Review.

**Phase 11: Mock exams, Today and Progress**
- Mock runner: per-part timers from stored end times, resume after the app is killed, results and review, self-assessment for Skriva and Tala.
- 2 C and 4 D mocks.
- **[HUMAN]** Reviewer review, and the reviewer confirms the `examFormat` constants.
- Today plan and Progress screen.
- **Acceptance:** a force-quit mid-mock resumes with the right remaining time, and the plan changes as expected with exam date and weak part (unit tests).

**Phase 12: Hardening and release**
- Backup and restore round trip, the data-loss marker, and the storage-failure gate.
- axe pass, an assertion that no request leaves the origin, the bundle limit (250 KB gzipped JS), and the README.
- Tag `v1.0.0`.
- **[HUMAN]** iPhone checklist.
- **[HUMAN]** Kul takes a full D mock and reports problems.

**Phase 13: Later, each part needing its own decision first**
- Optional AI tutor: the learner's own Claude API key, stored on the device and sent only after the learner agrees each time. It grades writing against the D criteria and runs text role-plays. CSP adds `connect-src https://api.anthropic.com`. Load the `claude-api` skill before designing this.
- More UI languages.
- Human-recorded audio from the reviewer.
- After the first 2027 tests, update the formats from SU's follow-up reports.

## Verification

| Layer | How |
| --- | --- |
| Content | `content:check` inside `verify`: schemas, cross-references, exactly one correct option, coverage of every KP27 3D point, length ranges, mock items kept separate |
| Domain | Vitest table tests: answer normalization, readiness bands, FSRS wrapper with a fixed clock, study-plan rules, writing heuristics |
| Data | Vitest with fake-indexeddb: repositories, migrations, backup round trip, blob recordings |
| Flows | Playwright WebKit iPhone: onboarding, each drill type, vocabulary review, writing autosave, mock resume, offline reload, no-third-party-request check, axe on every screen, both apps sharing one origin |
| Device | **[HUMAN]** iPhone checklist: Home Screen install, offline launch, audio playback and speed, microphone permission and recording, writing survives a force-quit, mock resumes, update waits during a mock, backup and restore |
| Language quality | **[HUMAN]** Reviewer approves every pack. Production builds refuse unreviewed items. |
| Outcome | No test can prove the learner will pass. The proxies are mock scores and readiness, compared with the teacher's judgement. |

## Risks

| Risk | Mitigation |
| --- | --- |
| Mistakes in AI-written Swedish | Reviewer gate per pack, Report a mistake link, content version on every item |
| TTS sounds less natural than the real listening test | Two or more voices, 1× speed in mocks, links to *Nyheter på lätt svenska* and *Klartext* for real voices, reviewer recordings later |
| The new 2027 test differs from today's examples | Formats and constants are kept apart from content. Watch the SU and Skolverket releases after 18 Jan 2027 (Phase 13). |
| Self-assessment is too generous | Labelled self-assessed, model answers alongside, sharing with a teacher, AI tutor later |
| Storage pressure from audio and recordings, on a quota shared with the workout app | Per-level audio download, recording cleanup, `persist()`, storage display |
| Copyright | Original items only, links to official examples, licences of the audio voices recorded |
