"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { tracks, trackVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { MusicProvider, Track, TrackVersion } from "@/types/music";

export async function getTracks(): Promise<Track[]> {
  const db = getDb();

  const rows = await db.query.tracks.findMany({
    with: {
      versions: true,
      trackThemes: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    genre: row.genre,
    // Defensive: tags column may not exist yet in older DB instances
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    themeIds: row.trackThemes.map((tt) => tt.themeId),
    versions: row.versions.map((v): TrackVersion => ({
      id: v.id,
      trackId: v.trackId,
      versionNumber: v.versionNumber,
      createdAt: v.createdAt.toISOString(),
      status: v.status,
      prompt: v.prompt,
      negativePrompt: v.negativePrompt,
      lyrics: v.lyrics,
      style: v.style,
      rating: v.rating,
      dimensionScores: v.dimensionScores,
      notes: v.notes,
      feedback: v.feedback,
      isBest: v.isBest,
      audioFileName: v.audioFileName ?? null,
      audioUrl: v.audioUrl ?? null,
      sunoTaskId: v.sunoTaskId ?? null,
      provider: ((v.provider ?? v.style?.provider ?? "suno") as MusicProvider),
      providerTaskId: v.providerTaskId ?? v.sunoTaskId ?? null,
    })),
  }));
}

export async function createTrack(data: { name: string; genre: string }) {
  const db = getDb();
  await db.insert(tracks).values({
    name: data.name,
    genre: data.genre,
  });
  revalidatePath("/dashboard");
}

export async function updateTrack(
  id: string,
  data: { name?: string; genre?: string }
) {
  const db = getDb();
  await db
    .update(tracks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(tracks.id, id));
  revalidatePath("/dashboard");
}

export async function deleteTrack(id: string) {
  const db = getDb();
  await db.delete(tracks).where(eq(tracks.id, id));
  revalidatePath("/dashboard");
}

export async function duplicateTrack(trackId: string): Promise<string> {
  const db = getDb();

  // Fetch source track with all versions
  const sourceTrack = await db.query.tracks.findFirst({
    where: eq(tracks.id, trackId),
    with: {
      versions: true,
      trackThemes: true,
    },
  });

  if (!sourceTrack) {
    throw new Error(`Track ${trackId} not found`);
  }

  // Create new track with same genre/tags and " (copy)" appended to name
  const [newTrack] = await db
    .insert(tracks)
    .values({
      name: `${sourceTrack.name} (copy)`,
      genre: sourceTrack.genre,
      tags: (sourceTrack.tags as string[]) ?? [],
    })
    .returning();

  // Sort versions by versionNumber to preserve order
  const sortedVersions = [...sourceTrack.versions].sort(
    (a, b) => a.versionNumber - b.versionNumber
  );

  // Insert all versions with status reset to "draft" and audio cleared
  for (const v of sortedVersions) {
    const originalStatus = v.status;
    const status =
      originalStatus === "generating" || originalStatus === "complete"
        ? "draft"
        : originalStatus === "archived"
        ? "draft"
        : "draft";

    await db.insert(trackVersions).values({
      trackId: newTrack.id,
      versionNumber: v.versionNumber,
      status,
      prompt: v.prompt,
      negativePrompt: v.negativePrompt,
      lyrics: v.lyrics,
      style: v.style,
      rating: v.rating,
      dimensionScores: v.dimensionScores,
      notes: v.notes,
      feedback: v.feedback,
      isBest: v.isBest,
      audioFileName: null,
      audioUrl: null,
      sunoTaskId: null,
      provider: (v.provider ?? "suno") as MusicProvider,
      providerTaskId: null,
    });
  }

  revalidatePath("/dashboard");

  return newTrack.id;
}

export async function updateTrackTags(
  trackId: string,
  tags: string[]
): Promise<void> {
  const db = getDb();
  await db
    .update(tracks)
    .set({ tags, updatedAt: new Date() })
    .where(eq(tracks.id, trackId));
  revalidatePath("/dashboard");
}
