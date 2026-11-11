import "server-only";
import { and, eq, gt, lte, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { authAttempts, authSessions, authUsers } from "@/lib/db/schema";

let initialization: Promise<void> | undefined;

/** Idempotent rollout, also represented by drizzle/0007_native_auth.sql. */
export async function ensureAuthSchema(): Promise<void> {
  initialization ??= (async () => {
    const db = getDb();
    await db.execute(sql`CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY, email VARCHAR(254) NOT NULL UNIQUE,
      name VARCHAR(80) NOT NULL, password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS auth_sessions (
      token_hash VARCHAR(64) PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions (expires_at)`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS auth_attempts (
      key VARCHAR(64) PRIMARY KEY, attempts INTEGER NOT NULL, reset_at TIMESTAMPTZ NOT NULL)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS auth_attempts_reset_at_idx ON auth_attempts (reset_at)`);
  })().catch((error) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

export async function findAuthUser(email: string) {
  await ensureAuthSchema();
  const [user] = await getDb().select().from(authUsers).where(eq(authUsers.email, email)).limit(1);
  return user ?? null;
}

export async function insertAuthUser(user: typeof authUsers.$inferInsert) {
  await ensureAuthSchema();
  const [created] = await getDb().insert(authUsers).values(user).onConflictDoNothing().returning();
  return created ?? null;
}

export async function storeAuthSession(tokenHash: string, userId: string, expiresAt: Date) {
  await ensureAuthSchema();
  await getDb().delete(authSessions).where(lte(authSessions.expiresAt, new Date()));
  await getDb().insert(authSessions).values({ tokenHash, userId, expiresAt });
}

export async function findSessionUser(tokenHash: string, now = new Date()) {
  await ensureAuthSchema();
  const [session] = await getDb().select({ userId: authSessions.userId })
    .from(authSessions).innerJoin(authUsers, eq(authUsers.id, authSessions.userId))
    .where(and(eq(authSessions.tokenHash, tokenHash), gt(authSessions.expiresAt, now))).limit(1);
  return session?.userId ?? null;
}

export async function revokeAuthSession(tokenHash: string) {
  await ensureAuthSchema();
  await getDb().delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
}

/** Atomic and persistent across serverless instances; does not lock an account by email. */
export async function allowAuthAttempt(key: string, now = new Date()): Promise<boolean> {
  await ensureAuthSchema();
  const db = getDb();
  const resetAt = new Date(now.getTime() + 15 * 60 * 1000);
  await db.delete(authAttempts).where(lte(authAttempts.resetAt, now));
  const [counter] = await db.insert(authAttempts).values({ key, attempts: 1, resetAt })
    .onConflictDoUpdate({ target: authAttempts.key, set: {
      attempts: sql`CASE WHEN ${authAttempts.resetAt} <= ${now} THEN 1 ELSE ${authAttempts.attempts} + 1 END`,
      resetAt: sql`CASE WHEN ${authAttempts.resetAt} <= ${now} THEN ${resetAt} ELSE ${authAttempts.resetAt} END`,
    } }).returning({ attempts: authAttempts.attempts });
  return counter.attempts <= 20;
}
