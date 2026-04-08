<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Product overview
Musicalizer Magic is a Next.js 16 (App Router) AI music production workbench. Users create tracks, manage versions, write prompts/lyrics, assign themes, and evaluate results. External AI integrations (Suno, Anthropic, Vercel Blob) are optional.

### Local database setup
The app uses `@neondatabase/serverless` (neon-http driver) which requires an HTTP-compatible endpoint. For local development:
- PostgreSQL runs on port 5432 (user `devuser`, password `devpass`, database `musicalizer_magic`).
- A neon HTTP proxy container (`ghcr.io/timowilhelm/local-neon-http-proxy:main`) runs on port 4444 and bridges the neon driver to local PostgreSQL.
- `src/instrumentation.ts` intercepts fetch calls to `localtest.me` and redirects them to the local proxy. This requires `NEON_LOCAL_PROXY=http://db.localtest.me:4444/sql` in `.env`.
- The DNS entry `127.0.0.1 db.localtest.me` must be in `/etc/hosts`.
- The PostgreSQL user must be a superuser (the neon proxy queries `pg_authid` for authentication).

### Key commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build (uses `--webpack` flag) |
| `npm run lint` / `npx eslint .` | Lint |
| `npx tsc --noEmit` | Type check |

### Gotchas
- **neonConfig module instances**: Setting `neonConfig.fetchEndpoint` in `instrumentation.ts` does NOT affect the bundled server component code (webpack creates separate module instances). The workaround is intercepting `globalThis.fetch` in the instrumentation `register()` function.
- **drizzle-kit push**: Cannot use `npx drizzle-kit push` locally because it also tries the neon websocket driver. Create/migrate tables using `psql` directly against `localhost:5432`.
- **No migration files**: The `drizzle/` directory is empty; the schema is defined in `src/lib/db/schema.ts` and pushed manually.
- `.env` is gitignored; copy from `.env.example` and fill in values. For local dev, set `DATABASE_URL` and `NEON_LOCAL_PROXY` as described above.
