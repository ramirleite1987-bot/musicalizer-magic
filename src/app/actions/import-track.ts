"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { tracks, trackVersions } from "@/lib/db/schema";
import type { TrackVersion, MusicProvider } from "@/types/music";
import {
  DEFAULT_STYLE,
  DEFAULT_DIMENSION_SCORES,
  DEFAULT_FEEDBACK,
} from "@/lib/track-defaults";

export async function importTrack(data: {
  name: string;
  genre: string;
  versions: Partial<TrackVersion>[];
}): Promise<string> {
  const db = getDb();

  // Create the track with "(imported)" suffix
  const [newTrack] = await db
    .insert(tracks)
    .values({
      name: `${data.name} (imported)`,
      genre: data.genre,
    })
    .returning();

  const trackId = newTrack.id;

  // Create all versions in order, re-numbering from 1 if needed
  const versionsToInsert =
    data.versions.length > 0 ? data.versions : [{}];

  for (let i = 0; i < versionsToInsert.length; i++) {
    const v = versionsToInsert[i];
    await db.insert(trackVersions).values({
      trackId,
      versionNumber: v.versionNumber ?? i + 1,
      status: v.status ?? "draft",
      prompt: v.prompt ?? "",
      negativePrompt: v.negativePrompt ?? "",
      lyrics: v.lyrics ?? "",
      style: v.style ?? DEFAULT_STYLE,
      rating: v.rating ?? 0,
      dimensionScores: v.dimensionScores ?? DEFAULT_DIMENSION_SCORES,
      notes: v.notes ?? "",
      feedback: v.feedback ?? DEFAULT_FEEDBACK,
      isBest: v.isBest ?? false,
      audioFileName: null,
      audioUrl: null,
      sunoTaskId: null,
      provider: (v.provider ?? v.style?.provider ?? "suno") as MusicProvider,
      providerTaskId: null,
    });
  }

  revalidatePath("/dashboard");

  return trackId;
}
