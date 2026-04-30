import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrackStyle } from "@/types/music";

vi.mock("@/lib/suno/client", () => ({
  createGeneration: vi.fn(async () => ({ taskId: "suno-1", status: "queued" })),
  getGenerationStatus: vi.fn(async () => ({ taskId: "suno-1", status: "complete" })),
}));

vi.mock("@/lib/minimax/client", () => ({
  createGeneration: vi.fn(async () => ({ taskId: "mm-1", status: "queued" })),
  getGenerationStatus: vi.fn(async () => ({ taskId: "mm-1", status: "complete" })),
}));

import * as suno from "@/lib/suno/client";
import * as minimax from "@/lib/minimax/client";
import { createGeneration, getGenerationStatus, resolveProvider } from "@/lib/music";

const baseStyle: TrackStyle = {
  genre: "Electronic",
  moods: [],
  tempo: 120,
  key: "C",
  isMinor: false,
  instruments: [],
  vocalStyle: "None",
  duration: "2m",
  sunoApiVersion: "v5.5",
};

describe("music dispatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to suno when style.provider is unset", () => {
    expect(resolveProvider(baseStyle)).toBe("suno");
  });

  it("routes createGeneration to Suno when provider is suno", async () => {
    const result = await createGeneration({
      prompt: "x",
      style: { ...baseStyle, provider: "suno" },
    });
    expect(suno.createGeneration).toHaveBeenCalledOnce();
    expect(minimax.createGeneration).not.toHaveBeenCalled();
    expect(result.taskId).toBe("suno-1");
  });

  it("routes createGeneration to Minimax when provider is minimax", async () => {
    const result = await createGeneration({
      prompt: "x",
      style: { ...baseStyle, provider: "minimax", minimaxModel: "music-1.5" },
    });
    expect(minimax.createGeneration).toHaveBeenCalledOnce();
    expect(suno.createGeneration).not.toHaveBeenCalled();
    expect(result.taskId).toBe("mm-1");
  });

  it("routes getGenerationStatus to the right provider", async () => {
    await getGenerationStatus("suno", "suno-1");
    expect(suno.getGenerationStatus).toHaveBeenCalledWith("suno-1");

    await getGenerationStatus("minimax", "mm-1");
    expect(minimax.getGenerationStatus).toHaveBeenCalledWith("mm-1");
  });
});
