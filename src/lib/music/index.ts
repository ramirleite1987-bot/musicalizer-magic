import type {
  MinimaxAudioFormat,
  MusicProvider,
  TrackStyle,
} from "@/types/music";
import * as suno from "@/lib/suno/client";
import * as minimax from "@/lib/minimax/client";

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  lyrics?: string;
  style: TrackStyle;
}

export interface GenerationResponse {
  taskId: string;
  status: "queued" | "processing" | "complete" | "failed";
}

export interface StatusResponse {
  taskId: string;
  status: "queued" | "processing" | "complete" | "failed";
  audioUrl?: string;
  error?: string;
}

export function resolveProvider(style: TrackStyle): MusicProvider {
  return style.provider ?? "suno";
}

export async function createGeneration(
  params: GenerationParams
): Promise<GenerationResponse> {
  const provider = resolveProvider(params.style);
  if (provider === "minimax") return minimax.createGeneration(params);
  return suno.createGeneration(params);
}

export async function getGenerationStatus(
  provider: MusicProvider,
  taskId: string
): Promise<StatusResponse> {
  if (provider === "minimax") return minimax.getGenerationStatus(taskId);
  return suno.getGenerationStatus(taskId);
}

const CONTENT_TYPES: Record<MinimaxAudioFormat, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  pcm: "audio/L16",
};

export interface AudioFileMeta {
  extension: MinimaxAudioFormat;
  contentType: string;
}

// Suno only emits mp3 today, so the format only varies for Minimax.
export function inferAudioFile(
  provider: MusicProvider,
  style: TrackStyle
): AudioFileMeta {
  const format: MinimaxAudioFormat =
    provider === "minimax" ? style.audioQuality?.format ?? "mp3" : "mp3";
  return { extension: format, contentType: CONTENT_TYPES[format] };
}
