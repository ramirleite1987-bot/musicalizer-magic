<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Project overview
**Musicalizer Magic** — Next.js 16 app (single product, not a monorepo). AI-powered music production assistant using Neon Postgres, Drizzle ORM, Anthropic Claude, Suno AI, and Vercel Blob.

### Standard commands
See `package.json` scripts: `npm run dev`, `npm run build`, `npm run lint`. TypeScript check: `npx tsc --noEmit`.

### Required secrets (env vars)
- `DATABASE_URL` — Neon Postgres connection string (required for the dashboard to load data).
- Optional: `ANTHROPIC_API_KEY`, `SUNO_API_KEY`, `SUNO_API_BASE_URL`, `BLOB_READ_WRITE_TOKEN`.

### Gotchas
- The app uses `package-lock.json` → always use `npm` (not pnpm/yarn).
- `npm run build` uses `next build --webpack` flag explicitly.
- The dashboard page (`/dashboard`) calls the DB on SSR; without `DATABASE_URL`, the error boundary shows "No database connection string was provided to neon()". This is expected and does not block lint, typecheck, or build.
- Database schema is managed via Drizzle Kit: `npx drizzle-kit push` to sync schema to a Neon DB.
- No automated test suite exists in this repo (no test runner configured).
- Seed data script at `src/lib/db/seed.ts` — run with `npx tsx src/lib/db/seed.ts` (requires `DATABASE_URL`).
- The dev server must be started with `DATABASE_URL` in the environment for the dashboard to work; pass it inline or use a `.env` file.
