/**
 * GET /api/eula/status?categoryId=... — Sprint C3.
 *
 * Trả về { requireAcceptance, alreadyAccepted, categoryName, eulaText }.
 * Nếu user chưa đăng nhập → 401.
 *
 * Dùng để CheckoutAssetModal check trước khi cho user checkout asset.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { eulaVersion } from '@/lib/eula'
import { errorResponse, okResponse } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }

    const categoryId = req.nextUrl.searchParams.get('categoryId')
    if (!categoryId) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Thiếu categoryId.' },
        { status: 400 }
      )
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        eulaText: true,
        requireAcceptance: true,
      },
    })
    if (!category) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Category không tồn tại.' },
        { status: 404 }
      )
    }

    if (!category.requireAcceptance || !category.eulaText) {
      return okResponse({
        requireAcceptance: false,
        alreadyAccepted: true, // Not required → treat as accepted
        categoryName: category.name,
        eulaText: category.eulaText ?? '',
      })
    }

    // Check user acceptance
    const currentVersion = eulaVersion(category.eulaText)
    const existing = await prisma.eulaAcceptance.findUnique({
      where: {
        userId_categoryId: {
          userId: session.user.id,
          categoryId: category.id,
        },
      },
    })

    return okResponse({
      requireAcceptance: true,
      alreadyAccepted: existing?.version === currentVersion,
      categoryName: category.name,
      eulaText: category.eulaText,
    })
  } catch (e) {
    return errorResponse(e)
  }
}
