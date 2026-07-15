"use server";

import { getDb } from "@/lib/db";
import { shareLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { TrackVersion } from "@/types/music";

export async function createShareLink(
  trackId: string,
  versionId: string,
  trackName: string,
  version: TrackVersion
): Promise<string> {
  const db = getDb();
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 32);

  await db.insert(shareLinks).values({
    token,
    trackId,
    versionId,
    trackName,
    versionData: version,
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return `${baseUrl}/share/${token}`;
}

export async function revokeShareLink(token: string): Promise<void> {
  const db = getDb();
  await db
    .update(shareLinks)
    .set({ revokedAt: new Date() })
    .where(eq(shareLinks.token, token));
}

export async function getShareLink(
  token: string
): Promise<{ trackName: string; versionData: TrackVersion } | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  if (row.revokedAt) return null;

  return {
    trackName: row.trackName,
    versionData: row.versionData as TrackVersion,
  };
}
