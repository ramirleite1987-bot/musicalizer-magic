export type TrackStatus = "draft" | "generating" | "complete" | "archived";

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
  sunoApiVersion: string;
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
