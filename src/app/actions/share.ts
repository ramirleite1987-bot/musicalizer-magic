"use server";

import { getDb } from "@/lib/db";
import { shareLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { requireOwnedTrack, requireOwnedVersion } from "@/lib/db/ownership";
import type { TrackVersion } from "@/types/music";

export async function createShareLink(
  trackId: string,
  versionId: string,
  trackName: string,
  version: TrackVersion
): Promise<string> {
  const userId = await requireUserId();
  await requireOwnedTrack(trackId, userId);
  const ownedVersion = await requireOwnedVersion(versionId, userId);
  if (ownedVersion.trackId !== trackId) {
    throw new Error("Version not found");
  }
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
  const userId = await requireUserId();
  const db = getDb();
  const rows = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))
    .limit(1);
  const row = rows[0];
  if (!row) return;
  await requireOwnedTrack(row.trackId, userId);
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
