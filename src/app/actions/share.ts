"use server";

import { getDb } from "@/lib/db";
import { shareLinks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";
import { requireOwnedTrack, requireOwnedVersion } from "@/lib/db/ownership";
import type { MusicProvider, TrackVersion } from "@/types/music";

function toShareSnapshot(
  version: Awaited<ReturnType<typeof requireOwnedVersion>>
): TrackVersion {
  return {
    id: version.id,
    trackId: version.trackId,
    versionNumber: version.versionNumber,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
    status: version.status,
    prompt: version.prompt,
    negativePrompt: version.negativePrompt,
    lyrics: version.lyrics,
    style: version.style,
    rating: version.rating,
    dimensionScores: version.dimensionScores,
    notes: version.notes,
    feedback: version.feedback,
    isBest: version.isBest,
    audioFileName: version.audioFileName ?? null,
    audioUrl: version.audioUrl ?? null,
    sunoTaskId: version.sunoTaskId ?? null,
    provider: (version.provider ?? version.style?.provider ?? "suno") as MusicProvider,
    providerTaskId: version.providerTaskId ?? version.sunoTaskId ?? null,
  };
}

export async function createShareLink(
  trackId: string,
  versionId: string
): Promise<string> {
  const userId = await requireUserId();
  const ownedTrack = await requireOwnedTrack(trackId, userId);
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
    trackName: ownedTrack.name,
    versionData: toShareSnapshot(ownedVersion),
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
