/**
 * /api/saved-filters/[id] — Sprint C5.
 *
 * PATCH  : Update name/filters/isPublic. Owner only.
 * DELETE : Delete filter. Owner only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'

const Patch = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  isPublic: z.boolean().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }
    const { id } = await ctx.params
    const json = await req.json().catch(() => null)
    const parsed = Patch.safeParse(json)
    if (!parsed.success) throw new ValidationError('Dữ liệu không hợp lệ.')

    const existing = await prisma.savedFilter.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('SavedFilter', id)
    if (existing.userId !== session.user.id) {
      throw new ForbiddenError('Chỉ chủ sở hữu mới có quyền sửa.')
    }

    const updated = await prisma.savedFilter.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.filters !== undefined && { filters: parsed.data.filters as object }),
        ...(parsed.data.isPublic !== undefined && { isPublic: parsed.data.isPublic }),
      },
    })

    return okResponse({ filter: updated })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }
    const { id } = await ctx.params

    const existing = await prisma.savedFilter.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('SavedFilter', id)
    if (existing.userId !== session.user.id) {
      throw new ForbiddenError('Chỉ chủ sở hữu mới có quyền xóa.')
    }

    await prisma.savedFilter.delete({ where: { id } })

    return okResponse({ deleted: id })
  } catch (e) {
    return errorResponse(e)
  }
}
