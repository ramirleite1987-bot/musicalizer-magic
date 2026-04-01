import type { TrackStyle } from "@/types/music";

const SUNO_API_BASE = process.env.SUNO_API_BASE_URL ?? "https://api.suno.ai/v2";

interface SunoGenerationParams {
  prompt: string;
  negativePrompt?: string;
  lyrics?: string;
  style: TrackStyle;
}

interface SunoGenerationResponse {
  taskId: string;
  status: "queued" | "processing" | "complete" | "failed";
}

interface SunoStatusResponse {
  taskId: string;
  status: "queued" | "processing" | "complete" | "failed";
  audioUrl?: string;
  error?: string;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
    "Content-Type": "application/json",
  };
}

function buildSunoPrompt(params: SunoGenerationParams): string {
  const parts: string[] = [];

  if (params.style.genre) parts.push(params.style.genre);
  if (params.style.moods.length > 0) parts.push(params.style.moods.join(", "));
  if (params.style.instruments.length > 0)
    parts.push(`featuring ${params.style.instruments.join(", ")}`);
  if (params.style.vocalStyle && params.style.vocalStyle !== "None")
    parts.push(`${params.style.vocalStyle} vocals`);
  parts.push(`${params.style.tempo} BPM`);
  parts.push(`Key of ${params.style.key}${params.style.isMinor ? " minor" : " major"}`);

  if (params.prompt) parts.push(params.prompt);

  return parts.join(". ");
}

export async function createGeneration(
  params: SunoGenerationParams
): Promise<SunoGenerationResponse> {
  const sunoPrompt = buildSunoPrompt(params);

  const body: Record<string, unknown> = {
    prompt: sunoPrompt,
    duration: parseDuration(params.style.duration),
    make_instrumental: params.style.vocalStyle === "None",
  };

  if (params.lyrics && params.style.vocalStyle !== "None") {
    body.lyrics = params.lyrics;
  }

  if (params.negativePrompt) {
    body.negative_prompt = params.negativePrompt;
  }

  const res = await fetch(`${SUNO_API_BASE}/generate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Suno API error: ${res.status} - ${error}`);
  }

  return res.json();
}

export async function getGenerationStatus(
  taskId: string
): Promise<SunoStatusResponse> {
  const res = await fetch(`${SUNO_API_BASE}/status/${taskId}`, {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Suno status check failed: ${res.status}`);
  }

  return res.json();
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)/);
  if (!match) return 120;
  const num = parseInt(match[1], 10);
  if (duration.includes("s")) return num;
  if (duration.includes("min")) return num * 60;
  return num;
}
