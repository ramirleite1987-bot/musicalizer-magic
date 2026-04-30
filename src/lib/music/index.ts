import type { MusicProvider, TrackStyle } from "@/types/music";
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
