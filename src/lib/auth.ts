import "server-only";
import { auth } from "@clerk/nextjs/server";
import { sql, isNull, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  tracks,
  themes,
  stylePresets,
  generationLogs,
  skills,
  userSettings,
} from "@/lib/db/schema";

/** Returns the current Clerk user id, throwing if the request is unauthenticated. */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

/**
 * Ensures a user_settings row exists for the user. The very first user of the
 * deployment also claims any rows created before authentication was added
 * (user_id IS NULL), so existing data isn't orphaned.
 */
export async function ensureUserSettings(userId: string) {
  const db = getDb();

  const existing = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });
  if (existing) return existing;

  const [{ total }] = await db
    .select({ total: sql<number>`cast(count(*) as integer)` })
    .from(userSettings);

  await db.insert(userSettings).values({ userId }).onConflictDoNothing();

  if (total === 0) {
    await Promise.all([
      db.update(tracks).set({ userId }).where(isNull(tracks.userId)),
      db.update(themes).set({ userId }).where(isNull(themes.userId)),
      db.update(stylePresets).set({ userId }).where(isNull(stylePresets.userId)),
      db
        .update(generationLogs)
        .set({ userId })
        .where(isNull(generationLogs.userId)),
      db.update(skills).set({ userId }).where(isNull(skills.userId)),
    ]);
  }

  return (await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  }))!;
}
