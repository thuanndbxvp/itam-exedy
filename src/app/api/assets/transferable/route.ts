/**
 * /api/assets/transferable — Sprint B7
 *
 * GET ?excludeId={assetId} → danh sách các asset KHẢ THI để gán vào asset khác.
 *   - Loại trừ chính nó (excludeId).
 *   - Loại trừ các asset đã được gán cho ai (để chuỗi không phân nhánh lung tung).
 *   - Chỉ trả các asset có status deployable.
 *
 * Auth: assets.checkout (cùng permission với checkout action).
 */
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET(req: NextRequest) {
  try {
    await requirePermissionApi('assets.checkout')
    const excludeId = req.nextUrl.searchParams.get('excludeId') ?? ''

    const assets = await prisma.asset.findMany({
      where: {
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
        // Đã gán cho ai → không cho chọn (giữ parent phẳng, tránh chain)
        assignedUserId: null,
        assignedLocationId: null,
        assignedAssetId: null,
        status: { deployable: true, pending: false, archived: false },
      },
      orderBy: { assetTag: 'asc' },
      take: 200,
      select: {
        id: true,
        assetTag: true,
        name: true,
        model: { select: { id: true, name: true } },
      },
    })

    return okResponse({ assets })
  } catch (e) {
    return errorResponse(e)
  }
}
