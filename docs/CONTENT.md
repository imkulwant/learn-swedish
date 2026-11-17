# Content status

Every pack is drafted, checked by `npm run content`, and reviewed by a native speaker or SFI teacher before it ships. Production builds include only texts with `status: reviewed`.

| Pack | Level | Part | Texts | Questions | Status |
| --- | --- | --- | --- | --- | --- |
| `d-lasa-1` | D | Läsa | 6 | 16 | Reviewed 2026-11-17 |

## How to review a pack

1. Open the YAML file in `content/` (for example `content/reading/d-lasa-1.yaml`), or try it in the app with `npm run dev`, which shows drafts.
2. Check the Swedish, the answers and the English explanations. Note changes by text id.
3. After the fixes, set `status: reviewed`, `reviewedBy` and `reviewedAt` on each approved text.

The plan's printable review sheet and the `content:approve` command come in a later slice. Until then, review uses the YAML file or the app.
