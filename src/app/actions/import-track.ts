"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { tracks, trackVersions } from "@/lib/db/schema";
import type { TrackVersion, TrackStyle, DimensionScores, TrackFeedback, MusicProvider } from "@/types/music";

const DEFAULT_STYLE: TrackStyle = {
  genre: "Electronic",
  moods: [],
  tempo: 120,
  key: "C",
  isMinor: false,
  instruments: [],
  vocalStyle: "None",
  duration: "2min",
  provider: "suno",
  sunoApiVersion: "v5.5",
  minimaxModel: "music-1.5",
  audioQuality: {
    sampleRate: 44100,
    bitrate: 256000,
    format: "mp3",
  },
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
