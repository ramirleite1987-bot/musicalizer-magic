<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Project overview

**Musicalizer Magic** — Next.js 16 app (single product, not a monorepo). AI-powered music production workbench: tracks, versions, prompts/lyrics, themes, and evaluations. Uses Neon Postgres, Drizzle ORM, Anthropic Claude, Suno AI, and Vercel Blob (integrations optional where noted).

### Standard commands

See `package.json` scripts: `npm run dev`, `npm run build`, `npm run lint`. TypeScript check: `npx tsc --noEmit`.

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build (uses `--webpack` flag) |
| `npm run lint` / `npx eslint .` | Lint |
| `npx tsc --noEmit` | Type check |

### Local database setup

The app uses `@neondatabase/serverless` (neon-http driver), which requires an HTTP-compatible endpoint. For local development:

- PostgreSQL on port `5432` (user `devuser`, password `devpass`, database `musicalizer_magic`).
- Neon HTTP proxy (`ghcr.io/timowilhelm/local-neon-http-proxy:main`) on port `4444` bridges the neon driver to local PostgreSQL.
- `src/instrumentation.ts` intercepts fetch to `localtest.me` and redirects to the local proxy. Set `NEON_LOCAL_PROXY=http://db.localtest.me:4444/sql` in `.env`.
- Add `127.0.0.1 db.localtest.me` to `/etc/hosts`.
- PostgreSQL user must be a superuser (the neon proxy queries `pg_authid`).

### Required secrets (env vars)

- `DATABASE_URL` — Neon Postgres connection string (required for the dashboard to load data on deploy; optional locally if you use the proxy setup above).
- Optional: `ANTHROPIC_API_KEY`, `SUNO_API_KEY`, `SUNO_API_BASE_URL`, `BLOB_READ_WRITE_TOKEN`.

### Gotchas

- The app uses `package-lock.json` → always use `npm` (not pnpm/yarn).
- `npm run build` uses `next build --webpack` explicitly.
- The dashboard (`/dashboard`) calls the DB on SSR; without `DATABASE_URL`, the error boundary may show that no connection string was provided. This is expected and does not block lint, typecheck, or build.
- **neonConfig module instances**: Setting `neonConfig.fetchEndpoint` in `instrumentation.ts` does not affect all bundled server paths; the workaround is intercepting `globalThis.fetch` in the instrumentation `register()` function.
- **drizzle-kit push**: May not work locally the same way as against Neon if tooling expects the websocket driver; you can create or migrate tables with `psql` against `localhost:5432` when using the local stack.
- **Migrations**: SQL snapshots live under `drizzle/`; apply with `npm run db:migrate` (requires `DATABASE_URL` and `tsx`). Schema source remains `src/lib/db/schema.ts`.
- `.env` is gitignored; copy from `.env.example` and fill in values. For local dev, set `DATABASE_URL` and `NEON_LOCAL_PROXY` as described above.
- No automated test suite is configured in `package.json` (no test runner script).
