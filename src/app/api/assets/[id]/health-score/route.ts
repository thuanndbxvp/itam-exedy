/**
 * GET /api/assets/[id]/health-score — Lấy chi tiết Health Score của 1 asset
 *
 * Auth: assets.read.
 *
 * Sprint C.11
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { getAssetForHealthScore, calculateHealthScore } from '@/lib/health-score'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('assets.read')

    const { id } = await params

    // Verify asset exists
    const asset = await prisma.asset.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, assetTag: true, name: true },
    })
    if (!asset) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Asset không tồn tại.' },
        { status: 404 }
      )
    }

    // Get raw data for calculation
    const rawAsset = await getAssetForHealthScore(id)
    if (!rawAsset) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Asset không tồn tại.' },
        { status: 404 }
      )
    }

    // Calculate health score (realtime)
    const healthScore = calculateHealthScore({
      purchaseDate: rawAsset.purchaseDate,
      purchaseCost: rawAsset.purchaseCost,
      expectedLifeMonths: rawAsset.model?.depreciation?.months ?? null,
      repairCount: rawAsset.repairCount,
      totalRepairCost: rawAsset.totalRepairCost,
      assetModel: rawAsset.model,
    })

    return okResponse({
      assetId: id,
      assetTag: asset.assetTag,
      name: asset.name,
      ...healthScore,
      // Additional info
      repairCount: rawAsset.repairCount,
      totalRepairCost: rawAsset.totalRepairCost ? Number(rawAsset.totalRepairCost) : null,
      purchaseCost: rawAsset.purchaseCost ? Number(rawAsset.purchaseCost) : null,
      purchaseDate: rawAsset.purchaseDate?.toISOString() ?? null,
    })
  } catch (e) {
    return errorResponse(e)
  }
}
