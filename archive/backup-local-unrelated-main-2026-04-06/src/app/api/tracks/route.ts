import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, serverError } from '@/lib/api-helpers'
import { shapeTrack } from '@/lib/shapes'

export async function GET() {
  try {
    const tracks = await prisma.track.findMany({
      include: { versions: { orderBy: { versionNumber: 'asc' } }, themes: true },
      orderBy: { createdAt: 'desc' },
    })
    return ok(tracks.map(shapeTrack))
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name || !body.genre) return badRequest('name and genre are required')
    const track = await prisma.track.create({
      data: { name: body.name, genre: body.genre },
      include: { versions: true, themes: true },
    })
    return created(shapeTrack(track))
  } catch (e) {
    return serverError(e)
  }
}
