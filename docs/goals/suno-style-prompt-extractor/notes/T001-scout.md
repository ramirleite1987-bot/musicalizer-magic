# T001 Scout Findings

## Repo Map

- `AGENTS.md` says this is a Next.js 16 single-product app and requires reading relevant `node_modules/next/dist/docs/` guides before code changes. Relevant docs read for this goal:
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `package.json` defines `dev`, `build`, `lint`, `typecheck`, `test`, DB scripts, MCP scripts, and a Sandcastle script.
- Only `package-lock.json` is present; no `pnpm-lock.yaml`, `yarn.lock`, or `bun.lockb` was found. Project instructions say npm is the repo package manager, while operator instructions still require `pnpm exec oxfmt --write` and typecheck before stopping.
- Existing dashboard structure is one client shell at `src/app/dashboard/dashboard-client.tsx` with tab components in `src/components/*-tab.tsx`.
- Current relevant files are under the size limit but should not be grown carelessly:
  - `src/app/dashboard/dashboard-client.tsx`: 494 lines.
  - `src/components/sidebar.tsx`: 542 lines.
  - `src/components/themes-tab.tsx`: 468 lines.
  - `src/components/evaluate-tab.tsx`: 370 lines.
  - `src/components/style-tab.tsx`: 356 lines.
  - `src/components/versions-tab.tsx`: 284 lines.

## Data And Integration Points

- `src/types/music.ts` defines `Track`, `TrackVersion`, `TrackStyle`, `TrackFeedback`, and `DimensionScores`.
- `src/lib/db/schema.ts` stores all practical extraction ingredients already:
  - track name and genre in `tracks`.
  - version `prompt`, `negativePrompt`, `lyrics`, `style`, `notes`, `feedback`, `rating`, and audio metadata in `track_versions`.
  - themes and track-theme assignments in `themes` / `track_themes`.
- `src/app/actions/tracks.ts` maps DB rows into the client `Track` shape and includes version data.
- `src/app/actions/versions.ts` updates version fields and merges JSON style/feedback fields.
- `src/lib/suno/client.ts` has `buildSunoPrompt`, which converts a `TrackStyle` plus prompt into the final Suno prompt used for generation.
- `src/components/style-tab.tsx`, `src/components/prompt-tab.tsx`, `src/components/lyrics-tab.tsx`, and `src/components/evaluate-tab.tsx` already expose most extraction inputs separately.
- `src/app/dashboard/dashboard-client.tsx` is the current best UI integration point because it owns `selectedTrack`, `selectedVersion`, tab state, and `handleUpdateVersion`.
- `src/app/api/upload/route.ts` already handles audio upload, but there is no audio-analysis pipeline. First tranche should not depend on uploaded audio analysis.
- `src/app/api/themes/generate/route.ts` shows an AI route pattern, but a first practical extractor can be deterministic and locally testable without provider secrets.

## UI And Component Rules

- `rg "@radix-ui" src` found no direct Radix imports.
- Existing UI uses local components from `src/components/ui/*`, lucide icons, Tailwind classes, and shadcn-style wrappers.
- A new extractor tab/component should import local UI wrappers only and keep custom logic in smaller helper files.

## Verification Strategy

- Primary repo scripts:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm test` or focused `npm test -- <path>` when tests are added.
- Operator-required command:
  - `pnpm exec oxfmt --write`
- Because `oxfmt` is not declared in `package.json` or `package-lock.json`, `pnpm exec oxfmt --write` may need network access or fail. If it fails due sandbox/network restrictions, rerun with escalation as required by environment policy and record the result.
- Avoid running DB migrations unless Judge selects schema changes; no schema change appears necessary for the first practical slice.

## Risks

- True audio analysis is not currently supported. Treat audio file/link analysis as a future slice unless a low-risk local analyzer is introduced later.
- External URL fetching could create network, scraping, timeout, and security concerns. First slice should treat external links as user-provided references plus notes, not fetch arbitrary pages.
- Dashboard state is currently initialized from server props and several actions reload the page. A client-only extraction tab can avoid expanding that state model.
- `src/app/dashboard/dashboard-client.tsx` is already near 500 lines. Add only minimal wiring there; put extractor UI and logic in new focused files.

## Candidate Worker Slices

### Recommended First Slice

Build a deterministic practical style-prompt extractor with:

- Pure helper and tests for combining selected app song/version data plus external song references into a Suno-ready style prompt.
- A focused dashboard tab for selecting app versions, adding external song references/notes, generating the prompt, copying it, and applying it to the selected version.
- Minimal dashboard wiring to add the tab.

Suggested files:

- `src/lib/music/style-prompt-extractor.ts`
- `src/test/style_prompt_extractor.test.ts`
- `src/components/style-prompt-extractor-tab.tsx`
- `src/app/dashboard/dashboard-client.tsx`

Suggested verify commands:

- `npm test -- src/test/style_prompt_extractor.test.ts`
- `pnpm exec oxfmt --write`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

Stop if:

- More than the suggested files are needed.
- External input requires fetching third-party URLs.
- True audio analysis becomes required.
- The tab wiring requires direct Radix imports or a large dashboard refactor.

### Deferred Slice

Add true audio analysis after product and provider choices are known:

- Decide provider/local analyzer.
- Define upload/fetch constraints and cost/security limits.
- Store extracted descriptors or analysis results only after schema/storage needs are proven.
