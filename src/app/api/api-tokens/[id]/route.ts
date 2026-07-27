/**
 * /api/api-tokens/[id] — Sprint C7.
 *
 * DELETE : Revoke (soft-delete bằng revokedAt).
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { ForbiddenError, NotFoundError } from '@/lib/errors'

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'IT_MANAGER') {
      throw new ForbiddenError('Chỉ ADMIN/IT_MANAGER mới có quyền thu hồi API tokens.')
    }

    const { id } = await ctx.params
    const existing = await prisma.apiToken.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('ApiToken', id)

    if (existing.revokedAt) {
      return okResponse({ revoked: id, alreadyRevoked: true })
    }

    await prisma.apiToken.update({
      where: { id },
      data: { revokedAt: new Date(), revokedById: session.user.id },
    })

    return okResponse({ revoked: id })
  } catch (e) {
    return errorResponse(e)
  }
}
