# Native authentication

Musicalizer uses email/password accounts and opaque database sessions. No Clerk keys or external authentication provider are needed. Keep `DATABASE_URL` configured in Vercel Production; `APP_ENCRYPTION_KEY` still encrypts optional per-user API keys and is unrelated to login.

- `/sign-up`: name, normalized email, password (12–128 characters), confirmation.
- `/sign-in`: email and password; generic credential errors.
- Passwords use salted scrypt (N=32768, r=8, p=3); only the derived hash is stored.
- Session tokens contain 32 random bytes. Only SHA-256 digests are stored in `auth_sessions`; sessions expire after seven days and logout revokes them.
- Production cookies use the `__Host-` prefix, Secure, HttpOnly, SameSite=Lax and Path=/.
- Authentication mutations require a matching request origin. Persistent, atomic counters allow 20 attempts per 15 minutes per Vercel client IP; local/non-Vercel installations share a conservative fallback bucket. Only Vercel's own `x-vercel-forwarded-for` header is trusted.
- The proxy performs optimistic routing. Every private page, Server Action and API validates the persisted session. Existing resource ownership checks still apply.
- Migration `drizzle/0007_native_auth.sql` adds three auth tables and indexes. The same idempotent DDL runs on cold start and retries lazily if initialization fails.

## Existing data

Old Clerk identities and unassigned rows are preserved. Creating an account never claims these rows, even when the email matches an old account. If old data needs transferring, an administrator must verify identity and explicitly map the old `user_id` to the new native account id across tracks, themes, presets, generation logs, skills and user settings. Do not infer ownership from a public signup or reassign rows to the first account.

This implementation provides signup, signin and logout. Email verification and password recovery are not currently implemented.

## Verification

Run the quality gates in `AGENTS.md`. Native-auth integration tests execute the real migrations and SQL with a disposable PGlite PostgreSQL instance; no production database or credentials are used.
