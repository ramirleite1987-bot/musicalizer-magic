import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { tracks, trackVersions } from "@/lib/db/schema";
import {
  DEFAULT_DIMENSION_SCORES,
  DEFAULT_FEEDBACK,
} from "@/lib/music/defaults";
import {
  createSongInputSchema,
  mergeTrackStyle,
  songStatusInputSchema,
  type CreateSongInput,
  type SongStatusInput,
} from "@/lib/music/song-input";
import {
  createGeneration,
  getGenerationStatus,
  type SunoStatusResponse,
} from "@/lib/suno/client";

export interface CreatedSongResult {
  trackId: string;
  versionId: string;
  versionNumber: number;
  status: "draft" | "generating";
  sunoTaskId: string | null;
}

export interface SongStatusResult {
  versionId: string;
  status: "draft" | "generating" | "complete" | "archived";
  sunoTaskId: string | null;
  audioUrl: string | null;
  sunoStatus?: SunoStatusResponse["status"];
  error?: string;
}

export async function createSongFromPrompt(
  rawInput: CreateSongInput
): Promise<CreatedSongResult> {
  const input = createSongInputSchema.parse(rawInput);
  const db = getDb();
  const style = mergeTrackStyle(input.genre, input.style);

  const [track] = await db
    .insert(tracks)
    .values({
      name: input.trackName,
      genre: input.genre,
    })
    .returning({ id: tracks.id });

  const [version] = await db
    .insert(trackVersions)
    .values({
      trackId: track.id,
      versionNumber: 1,
      status: "draft",
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      lyrics: input.lyrics,
      style,
      rating: 0,
      dimensionScores: DEFAULT_DIMENSION_SCORES,
      notes: input.notes,
      feedback: DEFAULT_FEEDBACK,
      isBest: false,
      audioFileName: null,
      audioUrl: null,
      sunoTaskId: null,
    })
    .returning({
      id: trackVersions.id,
      versionNumber: trackVersions.versionNumber,
    });

  if (!input.startGeneration) {
    return {
      trackId: track.id,
      versionId: version.id,
      versionNumber: version.versionNumber,
      status: "draft",
      sunoTaskId: null,
    };
  }

  const generation = await createGeneration({
    prompt: input.prompt,
    negativePrompt: input.negativePrompt,
    lyrics: input.lyrics,
    style,
  });

  await db
    .update(trackVersions)
    .set({
      status: "generating",
      sunoTaskId: generation.taskId,
      updatedAt: new Date(),
    })
    .where(eq(trackVersions.id, version.id));

  return {
    trackId: track.id,
    versionId: version.id,
    versionNumber: version.versionNumber,
    status: "generating",
    sunoTaskId: generation.taskId,
  };
}

export async function startVersionGeneration(versionId: string) {
  const db = getDb();

  const [version] = await db
    .select()
    .from(trackVersions)
    .where(eq(trackVersions.id, versionId))
    .limit(1);

  if (!version) throw new Error("Version not found");
  if (version.status === "generating") throw new Error("Already generating");

  const generation = await createGeneration({
    prompt: version.prompt,
    negativePrompt: version.negativePrompt,
    lyrics: version.lyrics,
    style: version.style,
  });

  await db
    .update(trackVersions)
    .set({
      status: "generating",
      sunoTaskId: generation.taskId,
      updatedAt: new Date(),
    })
    .where(eq(trackVersions.id, versionId));

  return { taskId: generation.taskId };
}

export async function getSongStatus(
  rawInput: SongStatusInput
): Promise<SongStatusResult> {
  const input = songStatusInputSchema.parse(rawInput);
  const db = getDb();
  const version = await db.query.trackVersions.findFirst({
    where: eq(trackVersions.id, input.versionId),
  });

  if (!version) {
    throw new Error(`Version ${input.versionId} not found`);
  }

  if (version.status !== "generating" || !version.sunoTaskId) {
    return {
      versionId: version.id,
      status: version.status,
      sunoTaskId: version.sunoTaskId,
      audioUrl: version.audioUrl ?? null,
    };
  }

  const sunoStatus = await getGenerationStatus(version.sunoTaskId);

  if (sunoStatus.status === "complete" && sunoStatus.audioUrl) {
    await db
      .update(trackVersions)
      .set({
        status: "complete",
        audioUrl: sunoStatus.audioUrl,
        updatedAt: new Date(),
      })
      .where(eq(trackVersions.id, version.id));
  }

  return {
    versionId: version.id,
    status:
      sunoStatus.status === "complete" && sunoStatus.audioUrl
        ? "complete"
        : version.status,
    sunoTaskId: version.sunoTaskId,
    audioUrl: sunoStatus.audioUrl ?? version.audioUrl ?? null,
    sunoStatus: sunoStatus.status,
    error: sunoStatus.error,
  };
}
