import { z } from "zod";
import { DEFAULT_TRACK_STYLE } from "@/lib/music/defaults";
import type { TrackStyle } from "@/types/music";

const trimmedString = (max: number) => z.string().trim().min(1).max(max);

export const trackStyleInputSchema = z
  .object({
    genre: trimmedString(100).optional(),
    moods: z.array(trimmedString(80)).max(12).optional(),
    tempo: z.number().int().min(40).max(240).optional(),
    key: trimmedString(12).optional(),
    isMinor: z.boolean().optional(),
    instruments: z.array(trimmedString(80)).max(16).optional(),
    vocalStyle: trimmedString(80).optional(),
    duration: trimmedString(40).optional(),
    sunoApiVersion: trimmedString(20).optional(),
  })
  .strict();

export const createSongInputSchema = z
  .object({
    trackName: trimmedString(255),
    genre: trimmedString(100).default(DEFAULT_TRACK_STYLE.genre),
    prompt: trimmedString(4_000),
    negativePrompt: z.string().trim().max(2_000).default(""),
    lyrics: z.string().trim().max(12_000).default(""),
    notes: z.string().trim().max(2_000).default(""),
    style: trackStyleInputSchema.default({}),
    startGeneration: z.boolean().default(true),
  })
  .strict();

export const songStatusInputSchema = z
  .object({
    versionId: z.string().uuid(),
  })
  .strict();

export type CreateSongInput = z.input<typeof createSongInputSchema>;
export type SongStatusInput = z.input<typeof songStatusInputSchema>;

export function mergeTrackStyle(
  genre: string,
  style: z.infer<typeof trackStyleInputSchema>
): TrackStyle {
  return {
    ...DEFAULT_TRACK_STYLE,
    ...style,
    genre: style.genre ?? genre,
  };
}
