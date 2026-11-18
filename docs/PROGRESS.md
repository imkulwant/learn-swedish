# Progress

## Current state

- **Slice 1 (one D reading drill, offline):** done.
- **Slice 2 (welcome screen, Settings, exam countdown, backup and restore):** done.
- **Slice 3 (Höra: Piper audio pipeline, player, listening drill, offline audio):** done. Pack `d-hora-1` reviewed by Anna.
- **Slice 4 (vocabulary: two word packs, FSRS scheduling, three card types, backup version 2):** done. Both word packs reviewed by Anna.
- **Slice 5 (grammar: lesson renderer, four exercise types, pack `c-grammatik-1` with 5 lessons):** done. Pack reviewed by Anna.
- **Slice 6 (Skriva: writing prompts, editor that saves as you type, check panel, model answers, self-assessment, backup version 3):** done. Pack `d-skriva-1` and the check sentences reviewed by Anna, who also accepted the suggested lengths.
- **Slice 7 (Tala, solo task: recorder, planning timer, model answers with audio, self-assessment, recordings and their clean-up):** done. Pack `d-tala-1` reviewed by Anna.
- Next slice: 7b, Tala pair discussion.

## Known issues and open items

- **[HUMAN]** On the iPhone: allow the microphone, record a solo answer, force-quit, and check the recording plays after reopening.
- Pronunciation drills are deferred to the speaking slice (decision 49).
- Pack `d-lasa-1` is reviewed (2026-11-17) and ships in production builds.
- Not yet tested on a real iPhone. That waits for Kul to push and enable Pages.
- **[HUMAN]** Enable GitHub Pages on `imkulwant/learn-swedish` (Settings → Pages → Source: GitHub Actions). The site will be at `https://imkulwant.github.io/learn-swedish/`.
- **[HUMAN]** Listen to the five clips of `d-hora-1` on the iPhone and judge whether the voices are good enough for practice. The reviewer checks the Swedish and pronunciation.
- The `examFormat` constants (durations, audio plays, aids) are still unconfirmed and are not yet in the code. They arrive with mocks.
