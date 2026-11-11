import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { hashSessionToken, newSessionToken } from "@/lib/auth-password";
import { findSessionUser, revokeAuthSession, storeAuthSession } from "@/lib/auth-store";
import {
  SESSION_COOKIE_NAME, SESSION_LIFETIME_MS, SESSION_TOKEN_PATTERN, sessionCookieOptions,
} from "@/lib/auth-config";

export async function getCurrentUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token || !SESSION_TOKEN_PATTERN.test(token)) return null;
  try {
    return await findSessionUser(hashSessionToken(token));
  } catch {
    console.error("[auth] Session lookup unavailable");
    return null;
  }
}

/** Every action and API validates the persisted session, not just the cookie. */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

export async function requirePageUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/sign-in");
  return userId;
}

export async function startUserSession(userId: string): Promise<void> {
  const jar = await cookies();
  const previous = jar.get(SESSION_COOKIE_NAME)?.value;
  if (previous && SESSION_TOKEN_PATTERN.test(previous)) {
    await revokeAuthSession(hashSessionToken(previous));
  }
  const token = newSessionToken();
  const expires = new Date(Date.now() + SESSION_LIFETIME_MS);
  await storeAuthSession(hashSessionToken(token), userId, expires);
  jar.set(SESSION_COOKIE_NAME, token, { ...sessionCookieOptions, expires });
}

export async function endUserSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (token && SESSION_TOKEN_PATTERN.test(token)) {
    await revokeAuthSession(hashSessionToken(token));
  }
  jar.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions, maxAge: 0 });
}

/** New accounts never claim data belonging to legacy or unassigned identities. */
export async function ensureUserSettings(userId: string) {
  const db = getDb();
  await db.insert(userSettings).values({ userId }).onConflictDoNothing();
  return (await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  }))!;
}
