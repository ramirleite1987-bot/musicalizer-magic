# Suno Style Prompt Extractor

## Objective

Ship an end-to-end workflow that can extract a Suno-ready style prompt from one song or a set of songs, supporting both existing app songs/tracks and external inputs, with a staged architecture that can later add true audio analysis.

## Original Request

I wanna be able to extract a style prompt to suno from a song or a set of songs.

## Intake Summary

- Input shape: `specific`
- Audience: Musicalizer Magic users who want to turn song references into reusable Suno style prompts.
- Authority: `requested`
- Proof type: `demo`
- Completion proof: A user can select existing app songs/tracks or provide external song inputs, generate a practical Suno style prompt, and copy or reuse it in the app; the implementation is verified by formatting, typecheck, lint/build as applicable, and manual test steps.
- Likely misfire: GoalBuddy could over-focus on future true audio analysis or backend plumbing and fail to deliver a usable first end-to-end extractor.
- Blind spots considered: input source breadth, practical metadata-based extraction versus true audio analysis, staged implementation, prompt quality, external input validation, provider/API cost, app integration surface, and verification requirements.
- Existing plan facts: Use a hybrid staged approach: design for both app songs and external inputs, ship practical extraction first using available song data, lyrics, prompts, themes, titles, and user-provided external song info/links, and leave true audio analysis as a later slice.

## Goal Kind

`specific`

## Current Tranche

Complete a first usable version of the style prompt extractor. The `/goal` run should first map the existing app structure, then choose and implement safe slices until users can exercise an end-to-end practical extraction flow for existing app songs/tracks and external song inputs. True audio analysis should be accounted for in the product and code shape, but it is not required to be implemented in the first tranche unless Scout/Judge find an already-supported, low-risk path.

## Non-Negotiable Constraints

- Keep implementation code, comments, and PR description text in English.
- Do not use the prohibited design-inspiration name; if design inspiration must be referenced, say "reference app".
- Keep files small: under 1000 lines, preferably under 750, and split new surfaces into separate files instead of growing large files or functions.
- Do not import `@radix-ui/*` outside `/components/ui`; all Radix usage must stay wrapped by the local UI component layer.
- Do not commit, push, or make destructive git changes unless explicitly asked.
- Use the repo's current patterns and verify the package-manager reality before running commands; the project doc says this repo has `package-lock.json` and normally uses npm, while the operator instructions also require `pnpm exec oxfmt --write` and typecheck before stopping when applicable.
- Record and follow the requested Guardrails, Vercel Best Practices, and Clean Code skill expectations during implementation, but do not load those skills during this GoalBuddy prep turn.
- Before claiming implementation complete, run formatting and verification commands required by the repo/operator constraints, including `pnpm exec oxfmt --write` and typecheck if available, plus lint/build according to the resolved package-manager strategy.
- After implementation, produce the requested PR description code block with summary and manual test plan.

## Stop Rule

Stop only when a final audit proves the full original outcome is complete.

Do not stop after planning, discovery, or Judge selection if the user asked for working software or automation and a safe Worker task can be activated.

Do not stop after a single verified Worker slice when the broader owner outcome still has safe local follow-up slices. After each slice audit, advance the board to the next highest-leverage safe Worker task and continue.

Do not stop because a slice needs owner input, credentials, production access, destructive operations, or policy decisions. Mark that exact slice blocked with a receipt, create the smallest safe follow-up or workaround task, and continue all local, non-destructive work that can still move the goal toward the full outcome.

## Canonical Board

Machine truth lives at:

`docs/goals/suno-style-prompt-extractor/state.yaml`

If this charter and `state.yaml` disagree, `state.yaml` wins for task status, active task, receipts, verification freshness, and completion truth.

## Run Command

```text
/goal Follow docs/goals/suno-style-prompt-extractor/goal.md.
```

## PM Loop

On every `/goal` continuation:

1. Read this charter.
2. Read `state.yaml`.
3. Run the bundled GoalBuddy update checker when available and mention a newer version without blocking.
4. Re-check the intake: original request, input shape, authority, proof, blind spots, existing plan facts, and likely misfire.
5. Work only on the active board task.
6. Assign Scout, Judge, Worker, or PM according to the task.
7. Write a compact task receipt.
8. Update the board.
9. If Judge selected a safe Worker task with `allowed_files`, `verify`, and `stop_if`, activate it and continue unless blocked.
10. If a problem, suggestion, or follow-up should become a repo artifact, create an approved issue/PR or ask the operator whether to create one.
11. Treat a slice audit as a checkpoint, not completion, unless it explicitly proves the full original user outcome is complete.
12. Finish only with a Judge/PM audit receipt that maps receipts and verification back to the original user outcome and records `full_outcome_complete: true`.

Issue and PR handoffs are supporting artifacts. `state.yaml` remains authoritative, and every external artifact decision must be recorded in a task receipt.
