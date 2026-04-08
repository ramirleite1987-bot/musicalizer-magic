import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, serverError } from '@/lib/api-helpers'
import { shapeVersion } from '@/lib/shapes'
import { DEFAULT_TRACK_STYLE, DEFAULT_DIMENSION_SCORES, DEFAULT_TRACK_FEEDBACK } from '@/lib/track-defaults'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const versions = await prisma.trackVersion.findMany({
      where: { trackId: params.id },
      orderBy: { versionNumber: 'asc' },
    })
    return ok(versions.map(shapeVersion))
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const lastVersion = await prisma.trackVersion.findFirst({
      where: { trackId: params.id },
      orderBy: { versionNumber: 'desc' },
    })
    const nextNumber = (lastVersion?.versionNumber ?? 0) + 1
    const version = await prisma.trackVersion.create({
      data: {
        trackId: params.id,
        versionNumber: nextNumber,
        prompt: body.prompt ?? '',
        negativePrompt: body.negativePrompt ?? '',
        lyrics: body.lyrics ?? '',
        style: body.style ?? DEFAULT_TRACK_STYLE,
        dimensionScores: body.dimensionScores ?? DEFAULT_DIMENSION_SCORES,
        feedback: body.feedback ?? DEFAULT_TRACK_FEEDBACK,
        status: body.status ?? 'draft',
        rating: body.rating ?? 0,
        notes: body.notes ?? '',
        isBest: false,
      },
    })
    return created(shapeVersion(version))
  } catch (e) {
    return serverError(e)
  }
}
