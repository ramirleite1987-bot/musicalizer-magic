<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project overview

**Musicalizer Magic** — Next.js 16 app (single product, not a monorepo). AI-powered music production workbench: tracks, versions, prompts/lyrics, themes, and evaluations. Uses Neon Postgres, Drizzle ORM, Anthropic Claude (via Vercel AI SDK / AI Gateway), Suno AI, Minimax, and Vercel Blob (integrations optional where noted).

### Architecture map

| Area | Where | Notes |
|------|-------|-------|
| Pages / UI | `src/app/dashboard`, `src/app/usage`, `src/components` | Dashboard is the main client (`dashboard-client.tsx`) |
| Server Actions | `src/app/actions/*` | Most mutations live here (tracks, versions, themes, presets, AI suggestions) |
| API routes | `src/app/api/*` | `upload` (Blob), `themes/generate` (Claude), `generation/[versionId]/status` (provider polling) |
| DB schema | `src/lib/db/schema.ts` | Drizzle; migrations in `drizzle/`; idempotent auto-migration in `src/instrumentation.ts` |
| AI music clients | `src/lib/suno`, `src/lib/minimax`, `src/lib/music` | Dispatcher in `src/lib/music` resolves provider from version style |
| AI text (Claude) | `src/app/actions/ai-suggestions.ts`, `src/app/api/themes/generate` | Model id format is the AI Gateway one: `anthropic/claude-sonnet-4.6` (dots, with `anthropic/` prefix) |
| Security helpers | `src/lib/security/url.ts` | `safeFetch`/`assertPublicHttpUrl` — SSRF guard for any outbound fetch of a non-hardcoded URL |
| Tests | `src/test/*.test.{ts,tsx}` | Vitest + Testing Library (jsdom) |

## Standard commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build (uses `--webpack` flag) |
| `npm run lint` / `npx eslint .` | Lint |
| `npm run typecheck` / `npx tsc --noEmit` | Type check |
| `npm test` | Unit tests (Vitest, `src/test/`) |
| `node scripts/smoke-test.mjs` | Headless Chrome end-to-end smoke test of the dashboard (see `scripts/smoke-test.mjs` for prerequisites) |
| `npx tsx scripts/suno-integration-test.ts` | Self-contained Suno client integration test against an in-process mock (no DB/server/token needed) |

## Quality gates (run before every commit)

CI (`.github/workflows/ci.yml`) blocks merges to `main` unless ALL of these pass. Run them locally first:

1. `npx eslint .`
2. `npx tsc --noEmit`
3. `npm test`
4. `npm run build`
5. `npm audit --omit=dev --audit-level=high` (no high/critical vulns in production deps)

A Claude Code hook (`.claude/settings.json` → `scripts/hooks/post-edit-check.mjs`) lints every edited TS/JS file automatically and feeds errors back to the agent; don't disable it.

## Security rules (non-negotiable)

- **Never commit secrets.** All keys live in `.env` (gitignored); `.env.example` holds placeholders only. CI runs gitleaks (secret scan) on every PR.
- **Validate inputs at system boundaries.** API routes and Server Actions that accept client data must validate with `zod` (schema near the handler). Internal code can trust internal callers.
- **Outbound fetches of dynamic URLs** (user-supplied or returned by third-party APIs) must go through `safeFetch` from `src/lib/security/url.ts` — it blocks private/internal hosts (SSRF), validates every redirect hop, and caps response size. Never call `fetch(userUrl)` directly.
- **Uploads:** `/api/upload` accepts only audio types up to 50MB and sanitizes filenames. Keep those restrictions when changing it.
- **API keys are server-only.** `SUNO_API_KEY`, `MINIMAX_API_KEY`, `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `DATABASE_URL` must never appear in client components or be prefixed `NEXT_PUBLIC_`.
- **GitHub workflows:** least privilege (`contents: read` unless write is genuinely needed); workflows triggered by comments/issues must gate on `author_association` (OWNER/MEMBER/COLLABORATOR). Don't widen permissions without justification.
- **Known accepted gaps** (single-user deploy): no auth and no rate limiting on API routes. If the app ever becomes multi-user or publicly promoted, add auth (e.g. Vercel deployment protection or middleware) and rate limiting on the endpoints that call paid AI APIs first.

## Git / PR conventions

- Never commit directly to `main` — work on a branch and open a PR; merge only when the **CI OK** check is green.
- Conventional-ish commit messages (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`).
- Keep `package-lock.json` in sync; always use `npm` (not pnpm/yarn).

## Local database setup

The app uses `@neondatabase/serverless` (neon-http driver), which requires an HTTP-compatible endpoint. For local development:

- PostgreSQL on port `5432` (user `devuser`, password `devpass`, database `musicalizer_magic`).
- Neon HTTP proxy (`ghcr.io/timowilhelm/local-neon-http-proxy:main`) on port `4444` bridges the neon driver to local PostgreSQL.
- `src/instrumentation.ts` intercepts fetch to `localtest.me` and redirects to the local proxy. Set `NEON_LOCAL_PROXY=http://db.localtest.me:4444/sql` in `.env`.
- Add `127.0.0.1 db.localtest.me` to `/etc/hosts`.
- PostgreSQL user must be a superuser (the neon proxy queries `pg_authid`).

## Required secrets (env vars)

- `DATABASE_URL` — Neon Postgres connection string (required for the dashboard to load data on deploy; optional locally if you use the proxy setup above).
- Optional: `ANTHROPIC_API_KEY`, `SUNO_API_KEY`, `SUNO_API_BASE_URL`, `MINIMAX_API_KEY`, `MINIMAX_API_BASE_URL`, `BLOB_READ_WRITE_TOKEN`.

## Gotchas

- The app uses `package-lock.json` → always use `npm` (not pnpm/yarn).
- `npm run build` uses `next build --webpack` explicitly.
- The dashboard (`/dashboard`) calls the DB on SSR; without `DATABASE_URL`, the error boundary may show that no connection string was provided. This is expected and does not block lint, typecheck, tests, or build.
- **neonConfig module instances**: Setting `neonConfig.fetchEndpoint` in `instrumentation.ts` does not affect all bundled server paths; the workaround is intercepting `globalThis.fetch` in the instrumentation `register()` function.
- **drizzle-kit push**: May not work locally the same way as against Neon if tooling expects the websocket driver; you can create or migrate tables with `psql` against `localhost:5432` when using the local stack.
- **Migrations**: SQL snapshots live under `drizzle/`; apply with `npm run db:migrate` (requires `DATABASE_URL` and `tsx`). Schema source remains `src/lib/db/schema.ts`. `src/instrumentation.ts` also applies a few idempotent `IF NOT EXISTS` statements on cold start — keep those in sync with the schema if you touch the affected tables.
- `.env` is gitignored; copy from `.env.example` and fill in values. For local dev, set `DATABASE_URL` and `NEON_LOCAL_PROXY` as described above.
- **AI model ids** use the Vercel AI Gateway format (`anthropic/claude-sonnet-4.6` — provider prefix + dots). Don't switch them to bare Anthropic API ids (`claude-sonnet-4-6`); the `ai` package routes through the gateway.
