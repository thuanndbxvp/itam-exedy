/**
 * GET /api/assets/[id]/eula-gate — Sprint C3.
 *
 * Trả về { requireAcceptance, alreadyAccepted, categoryId, categoryName, eulaText }
 * cho asset này. Nếu !requireAcceptance → alreadyAccepted=true (no gate).
 *
 * Auth: Session required + assets.read permission.
 * Security: Sprint R.1 - Added permission check.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { eulaVersion } from '@/lib/eula'
import { errorResponse, okResponse } from '@/lib/api'
import { NotFoundError, ForbiddenError } from '@/lib/errors'
import { resolvePermissions } from '@/lib/permissions'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }

    // R.1: Verify user has assets.read permission
    const perms = await resolvePermissions(session.user as any)
    if (!perms.has('assets.read')) {
      throw new ForbiddenError('Bạn không có quyền xem tài sản.')
    }

    const { id } = await ctx.params

    const asset = await prisma.asset.findUnique({
      where: { id },
      select: {
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            eulaText: true,
            requireAcceptance: true,
          },
        },
      },
    })
    if (!asset) throw new NotFoundError('Asset', id)

    // No category → no gate
    if (!asset.category) {
      return okResponse({
        requireAcceptance: false,
        alreadyAccepted: true,
        categoryId: null,
        categoryName: null,
        eulaText: null,
      })
    }

    if (!asset.category.requireAcceptance || !asset.category.eulaText) {
      return okResponse({
        requireAcceptance: false,
        alreadyAccepted: true,
        categoryId: asset.category.id,
        categoryName: asset.category.name,
        eulaText: asset.category.eulaText ?? null,
      })
    }

    // Check user acceptance
    const currentVersion = eulaVersion(asset.category.eulaText)
    const existing = await prisma.eulaAcceptance.findUnique({
      where: {
        userId_categoryId: {
          userId: session.user.id,
          categoryId: asset.category.id,
        },
      },
    })

    return okResponse({
      requireAcceptance: true,
      alreadyAccepted: existing?.version === currentVersion,
      categoryId: asset.category.id,
      categoryName: asset.category.name,
      eulaText: asset.category.eulaText,
    })
  } catch (e) {
    return errorResponse(e)
  }
}
