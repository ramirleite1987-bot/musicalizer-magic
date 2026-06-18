"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { tracks, trackVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { MusicProvider, Track, TrackVersion, TrackStyle } from "@/types/music";
import {
  DEFAULT_STYLE,
  DEFAULT_DIMENSION_SCORES,
  DEFAULT_FEEDBACK,
} from "@/lib/track-defaults";

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
      updatedAt: v.updatedAt.toISOString(),
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

// Optional starter content for the track's first version, e.g. when the user
// creates a track directly from a template. Validated because it crosses the
// client -> Server Action boundary.
const initialVersionSchema = z.object({
  prompt: z.string().max(5000).optional(),
  negativePrompt: z.string().max(2000).optional(),
  lyrics: z.string().max(20000).optional(),
  style: z
    .object({
      genre: z.string().max(100),
      moods: z.array(z.string().max(50)).max(32),
      tempo: z.number().min(20).max(400),
      key: z.string().max(8),
      isMinor: z.boolean(),
      instruments: z.array(z.string().max(50)).max(64),
      vocalStyle: z.string().max(50),
      duration: z.string().max(20),
      provider: z.enum(["suno", "minimax"]),
      sunoApiVersion: z.string().max(32),
      minimaxModel: z.string().max(64),
      audioQuality: z.object({
        sampleRate: z.number(),
        bitrate: z.number(),
        format: z.enum(["mp3", "wav", "pcm"]),
      }),
    })
    .partial()
    .optional(),
});

const createTrackSchema = z.object({
  name: z.string().trim().min(1).max(255),
  genre: z.string().trim().min(1).max(100),
  initialVersion: initialVersionSchema.optional(),
});

type CreateTrackInput = z.infer<typeof createTrackSchema>;

export async function createTrack(input: CreateTrackInput): Promise<string> {
  const data = createTrackSchema.parse(input);
  const db = getDb();

  const [newTrack] = await db
    .insert(tracks)
    .values({
      name: data.name,
      genre: data.genre,
    })
    .returning();

  // When created from a template, seed the first version with its
  // prompt/lyrics/style so the track is ready to generate, not empty.
  if (data.initialVersion) {
    const iv = data.initialVersion;
    const style: TrackStyle = {
      ...DEFAULT_STYLE,
      ...(iv.style as Partial<TrackStyle> | undefined),
    };

    await db.insert(trackVersions).values({
      trackId: newTrack.id,
      versionNumber: 1,
      status: "draft",
      prompt: iv.prompt ?? "",
      negativePrompt: iv.negativePrompt ?? "",
      lyrics: iv.lyrics ?? "",
      style,
      rating: 0,
      dimensionScores: DEFAULT_DIMENSION_SCORES,
      notes: "",
      feedback: DEFAULT_FEEDBACK,
      isBest: false,
      audioFileName: null,
      audioUrl: null,
      sunoTaskId: null,
      provider: style.provider ?? "suno",
      providerTaskId: null,
    });
  }

  revalidatePath("/dashboard");

  return newTrack.id;
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
