# Progress

## Current state

- **Slice 1 (one D reading drill, offline):** done.
- **Slice 2 (welcome screen, Settings, exam countdown, backup and restore):** done.
- **Slice 3 (Höra: Piper audio pipeline, player, listening drill, offline audio):** done. Pack `d-hora-1` reviewed by Anna.
- **Slice 4 (vocabulary: two word packs, FSRS scheduling, three card types, backup version 2):** done. Both word packs reviewed by Anna.
- **Slice 5 (grammar: lesson renderer, four exercise types, pack `c-grammatik-1` with 5 lessons):** done. Pack reviewed by Anna.
- **Slice 6 (Skriva: writing prompts, editor that saves as you type, check panel, model answers, self-assessment, backup version 3):** done. Pack `d-skriva-1` and the check sentences reviewed by Anna, who also accepted the suggested lengths.
- **Slice 7 (Tala, solo task: recorder, planning timer, model answers with audio, self-assessment, recordings and their clean-up):** done. Pack `d-tala-1` reviewed by Anna.
- **Slice 7b (Tala pair discussion: scripted partner, with a friend, phrase cards, database version 3):** done. Pack `d-tala-2` reviewed by Anna.
- **Slice 8 (everyday scenarios: phrases, dialogue with questions, role-play with hints):** done. Pack `vardag-1` (3 scenarios) reviewed by Anna.
- **Slice 9a (mock exams: runner with resumable timers, results with review, first D mock):** done. Mock `d-prov-1` reviewed by Anna.
- **Slice 9b (Today plan and streak, Progress screen with "Ready for D", study calendar, mock history and archive):** built.
- **Slice 10 (hardening: backups with mocks, same-origin test, review leftovers, README):** done. Tagged `v1.0.0` on 2026-11-19, with Kul's go-ahead after using the app on an iPhone.
- Next: more content packs towards the plan's volumes, and Phase 13 items, each with its own decision first.

## Known issues and open items

- **[HUMAN]** On the iPhone: allow the microphone, record a solo answer, force-quit, and check the recording plays after reopening.
- Pronunciation drills are deferred to the speaking slice (decision 49).
- Pack `d-lasa-1` is reviewed (2026-11-17) and ships in production builds.
- Kul uses the app on an iPhone (2026-11-19): mostly fine so far; issues will be reported as found.
- **[HUMAN]** Enable GitHub Pages on `imkulwant/learn-swedish` (Settings → Pages → Source: GitHub Actions). The site will be at `https://imkulwant.github.io/learn-swedish/`.
- **[HUMAN]** Listen to the five clips of `d-hora-1` on the iPhone and judge whether the voices are good enough for practice. The reviewer checks the Swedish and pronunciation.
- The `examFormat` constants are the app's estimates (decision 71), shown as such. Replace them if Skolverket or SU publish part times.
