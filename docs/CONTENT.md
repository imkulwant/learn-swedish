# Content status

Every pack is drafted, checked by `npm run content`, and reviewed by a native speaker or SFI teacher before it ships. Production builds include only texts with `status: reviewed`.

| Pack | Level | Part | Texts or clips | Questions | Status |
| --- | --- | --- | --- | --- | --- |
| `d-lasa-1` | D | Läsa | 6 | 16 | Reviewed by Anna, 2026-11-17 |
| `d-hora-1` | D | Höra | 5 clips | 18 | Reviewed by Anna, 2026-11-18 |
| `d-ord-arbete` | D | Words: work | 30 words | – | Reviewed by Anna, 2026-11-18 |
| `d-ord-halsa` | D | Words: health and care | 30 words | – | Reviewed by Anna, 2026-11-18 |

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
