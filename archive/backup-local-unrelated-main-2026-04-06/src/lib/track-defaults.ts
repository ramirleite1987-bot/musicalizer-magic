import type { TrackStyle, DimensionScores, TrackFeedback } from '@/types/music'

export const DEFAULT_TRACK_STYLE: TrackStyle = {
  genre: 'Pop',
  moods: [],
  tempo: 120,
  key: 'C',
  isMinor: false,
  instruments: [],
  vocalStyle: 'Neutral',
  duration: '3:00',
  sunoApiVersion: 'v4',
}

export const DEFAULT_DIMENSION_SCORES: DimensionScores = {
  melody: 0,
  harmony: 0,
  rhythm: 0,
  production: 0,
  lyricsFit: 0,
  originality: 0,
  emotionalImpact: 0,
}

export const DEFAULT_TRACK_FEEDBACK: TrackFeedback = {
  musicPositives: '',
  musicNegatives: '',
  lyricsPositives: '',
  lyricsNegatives: '',
  thingsToAvoid: '',
}
