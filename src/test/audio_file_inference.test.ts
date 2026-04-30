import { describe, expect, it } from "vitest";
import { inferAudioFile } from "@/lib/music";
import type { TrackStyle } from "@/types/music";

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

describe("inferAudioFile", () => {
  it("always returns mp3 / audio/mpeg for Suno", () => {
    expect(inferAudioFile("suno", baseStyle)).toEqual({
      extension: "mp3",
      contentType: "audio/mpeg",
    });
    expect(
      inferAudioFile("suno", {
        ...baseStyle,
        audioQuality: { sampleRate: 44100, bitrate: 256000, format: "wav" },
      })
    ).toEqual({ extension: "mp3", contentType: "audio/mpeg" });
  });

  it("uses Minimax-selected format for the extension and content type", () => {
    expect(
      inferAudioFile("minimax", {
        ...baseStyle,
        audioQuality: { sampleRate: 44100, bitrate: 256000, format: "wav" },
      })
    ).toEqual({ extension: "wav", contentType: "audio/wav" });

    expect(
      inferAudioFile("minimax", {
        ...baseStyle,
        audioQuality: { sampleRate: 44100, bitrate: 256000, format: "pcm" },
      })
    ).toEqual({ extension: "pcm", contentType: "audio/L16" });
  });

  it("falls back to mp3 when Minimax style has no audioQuality", () => {
    expect(inferAudioFile("minimax", baseStyle)).toEqual({
      extension: "mp3",
      contentType: "audio/mpeg",
    });
  });
});
