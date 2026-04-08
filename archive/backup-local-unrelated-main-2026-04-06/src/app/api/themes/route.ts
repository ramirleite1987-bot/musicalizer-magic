import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, serverError } from '@/lib/api-helpers'
import { shapeTheme } from '@/lib/shapes'

export async function GET() {
  try {
    const themes = await prisma.theme.findMany({ orderBy: { createdAt: 'asc' } })
    return ok(themes.map(shapeTheme))
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name) return badRequest('name is required')
    const theme = await prisma.theme.create({
      data: {
        name: body.name,
        description: body.description ?? '',
        keywords: body.keywords ?? [],
        color: body.color ?? 'violet',
        source: body.source ?? 'manual',
        sourceRef: body.sourceRef ?? '',
      },
    })
    return created(shapeTheme(theme))
  } catch (e) {
    return serverError(e)
  }
}
