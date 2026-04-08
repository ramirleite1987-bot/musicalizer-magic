import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, serverError } from '@/lib/api-helpers'
import { shapeTrack } from '@/lib/shapes'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const track = await prisma.track.findUnique({
      where: { id: params.id },
      include: { versions: { orderBy: { versionNumber: 'asc' } }, themes: true },
    })
    if (!track) return notFound()
    return ok(shapeTrack(track))
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.genre !== undefined) data.genre = body.genre

    let track
    if (body.themeIds !== undefined) {
      track = await prisma.track.update({
        where: { id: params.id },
        data: {
          ...data,
          themes: { set: (body.themeIds as string[]).map((id: string) => ({ id })) },
        },
        include: { versions: { orderBy: { versionNumber: 'asc' } }, themes: true },
      })
    } else {
      track = await prisma.track.update({
        where: { id: params.id },
        data,
        include: { versions: { orderBy: { versionNumber: 'asc' } }, themes: true },
      })
    }
    return ok(shapeTrack(track))
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.track.delete({ where: { id: params.id } })
    return ok({ success: true })
  } catch (e) {
    return serverError(e)
  }
}
