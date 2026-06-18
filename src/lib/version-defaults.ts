import type {
  DimensionScores,
  TrackFeedback,
  TrackStyle,
} from "@/types/music";

export const DEFAULT_STYLE: TrackStyle = {
  genre: "Electronic",
  moods: [],
  tempo: 120,
  key: "C",
  isMinor: false,
  instruments: [],
  vocalStyle: "None",
  duration: "2min",
  language: "pt",
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
