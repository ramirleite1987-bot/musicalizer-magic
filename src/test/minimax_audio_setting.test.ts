import { describe, expect, it } from "vitest";
import { buildAudioSetting, DEFAULT_AUDIO_QUALITY } from "@/lib/minimax/client";
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

describe("buildAudioSetting", () => {
  it("uses defaults when audioQuality is missing", () => {
    expect(buildAudioSetting(baseStyle)).toEqual({
      sample_rate: DEFAULT_AUDIO_QUALITY.sampleRate,
      bitrate: DEFAULT_AUDIO_QUALITY.bitrate,
      format: DEFAULT_AUDIO_QUALITY.format,
    });
  });

  it("forwards user-selected audio quality (camelCase to snake_case)", () => {
    const style: TrackStyle = {
      ...baseStyle,
      audioQuality: { sampleRate: 48000, bitrate: 320000, format: "wav" },
    };
    expect(buildAudioSetting(style)).toEqual({
      sample_rate: 48000,
      bitrate: 320000,
      format: "wav",
    });
  });

  it("falls back to defaults for individual missing fields", () => {
    const style: TrackStyle = {
      ...baseStyle,
      // missing bitrate
      audioQuality: {
        sampleRate: 22050,
        format: "pcm",
      } as unknown as TrackStyle["audioQuality"],
    };
    expect(buildAudioSetting(style)).toEqual({
      sample_rate: 22050,
      bitrate: DEFAULT_AUDIO_QUALITY.bitrate,
      format: "pcm",
    });
  });
});
