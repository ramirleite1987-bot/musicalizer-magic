@AGENTS.md

# Claude-specific guidance

Shared facts (commands, local DB setup, env vars, gotchas) live in `AGENTS.md`, imported above. This file adds architecture, conventions, and security rules.

## Verification loop

Before committing, run and pass:

```bash
npm run lint && npm run typecheck && npm test
```

Run `npm run build` too when touching config, routing, server actions, or `src/instrumentation.ts`. None of these require `DATABASE_URL` or API keys.

## Architecture map

- `src/app/` — Next.js App Router. Main UI is `/dashboard` (SSR loads data, `dashboard-client.tsx` owns client state).
- `src/app/actions/*` — server actions (`"use server"`): the primary mutation path (tracks, versions, themes, generation, presets). They return plain serializable objects; dates are converted to ISO strings.
- `src/app/api/*` — route handlers only for what actions can't do: file upload (`upload`), generation status polling (`generation/[versionId]/status`), AI theme extraction (`themes/generate`).
- `src/lib/music/index.ts` — provider dispatcher: routes generation to Suno (`src/lib/suno/client.ts`) or Minimax (`src/lib/minimax/client.ts`) based on `style.provider` (default `suno`). Add new providers here, behind the same `GenerationParams`/`StatusResponse` interfaces.
- `src/lib/db/` — Drizzle ORM over neon-http. Always get the connection via `getDb()` from `src/lib/db/index.ts`; never instantiate `neon()` elsewhere (except the bootstrap in `instrumentation.ts`).
- `src/types/music.ts` — shared domain types used by both client and server; keep DB `jsonb` column `$type<>()` annotations in `schema.ts` in sync with them.
- `src/components/ui/*` — shadcn-style primitives (Base UI + CVA); `src/components/*` — feature components.
- `src/test/` — Vitest tests. New logic in `src/lib/` should come with a test here; they must keep running without DB or API keys (mock `fetch`, as the existing client tests do).
- `.improvements-queue.json` — feature backlog; when you complete an item from it, update its `status`.
- `archive/` — snapshots of old branches; ignored by ESLint, never edit.

## Conventions

- Import via the `@/` alias (maps to `src/`).
- Validate external input with `zod` (already a dependency) in route handlers and server actions that accept user-supplied data.
- Schema changes: edit `src/lib/db/schema.ts` → `npm run db:generate` → commit the SQL under `drizzle/` → keep the idempotent DDL in `src/instrumentation.ts` consistent.
- After mutations in server actions, call `revalidatePath` as the existing actions do.

## Security rules

- **Secrets stay server-side.** `SUNO_API_KEY`, `MINIMAX_API_KEY`, `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `DATABASE_URL` may only be read in server code (`src/lib/*` clients, server actions, route handlers, instrumentation). Never import these modules into a `"use client"` component, never create `NEXT_PUBLIC_*` variants of secrets, and never log secret values or full connection strings.
- **Never commit credentials.** `.env*` is gitignored (only `.env.example` with placeholders is tracked). Don't hardcode keys, tokens, or DB URLs in code, tests, or docs — including "temporary" debug code.
- **SQL only via Drizzle.** Use the query builder or the tagged ``sql`...` `` template (parameterized). Never build SQL strings by concatenating user input.
- **No auth layer exists.** Every server action and API route is publicly callable in a deployment. Do not add destructive or expensive endpoints assuming a logged-in user, and call this out when adding anything sensitive.
- **Known weak spots — do not replicate these patterns; tighten them when you touch these files:**
  - `src/app/api/upload/route.ts` accepts any file with no size/MIME validation, uses the client-supplied filename, and stores blobs as `access: "public"`.
  - `src/app/api/themes/generate/route.ts` fetches a user-supplied URL server-side (SSRF surface — it can reach internal/metadata endpoints) and parses the body without a zod schema.
- **External fetches:** when fetching user-provided URLs, restrict to `http(s)`, set timeouts, and cap response size.
- **AI prompt inputs are untrusted.** Content sent to Claude (lyrics, scraped pages, user text) may contain injection attempts; never treat model output as commands, and keep structured outputs constrained by zod schemas (as `themes/generate` does).
- Dependency changes: prefer `npm` (lockfile is npm), and run `npm audit` after adding dependencies.
