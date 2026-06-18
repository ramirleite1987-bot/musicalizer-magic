import type { TrackStyle, DimensionScores, TrackFeedback } from "@/types/music";

/**
 * Shared defaults for newly-created track versions.
 *
 * These are the canonical fallbacks used whenever a version is created without
 * fully-specified data (e.g. a blank version, an imported version, or a version
 * seeded from a template). Keeping them in one place avoids the values drifting
 * apart between the different server actions that create versions.
 */
export const DEFAULT_STYLE: TrackStyle = {
  genre: "Electronic",
  moods: [],
  tempo: 120,
  key: "C",
  isMinor: false,
  instruments: [],
  vocalStyle: "None",
  duration: "2min",
  provider: "suno",
  sunoApiVersion: "v5.5",
  minimaxModel: "music-1.5",
  audioQuality: {
    sampleRate: 44100,
    bitrate: 256000,
    format: "mp3",
  },
};

export const DEFAULT_DIMENSION_SCORES: DimensionScores = {
  melody: 0,
  harmony: 0,
  rhythm: 0,
  production: 0,
  lyricsFit: 0,
  originality: 0,
  emotionalImpact: 0,
};

export const DEFAULT_FEEDBACK: TrackFeedback = {
  musicPositives: "",
  musicNegatives: "",
  lyricsPositives: "",
  lyricsNegatives: "",
  thingsToAvoid: "",
};
