import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, serverError } from '@/lib/api-helpers'
import { shapeVersion } from '@/lib/shapes'
import type { TrackStyle, DimensionScores, TrackFeedback } from '@/types/music'

export async function GET(_req: NextRequest, { params }: { params: { id: string; versionId: string } }) {
  try {
    const version = await prisma.trackVersion.findUnique({ where: { id: params.versionId } })
    if (!version) return notFound()
    return ok(shapeVersion(version))
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; versionId: string } }) {
  try {
    const body = await req.json()
    const existing = await prisma.trackVersion.findUnique({ where: { id: params.versionId } })
    if (!existing) return notFound()

    const data: Record<string, unknown> = {}
    const scalarFields = ['prompt', 'negativePrompt', 'lyrics', 'status', 'rating', 'notes', 'audioFileName', 'audioUrl'] as const
    for (const field of scalarFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }
    if (body.style !== undefined) {
      data.style = { ...(existing.style as unknown as TrackStyle), ...body.style }
    }
    if (body.dimensionScores !== undefined) {
      data.dimensionScores = { ...(existing.dimensionScores as unknown as DimensionScores), ...body.dimensionScores }
    }
    if (body.feedback !== undefined) {
      data.feedback = { ...(existing.feedback as unknown as TrackFeedback), ...body.feedback }
    }

    let version
    if (body.isBest === true) {
      const [, updated] = await prisma.$transaction([
        prisma.trackVersion.updateMany({
          where: { trackId: params.id, NOT: { id: params.versionId } },
          data: { isBest: false },
        }),
        prisma.trackVersion.update({
          where: { id: params.versionId },
          data: { ...data, isBest: true },
        }),
      ])
      version = updated
    } else {
      if (body.isBest === false) data.isBest = false
      version = await prisma.trackVersion.update({
        where: { id: params.versionId },
        data,
      })
    }
    return ok(shapeVersion(version))
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; versionId: string } }) {
  try {
    await prisma.trackVersion.delete({ where: { id: params.versionId } })
    return ok({ success: true })
  } catch (e) {
    return serverError(e)
  }
}
