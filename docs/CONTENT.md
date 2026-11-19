# Content status

Every pack is drafted, checked by `npm run content`, and reviewed by a native speaker or SFI teacher before it ships. Production builds include only texts with `status: reviewed`.

| Pack | Level | Part | Texts or clips | Questions | Status |
| --- | --- | --- | --- | --- | --- |
| `d-lasa-1` | D | Läsa | 6 | 16 | Reviewed by Anna, 2026-11-17 |
| `d-hora-1` | D | Höra | 5 clips | 18 | Reviewed by Anna, 2026-11-18 |
| `d-ord-arbete` | D | Words: work | 30 words | – | Reviewed by Anna, 2026-11-18 |
| `d-ord-halsa` | D | Words: health and care | 30 words | – | Reviewed by Anna, 2026-11-18 |
| `c-grammatik-1` | C (also shown at D) | Grammar | 5 lessons | 31 exercises | Reviewed by Anna, 2026-11-18 |
| `d-skriva-1` | D | Skriva | 4 tasks (2 informal, 2 formal) | – | Reviewed by Anna, 2026-11-18 |
| `d-tala-1` | D | Tala | 3 solo tasks | – | Reviewed by Anna, 2026-11-18 |
| `d-tala-2` | D | Tala, pairs | 2 discussions | – | Reviewed by Anna, 2026-11-18 |
| `vardag-1` | all | Everyday | 3 scenarios | 12 | Reviewed by Anna, 2026-11-18 |
| `d-prov-1` | D | Mock exam | 4 texts, 3 clips, 2 writing tasks, 1 solo, 1 pair | 17 | Reviewed by Anna, 2026-11-18 |
| `c-lasa-1` | C | Läsa | 4 | 13 | Reviewed by Anna, 2026-11-19 |
| `c-hora-1` | C | Höra | 4 clips | 12 | Reviewed by Anna, 2026-11-19 |
| `c-ord-handla` | C | Words: shopping and time | 21 words | – | Reviewed by Anna, 2026-11-19 |
| `c-ord-hemmet` | C | Words: home and family | 21 words | – | Reviewed by Anna, 2026-11-19 |
| `c-grammatik-2` | C | Grammar: basics | 4 lessons | 26 exercises | Reviewed by Anna, 2026-11-19 |
| `c-skriva-1` | C | Skriva | 3 informal tasks | – | Reviewed by Anna, 2026-11-19 |
| `c-tala-1` | C | Tala | 2 solo tasks | – | Reviewed by Anna, 2026-11-19 |
| `c-tala-2` | C | Tala, pairs | 1 discussion | – | Reviewed by Anna, 2026-11-19 |
| `c-prov-1` | C | Mock exam | 3 texts, 2 clips, 1 writing task, 1 solo, 1 pair | 12 | Reviewed by Anna, 2026-11-19 |
| `check-sentences` | – | Sentences the writing checks are tested with | 35 sentences | – | Reviewed by Anna, 2026-11-18 |

## How to review a pack

1. Open the YAML file in `content/` (for example `content/reading/d-lasa-1.yaml`), or try it in the app with `npm run dev`, which shows drafts.
2. Check the Swedish, the answers and the English explanations. Note changes by text id.
3. After the fixes, set `status: reviewed`, `reviewedBy` and `reviewedAt` on each approved text.

The plan's printable review sheet and the `content:approve` command come in a later slice. Until then, review uses the YAML file or the app.

## Reviewing a listening pack

Listening packs are in `content/listening/`. Each clip has `lines` with a `voice` (`nst` or `alma`) and the `text` the transcript shows. A `say` field, when present, is what the voice actually reads, for example numbers spelled out. Please check both, and listen to each clip in the app (`npm run dev`, then Exam → Höra). The voice is text-to-speech, so note any word it pronounces wrongly, and give the line id.

After any change to `voice`, `say` or `text`, run `npm run audio` on a Mac with `scripts/setup-audio.sh` done once. The build refuses clips whose audio is out of date.

## Reviewing a word pack

Word packs are in `content/vocab/`. For each word please check:

- `forms`, in this order:
  - **noun:** en/ett form, definite, plural, definite plural.
  - **verb:** infinitive with att, present, past, supine, imperative.
  - **adjective:** en form, ett form, plural or definite.
- `en`: the English meaning.
- `example`: one Swedish sentence and its English translation.

Listen to each word in the app (Learn → Practise words, or `npm run dev`). The audio reads the first form.

## Reviewing a grammar pack

Grammar packs are in `content/grammar/`. Try them in the app with `npm run dev`, then Learn → Grammar. For each lesson please check:

- `body`: the English explanation and every Swedish example in it (examples are between single stars).
- Each exercise's `prompt` (Swedish), and its answers:
  - `order`: `chunks` in a right order. If another order of the same chunks is also right, add it to `alsoAccept`, or it will be marked wrong.
  - `gap` and `transform`: `accept` must list **every** right answer. Anything not listed is marked wrong.
  - `mc`: exactly one right option, at `answer` (counting from 0).
- `explain`: the English explanation shown after an answer.

## Reviewing a writing pack

Writing packs are in `content/writing/`. Try them in the app (Exam → Skriva). For each task please check:

- `task` and `points`: the situation and what to write about, in Swedish as on the test.
- `model.lines`: a text that would **pass** at this level. It should sound natural but need not be perfect.
- `model.notes`: each `quote` is a phrase from the model answer, and `note` says in English why it works.

Please also check `content/check-sentences.yaml`. Every sentence under `flag` should contain the mistake named (verb not second, or *inte* after the verb in a subordinate clause), and every sentence under `ok` should be correct Swedish. The app's writing hints are tested against these sentences. When they are approved, set `status: reviewed` at the top of the file.

## Reviewing a speaking pack

Speaking packs are in `content/speaking/`. Try them in the app (Exam → Tala). For each task please check:

- `task` and `points`: the situation and what to talk about, in Swedish as on the test.
- `phrases`: phrases that help with this task.
- `model`: an answer that would **pass** at D, as the voice reads it. Please listen to it in the app as well (record anything to reach the review), and note words the voice says wrongly. `say` is what the voice reads when it differs from the transcript, for example "elva sjuttiosju" for 1177.

For a pair discussion, please check the `question`, the `mindmap` ideas and the `goal`, and the partner's lines (`partner` and `closing`). The lines must make sense whatever the learner answers. Listen to them in the app (Exam → Tala → the discussion → Scripted partner). Please also check the pack's `phraseCards`.

After a change to `model`, `partner` or `closing`, run `npm run audio`, as for listening packs.

## Reviewing an everyday scenario

Scenarios are in `content/everyday/`. Try them in the app (Everyday tab). For each scenario please check:

- `phrases`: each Swedish phrase and its English meaning. Tap a phrase in the app to hear it.
- `dialog`: the lines, the questions and their answers, as for a listening clip.
- `roleplay`: the partner's lines and closing, which must make sense whatever the learner says, and each hint with its Swedish example.
- Facts about real services (1177, the pharmacy, Försäkringskassan) must be general and true.

After a change to any spoken line, run `npm run audio`.

## Reviewing a mock exam

Mocks are in `content/mocks/`. A mock has the four parts of the test, in order, written only for the mock. Please review each part as for its drills (see the sections above). Also check that the mock as a whole is about as hard as the real test. A mock ships only when every part is approved. Try it in the app under Exam → Mock exams. The timings are the app's estimates.

