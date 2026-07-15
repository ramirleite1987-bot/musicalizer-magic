# Design: Structured generation parameters, Catholic PT-BR templates, and silent-failure fix

Date: 2026-06-17
Branch: `claude/elegant-villani-93d8de`
Status: Approved (design), pending implementation plan

## Context

Investigation (static code read + live browser test of production `https://musicalizer-magic.vercel.app/dashboard`) surfaced three distinct problems:

1. **Production database is not connected** — the dashboard shows "Could not load data from the database. Confirm DATABASE_URL, run migrations…", stays at "0 tracks", and creating a track does nothing. Root cause: `DATABASE_URL` missing/invalid in the Vercel production environment, or migrations not applied. `getDb()` (`src/lib/db/index.ts:9`) does `neon(process.env.DATABASE_URL!)` and throws when it is absent. `src/instrumentation.ts` does **not** leak the local Neon proxy (guarded by `NEON_LOCAL_PROXY`). **This is an operational/config fix on Vercel — out of scope for this PR (the user will fix it).**

2. **Silent-failure bug in generation** — any error in status polling becomes an infinite "generating" hang:
   - `src/app/api/generation/[versionId]/status/route.ts:166` catch returns `{ status: "generating", error: "will retry" }` for every error (401, timeout, Blob failure, parse error).
   - `:165` fall-through: provider reports `complete` without `audioUrl` → no DB update → stuck.
   - `src/app/actions/generation.ts:10` `startGeneration` has no try/catch; a failed initial provider call surfaces only a generic client toast.

3. **Few real generation parameters + no Catholic templates** — everything the user configures (genre, moods, key, tempo, instruments, vocal) is flattened into a single prompt string; only `{ prompt, duration, make_instrumental, mv }` reach Suno (`src/lib/suno/client.ts:62`). No `title`, no structured style/tags, no vocal gender, no lyric structure. `src/data/prompt-templates.ts` has 18 secular templates and zero Catholic/liturgical ones.

## Decisions (from brainstorming)

- **Approach:** structured fields (refactor the Suno client to send discrete real fields; templates populate them). Not the flattened-prompt enrichment; not a full new UI control surface.
- **Scope of this PR:** bug fix (silent failure) + structured parameters (Suno focus) + Catholic contemporary PT-BR templates.
- **Provider focus:** Suno (it is the code default; production provider is unconfirmed). Minimax keeps its current prompt build.
- **Templates:** Católico contemporâneo PT-BR.

## A. Silent-failure fix

File: `src/app/api/generation/[versionId]/status/route.ts`
1. **"complete without audioUrl"** is now a terminal failure: reset version to `draft`, clear task ids, write a `failed` generation log with an explicit error message, return `{ status: "failed", error: "Provider reported complete but returned no audio URL" }`. Removes the `:165` fall-through.
2. **Defense-in-depth timeout:** the `catch` (`:166`) still tolerates genuinely transient errors by returning `{ status: "generating", error }`, BUT first checks elapsed time. If the most recent `started` generation log for this version is older than `GENERATION_TIMEOUT_MS` (10 minutes), mark the version `failed` and return `failed`. This guarantees the "generating" state cannot hang forever even if the provider never resolves.
3. Audio download/upload (`safeFetch` + Blob `put`) failures are caught and converted to a `failed` terminal state with a clear error, instead of bubbling to the generic catch.

File: `src/app/actions/generation.ts`
4. Wrap `createGeneration` in try/catch. On failure: write a `failed` generation log and rethrow an `Error` carrying the provider's real message so the dashboard toast can show *why*. Version stays `draft`.

No schema change. The 10-minute threshold is a module-level constant (single source of truth, easy to tune).

## B. Structured parameters (Suno)

### Type changes
`src/types/music.ts` — `TrackStyle` gains two optional, backward-compatible fields (stored in existing `style` JSONB column, **no migration**):
- `styleTags?: string[]` — explicit provider style descriptors. When present, used directly; when absent, derived from `genre` + `moods` + `instruments`.
- `vocalGender?: "male" | "female" | "any"` — optional; when absent, derived from `vocalStyle` where possible.

`GenerationParams` (`src/lib/music`) gains `title?: string`.

### Suno client (`src/lib/suno/client.ts`)
- New `buildStyleString(style: TrackStyle): string` — translates our style into comma-separated Suno style tags. **This function is intentionally left as a marked `TODO` with context for the user to author (~8 lines), per learning mode.** A default implementation is provided so the build/tests pass; the user can refine. It combines `styleTags` (if set) else `genre` + `moods` + `instruments`, plus optional key/tempo descriptors.
- `createGeneration` sends a **custom-mode** structured body instead of one flattened prompt:
  - `customMode: true`
  - `title` (from `params.title`, fallback `"Untitled"`)
  - `style` (from `buildStyleString`)
  - `prompt` = lyrics when vocal + lyrics present; otherwise the description from `buildSunoPrompt` (kept as fallback)
  - `instrumental` (= `vocalStyle === "None"`)
  - `mv` (model version, unchanged mapping)
  - `vocalGender` (only when resolvable)
  - `negativeTags` (from `negativePrompt`, when present)
- `buildSunoPrompt` is retained as the description fallback for instrumental/no-lyrics cases.

### Wiring
`src/app/actions/generation.ts` — `startGeneration` also loads the track row to pass `title: track.name` into `createGeneration`.

### Validation (`src/lib/music/validation.ts`)
- `styleTags`: if present, must be an array of non-empty strings.
- `vocalGender`: if present, must be one of `"male" | "female" | "any"`.
- Existing constraints unchanged.

### Tests
- `scripts/suno-integration-test.ts` (in-process mock) updated to assert the new structured body shape.
- Any unit tests in `src/test/` touching the Suno body updated.

## C. Catholic contemporary PT-BR templates

File: `src/data/prompt-templates.ts`
- Template type gains optional `lyrics?: string` (PT-BR scaffold with `[Intro]` / `[Verso]` / `[Refrão]` / `[Ponte]` / `[Final]`). The template `style` partial may now include `styleTags` and `vocalGender`.
- New category **"Católico"** with ~6 templates:
  1. Canto de Entrada (assembleia/louvor)
  2. Ofertório (intimista)
  3. Comunhão (adoração)
  4. Mariana (Ave Maria / devoção a Maria)
  5. Louvor jovem (banda/contemporâneo)
  6. Adoração ao Santíssimo (worship lento)
- Each fills `genre`, `moods`, `instruments` (violão, piano, cordas, coro), `vocalStyle`, `styleTags` (e.g. `worship`, `congregational`, `catholic mass`, `liturgical`), a PT-BR `prompt`, a PT-BR `negativePrompt`, and a PT-BR `lyrics` scaffold.

### UI impact (minimal — Approach A, not C)
- The template picker in `dashboard-client.tsx` is data-driven, so the "Católico" category appears automatically.
- "Apply template" is extended to also populate `styleTags`, `vocalGender`, and `lyrics` (when the template provides them).
- **No new form controls** are added for `styleTags` / `vocalGender` in this PR; they flow through templates and the generation pipeline.

## Out of scope
- Vercel `DATABASE_URL` / migrations (operational; user handles).
- Minimax structured refactor (keeps current prompt build).
- New dashboard form controls for the new style fields (would be a follow-up if desired).

## Risks / notes
- The concrete Suno-compatible provider and its exact body contract are unknown (endpoints in code are placeholders). The structured body is a clean superset; field names follow common Suno-API conventions and are isolated in the client so they are easy to remap to a real provider.
- Backward compatibility: new `TrackStyle` fields are optional; old versions without them remain valid and the client derives sensible defaults.

## Quality gates (must pass before PR)
1. `npx eslint .`
2. `npx tsc --noEmit`
3. `npm test`
4. `npm run build`
5. `npm audit --omit=dev --audit-level=high`
Plus `npx tsx scripts/suno-integration-test.ts`.
