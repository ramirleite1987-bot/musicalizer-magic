import type { Track as PrismaTrack, TrackVersion as PrismaTrackVersion, Theme as PrismaTheme } from '@prisma/client'
import type { Track, TrackVersion, Theme, TrackStyle, DimensionScores, TrackFeedback, TrackStatus } from '@/types/music'

type PrismaTrackWithRelations = PrismaTrack & {
  versions: PrismaTrackVersion[]
  themes: PrismaTheme[]
}

export function shapeTrack(t: PrismaTrackWithRelations): Track {
  return {
    id: t.id,
    name: t.name,
    genre: t.genre,
    themeIds: t.themes.map(th => th.id),
    versions: t.versions.map(shapeVersion),
  }
}

export function shapeVersion(v: PrismaTrackVersion): TrackVersion {
  return {
    id: v.id,
    versionNumber: v.versionNumber,
    createdAt: v.createdAt.toISOString(),
    status: v.status as TrackStatus,
    prompt: v.prompt,
    negativePrompt: v.negativePrompt,
    lyrics: v.lyrics,
    style: v.style as unknown as TrackStyle,
    dimensionScores: v.dimensionScores as unknown as DimensionScores,
    feedback: v.feedback as unknown as TrackFeedback,
    rating: v.rating,
    notes: v.notes,
    isBest: v.isBest,
    audioFileName: v.audioFileName,
    audioUrl: v.audioUrl,
  }
}

export function shapeTheme(t: PrismaTheme): Theme {
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    keywords: t.keywords,
    color: t.color,
    source: t.source as Theme['source'],
    sourceRef: t.sourceRef,
    createdAt: t.createdAt.toISOString(),
  }
}
