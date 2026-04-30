import type { TrackStyle } from "@/types/music";

const MINIMAX_API_BASE =
  process.env.MINIMAX_API_BASE_URL ?? "https://api.minimaxi.chat/v1";

interface MinimaxGenerationParams {
  prompt: string;
  negativePrompt?: string;
  lyrics?: string;
  style: TrackStyle;
}

interface MinimaxGenerationResponse {
  taskId: string;
  status: "queued" | "processing" | "complete" | "failed";
}

interface MinimaxStatusResponse {
  taskId: string;
  status: "queued" | "processing" | "complete" | "failed";
  audioUrl?: string;
  error?: string;
}

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
    "Content-Type": "application/json",
  };
}

function buildMinimaxPrompt(params: MinimaxGenerationParams): string {
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

function parseDurationSeconds(duration: string): number {
  const match = duration.match(/(\d+)/);
  if (!match) return 120;
  const num = parseInt(match[1], 10);
  if (duration.includes("s")) return num;
  if (duration.includes("min") || duration.includes("m")) return num * 60;
  return num;
}

interface MinimaxRawResponse {
  task_id?: string;
  trace_id?: string;
  status?: string;
  audio_url?: string;
  output?: { audio_url?: string };
  base_resp?: { status_code?: number; status_msg?: string };
}

function normalizeStatus(raw: string | undefined): MinimaxStatusResponse["status"] {
  switch (raw) {
    case "succeeded":
    case "success":
    case "complete":
    case "completed":
      return "complete";
    case "failed":
    case "error":
      return "failed";
    case "queued":
    case "pending":
      return "queued";
    default:
      return "processing";
  }
}

export async function createGeneration(
  params: MinimaxGenerationParams
): Promise<MinimaxGenerationResponse> {
  const description = buildMinimaxPrompt(params);
  const isInstrumental = params.style.vocalStyle === "None";

  const body: Record<string, unknown> = {
    model: params.style.minimaxModel || "music-1.5",
    prompt: description,
    audio_setting: {
      sample_rate: 44100,
      bitrate: 256000,
      format: "mp3",
    },
    duration: parseDurationSeconds(params.style.duration),
  };

  if (params.lyrics && !isInstrumental) {
    body.lyrics = params.lyrics;
  } else if (isInstrumental) {
    body.lyrics = "";
  }

  if (params.negativePrompt) {
    body.negative_prompt = params.negativePrompt;
  }

  const res = await fetch(`${MINIMAX_API_BASE}/music_generation`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Minimax API error: ${res.status} - ${error}`);
  }

  const data = (await res.json()) as MinimaxRawResponse;

  if (data.base_resp && data.base_resp.status_code && data.base_resp.status_code !== 0) {
    throw new Error(
      `Minimax API error: ${data.base_resp.status_code} - ${data.base_resp.status_msg ?? "unknown"}`
    );
  }

  const taskId = data.task_id ?? data.trace_id;
  if (!taskId) {
    throw new Error("Minimax API returned no task identifier");
  }

  return {
    taskId,
    status: normalizeStatus(data.status),
  };
}

export async function getGenerationStatus(
  taskId: string
): Promise<MinimaxStatusResponse> {
  const url = new URL(`${MINIMAX_API_BASE}/query/music_generation`);
  url.searchParams.set("task_id", taskId);

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
  });

  if (!res.ok) {
    throw new Error(`Minimax status check failed: ${res.status}`);
  }

  const data = (await res.json()) as MinimaxRawResponse;

  if (data.base_resp && data.base_resp.status_code && data.base_resp.status_code !== 0) {
    return {
      taskId,
      status: "failed",
      error: data.base_resp.status_msg ?? "Minimax error",
    };
  }

  const status = normalizeStatus(data.status);
  const audioUrl = data.audio_url ?? data.output?.audio_url;

  return {
    taskId,
    status,
    audioUrl,
  };
}
