"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { trackVersions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { TrackVersion, TrackStyle, DimensionScores, TrackFeedback } from "@/types/music";

const DEFAULT_STYLE: TrackStyle = {
  genre: "Electronic",
  moods: [],
  tempo: 120,
  key: "C",
  isMinor: false,
  instruments: [],
  vocalStyle: "None",
  duration: "2min",
  sunoApiVersion: "v4",
};

const DEFAULT_DIMENSION_SCORES: DimensionScores = {
  melody: 0,
  harmony: 0,
  rhythm: 0,
  production: 0,
  lyricsFit: 0,
  originality: 0,
  emotionalImpact: 0,
};

const DEFAULT_FEEDBACK: TrackFeedback = {
  musicPositives: "",
  musicNegatives: "",
  lyricsPositives: "",
  lyricsNegatives: "",
  thingsToAvoid: "",
};

export async function createVersion(
  trackId: string,
  data: Partial<TrackVersion>
) {
  const db = getDb();

  await db.insert(trackVersions).values({
    trackId,
    versionNumber: data.versionNumber ?? 1,
    status: data.status ?? "draft",
    prompt: data.prompt ?? "",
    negativePrompt: data.negativePrompt ?? "",
    lyrics: data.lyrics ?? "",
    style: data.style ?? DEFAULT_STYLE,
    rating: data.rating ?? 0,
    dimensionScores: data.dimensionScores ?? DEFAULT_DIMENSION_SCORES,
    notes: data.notes ?? "",
    feedback: data.feedback ?? DEFAULT_FEEDBACK,
    isBest: data.isBest ?? false,
    audioFileName: data.audioFileName ?? null,
    audioUrl: data.audioUrl ?? null,
    sunoTaskId: data.sunoTaskId ?? null,
  });

  revalidatePath("/dashboard");
}

export async function updateVersion(
  id: string,
  updates: Partial<TrackVersion>
) {
  const db = getDb();

  // Fetch existing version to merge jsonb fields
  const existing = await db.query.trackVersions.findFirst({
    where: eq(trackVersions.id, id),
  });

  if (!existing) {
    throw new Error(`Version ${id} not found`);
  }

  const mergedStyle =
    updates.style !== undefined
      ? { ...existing.style, ...updates.style }
      : undefined;

  const mergedDimensionScores =
    updates.dimensionScores !== undefined
      ? { ...existing.dimensionScores, ...updates.dimensionScores }
      : undefined;

  const mergedFeedback =
    updates.feedback !== undefined
      ? { ...existing.feedback, ...updates.feedback }
      : undefined;

  /* Remove campos mergeados ou não atualizáveis do spread para `.set()`. */
  /* eslint-disable @typescript-eslint/no-unused-vars -- omitir chaves via desestruturação */
  const {
    style,
    dimensionScores,
    feedback,
    id: _id,
    trackId: _trackId,
    createdAt: _createdAt,
    ...scalarUpdates
  } = updates;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  await db
    .update(trackVersions)
    .set({
      ...scalarUpdates,
      ...(mergedStyle !== undefined ? { style: mergedStyle } : {}),
      ...(mergedDimensionScores !== undefined ? { dimensionScores: mergedDimensionScores } : {}),
      ...(mergedFeedback !== undefined ? { feedback: mergedFeedback } : {}),
      updatedAt: new Date(),
    })
    .where(eq(trackVersions.id, id));

  revalidatePath("/dashboard");
}

export async function cloneVersion(versionId: string) {
  const db = getDb();

  const source = await db.query.trackVersions.findFirst({
    where: eq(trackVersions.id, versionId),
  });

  if (!source) {
    throw new Error(`Version ${versionId} not found`);
  }

  // Find the highest version number for this track
  const siblings = await db.query.trackVersions.findMany({
    where: eq(trackVersions.trackId, source.trackId),
  });

  const maxVersionNumber = siblings.reduce(
    (max, v) => Math.max(max, v.versionNumber),
    0
  );

  const [newVersion] = await db.insert(trackVersions).values({
    trackId: source.trackId,
    versionNumber: maxVersionNumber + 1,
    status: "draft",
    prompt: source.prompt,
    negativePrompt: source.negativePrompt,
    lyrics: source.lyrics,
    style: source.style,
    rating: 0,
    dimensionScores: DEFAULT_DIMENSION_SCORES,
    notes: "",
    feedback: DEFAULT_FEEDBACK,
    isBest: false,
    audioFileName: null,
    audioUrl: null,
    sunoTaskId: null,
  }).returning();

  revalidatePath("/dashboard");

  return {
    id: newVersion.id,
    versionNumber: newVersion.versionNumber,
  };
}

export async function markBest(trackId: string, versionId: string) {
  const db = getDb();

  // Set all versions of the track to isBest=false
  await db
    .update(trackVersions)
    .set({ isBest: false, updatedAt: new Date() })
    .where(eq(trackVersions.trackId, trackId));

  // Set the specified version to isBest=true
  await db
    .update(trackVersions)
    .set({ isBest: true, updatedAt: new Date() })
    .where(eq(trackVersions.id, versionId));

  revalidatePath("/dashboard");
}
