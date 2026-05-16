import type { DimensionScores, TrackFeedback, TrackStyle } from "@/types/music";

export const DEFAULT_TRACK_STYLE: TrackStyle = {
  genre: "Electronic",
  moods: [],
  tempo: 120,
  key: "C",
  isMinor: false,
  instruments: [],
  vocalStyle: "None",
  duration: "2min",
  sunoApiVersion: "v4",
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
