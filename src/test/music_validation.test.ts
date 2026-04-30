import { describe, expect, it } from "vitest";
import {
  InvalidTrackStyleError,
  trackStyleSchema,
  validateForGeneration,
} from "@/lib/music/validation";
import type { TrackStyle } from "@/types/music";

const validSuno: TrackStyle = {
  genre: "Electronic",
  moods: [],
  tempo: 120,
  key: "C",
  isMinor: false,
  instruments: [],
  vocalStyle: "None",
  duration: "2m",
  provider: "suno",
  sunoApiVersion: "v5.5",
};

const validMinimax: TrackStyle = {
  ...validSuno,
  provider: "minimax",
  minimaxModel: "music-1.5",
  audioQuality: { sampleRate: 44100, bitrate: 256000, format: "mp3" },
};

describe("trackStyleSchema", () => {
  it("accepts a valid Suno style", () => {
    expect(trackStyleSchema.safeParse(validSuno).success).toBe(true);
  });

  it("accepts a valid Minimax style", () => {
    expect(trackStyleSchema.safeParse(validMinimax).success).toBe(true);
  });

  it("defaults provider to suno when omitted", () => {
    const noProvider: Partial<TrackStyle> = { ...validSuno };
    delete noProvider.provider;
    expect(trackStyleSchema.safeParse(noProvider).success).toBe(true);
  });

  it("rejects an unknown Suno version", () => {
    const result = trackStyleSchema.safeParse({
      ...validSuno,
      sunoApiVersion: "v9.9",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["sunoApiVersion"]);
    }
  });

  it("rejects Minimax style missing model", () => {
    const style: Partial<TrackStyle> = { ...validMinimax };
    delete style.minimaxModel;
    const result = trackStyleSchema.safeParse(style);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["minimaxModel"]);
    }
  });

  it("rejects an out-of-range sample rate", () => {
    const result = trackStyleSchema.safeParse({
      ...validMinimax,
      audioQuality: { sampleRate: 11025, bitrate: 256000, format: "mp3" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects tempo outside the supported range", () => {
    const result = trackStyleSchema.safeParse({ ...validSuno, tempo: 10 });
    expect(result.success).toBe(false);
  });
});

describe("validateForGeneration", () => {
  it("returns silently for a valid style", () => {
    expect(() => validateForGeneration(validSuno)).not.toThrow();
  });

  it("throws InvalidTrackStyleError with summarized issues", () => {
    let caught: unknown;
    try {
      validateForGeneration({ ...validMinimax, minimaxModel: "music-2024" });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(InvalidTrackStyleError);
    if (caught instanceof InvalidTrackStyleError) {
      expect(caught.message).toContain("minimaxModel");
      expect(caught.issues.length).toBeGreaterThan(0);
    }
  });
});
