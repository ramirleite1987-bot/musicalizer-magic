// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as schema from "@/lib/db/schema";

let database: PgliteDatabase<typeof schema>;
let postgres: PGlite;
const request = vi.hoisted(() => ({
  cookies: new Map<string, string>(),
  headers: new Headers(),
  setCookie: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ getDb: () => database }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: async () => request.headers,
  cookies: async () => ({
    get: (name: string) => {
      const value = request.cookies.get(name);
      return value === undefined ? undefined : { value };
    },
    set: (name: string, value: string, options: unknown) => {
      request.cookies.set(name, value);
      request.setCookie(name, value, options);
    },
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
}));

import { signIn, signOut, signUp } from "@/app/actions/auth";
import { ensureUserSettings, getCurrentUserId, requireUserId, startUserSession } from "@/lib/auth";
import { allowAuthAttempt, findAuthUser, findSessionUser } from "@/lib/auth-store";
import { hashSessionToken, newSessionToken } from "@/lib/auth-password";
import { SESSION_COOKIE_NAME } from "@/lib/auth-config";
import { getTracks } from "@/app/actions/tracks";
import { requireOwnedTrack } from "@/lib/db/ownership";

const password = "a long test password 2026";
function fields(extra: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    name: "Test Musician", email: "musician@example.test", password, confirmPassword: password, ...extra,
  })) form.set(key, value);
  return form;
}

describe("native authentication with PostgreSQL", () => {
  beforeAll(async () => {
    postgres = new PGlite();
    database = drizzle(postgres, { schema });
    for (const file of readdirSync("drizzle").filter((name) => name.endsWith(".sql")).sort()) {
      await postgres.exec(readFileSync(`drizzle/${file}`, "utf8"));
    }
  }, 30_000);

  beforeEach(async () => {
    await postgres.exec("TRUNCATE auth_users, auth_sessions, auth_attempts, user_settings, tracks CASCADE");
    request.cookies.clear();
    request.setCookie.mockClear();
    request.headers = new Headers({ host: "music.example.test", origin: "https://music.example.test" });
  });

  afterAll(async () => { await postgres.close(); });

  it("registers a normalized account with a hashed password and opaque session", async () => {
    await expect(signUp({ error: null }, fields({ email: "  MUSICIAN@example.test " }))).rejects.toThrow("REDIRECT:/dashboard");
    const user = await findAuthUser("musician@example.test");
    expect(user?.passwordHash).toMatch(/^scrypt\$/);
    expect(user?.passwordHash).not.toContain(password);
    expect(await getCurrentUserId()).toBe(user?.id);
    const token = request.cookies.get(SESSION_COOKIE_NAME)!;
    const [session] = await database.select().from(schema.authSessions);
    expect(session.tokenHash).toBe(hashSessionToken(token));
    expect(session.tokenHash).not.toBe(token);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now() + 6 * 24 * 60 * 60 * 1000);
    expect(request.setCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME, token,
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }));
  });

  it("rejects weak or mismatched passwords and duplicate registrations", async () => {
    expect(await signUp({ error: null }, fields({ password: "short", confirmPassword: "short" }))).toEqual({ error: "invalid_fields" });
    expect(await signUp({ error: null }, fields({ confirmPassword: "does not match" }))).toEqual({ error: "invalid_fields" });
    await expect(signUp({ error: null }, fields())).rejects.toThrow("REDIRECT:/dashboard");
    expect(await signUp({ error: null }, fields())).toEqual({ error: "registration_failed" });
    expect(await database.select().from(schema.authUsers)).toHaveLength(1);
  });

  it("signs in, rotates sessions, revokes logout and rejects replay and expiry", async () => {
    await expect(signUp({ error: null }, fields())).rejects.toThrow("REDIRECT:/dashboard");
    const oldToken = request.cookies.get(SESSION_COOKIE_NAME)!;
    expect(await signIn({ error: null }, fields({ password: "incorrect password" }))).toEqual({ error: "invalid_credentials" });
    expect(await signIn({ error: null }, fields({ email: "absent@example.test" }))).toEqual({ error: "invalid_credentials" });
    await expect(signIn({ error: null }, fields())).rejects.toThrow("REDIRECT:/dashboard");
    expect(request.cookies.get(SESSION_COOKIE_NAME)).not.toBe(oldToken);
    expect(await findSessionUser(hashSessionToken(oldToken))).toBeNull();
    const activeToken = request.cookies.get(SESSION_COOKIE_NAME)!;
    const userId = (await getCurrentUserId())!;
    await expect(signOut()).rejects.toThrow("REDIRECT:/sign-in");
    request.cookies.set(SESSION_COOKIE_NAME, activeToken);
    expect(await getCurrentUserId()).toBeNull();
    await startUserSession(userId);
    await database.update(schema.authSessions).set({ expiresAt: new Date(0) });
    expect(await getCurrentUserId()).toBeNull();
    request.cookies.set(SESSION_COOKIE_NAME, newSessionToken());
    await expect(requireUserId()).rejects.toThrow("Not authenticated");
  });

  it("rejects cross-origin authentication without creating users or sessions", async () => {
    request.headers.set("origin", "https://attacker.example.test");
    expect(await signUp({ error: null }, fields())).toEqual({ error: "invalid_origin" });
    expect(await signIn({ error: null }, fields())).toEqual({ error: "invalid_origin" });
    await expect(signOut()).rejects.toThrow("Invalid request origin");
    expect(await database.select().from(schema.authUsers)).toHaveLength(0);
    expect(await database.select().from(schema.authAttempts)).toHaveLength(0);
  });

  it("enforces an atomic attempt limit and reopens the window after 15 minutes", async () => {
    const now = new Date();
    const key = hashSessionToken("rate-test");
    const attempts = await Promise.all(Array.from({ length: 22 }, () => allowAuthAttempt(key, now)));
    expect(attempts.filter(Boolean)).toHaveLength(20);
    expect(await allowAuthAttempt(key, new Date(now.getTime() + 15 * 60 * 1000))).toBe(true);
    await Promise.all(Array.from({ length: 20 }, () => allowAuthAttempt(hashSessionToken("local"))));
    expect(await signIn({ error: null }, fields())).toEqual({ error: "rate_limited" });
  });

  it("isolates two accounts and preserves unassigned and legacy-owned data", async () => {
    await expect(signUp({ error: null }, fields())).rejects.toThrow("REDIRECT:/dashboard");
    const first = (await getCurrentUserId())!;
    const [own, other, unassigned, legacy] = await database.insert(schema.tracks).values([
      { userId: first, name: "First account", genre: "pop" },
      { userId: "second-placeholder", name: "Second account", genre: "pop" },
      { userId: null, name: "Unassigned", genre: "pop" },
      { userId: "user_legacy_clerk", name: "Legacy account", genre: "pop" },
    ]).returning();
    await ensureUserSettings(first);
    expect((await getTracks()).map((track) => track.id)).toEqual([own.id]);
    await expect(requireOwnedTrack(other.id, first)).rejects.toThrow("Track not found");
    await expect(signUp({ error: null }, fields({ email: "second@example.test" }))).rejects.toThrow("REDIRECT:/dashboard");
    const second = (await getCurrentUserId())!;
    await database.update(schema.tracks).set({ userId: second }).where(eq(schema.tracks.id, other.id));
    await ensureUserSettings(second);
    expect((await getTracks()).map((track) => track.id)).toEqual([other.id]);
    await expect(requireOwnedTrack(own.id, second)).rejects.toThrow("Track not found");
    const rows = await database.select().from(schema.tracks);
    expect(rows.find((row) => row.id === unassigned.id)?.userId).toBeNull();
    expect(rows.find((row) => row.id === legacy.id)?.userId).toBe("user_legacy_clerk");
  });
});
