import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, notFound, serverError } from '@/lib/api-helpers'
import { shapeTheme } from '@/lib/shapes'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const theme = await prisma.theme.findUnique({ where: { id: params.id } })
    if (!theme) return notFound()
    return ok(shapeTheme(theme))
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const data: Record<string, unknown> = {}
    const fields = ['name', 'description', 'keywords', 'color', 'source', 'sourceRef'] as const
    for (const f of fields) {
      if (body[f] !== undefined) data[f] = body[f]
    }
    const theme = await prisma.theme.update({ where: { id: params.id }, data })
    return ok(shapeTheme(theme))
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.theme.delete({ where: { id: params.id } })
    return ok({ success: true })
  } catch (e) {
    return serverError(e)
  }
}
