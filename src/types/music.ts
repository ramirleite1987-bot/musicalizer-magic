export type TrackStatus = "draft" | "generating" | "complete" | "archived";

export type MusicProvider = "suno" | "minimax";

export const SUNO_VERSIONS = [
  "v5.5",
  "v5",
  "v4.5",
  "v4",
  "v3.5",
  "v3",
  "chirp-v3-5",
  "chirp-v3-0",
] as const;

export const MINIMAX_MODELS = [
  "music-1.5",
  "music-01",
] as const;

export interface DimensionScores {
  melody: number;
  harmony: number;
  rhythm: number;
  production: number;
  lyricsFit: number;
  originality: number;
  emotionalImpact: number;
}

export interface TrackStyle {
  genre: string;
  moods: string[];
  tempo: number;
  key: string;
  isMinor: boolean;
  instruments: string[];
  vocalStyle: string;
  duration: string;
  provider?: MusicProvider;
  sunoApiVersion: string;
  minimaxModel?: string;
}

export interface TrackFeedback {
  musicPositives: string;
  musicNegatives: string;
  lyricsPositives: string;
  lyricsNegatives: string;
  thingsToAvoid: string;
}

export type ThemeSource = "manual" | "url" | "document";

export interface Theme {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  color: string;
  source: ThemeSource;
  sourceRef: string;
  createdAt: string;
}

export interface TrackVersion {
  id: string;
  trackId: string;
  versionNumber: number;
  createdAt: string;
  status: TrackStatus;
  prompt: string;
  negativePrompt: string;
  lyrics: string;
  style: TrackStyle;
  rating: number;
  dimensionScores: DimensionScores;
  notes: string;
  feedback: TrackFeedback;
  isBest: boolean;
  audioFileName: string | null;
  audioUrl: string | null;
  sunoTaskId: string | null;
  provider?: MusicProvider;
  providerTaskId?: string | null;
}

export interface Track {
  id: string;
  name: string;
  genre: string;
  themeIds: string[];
  versions: TrackVersion[];
  createdAt: string;
  updatedAt: string;
}
