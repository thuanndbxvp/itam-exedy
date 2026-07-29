/**
 * DELETE /api/maintenances/[id]  — soft-delete 1 phiếu sửa chữa
 *
 * Auth: assets.update.
 *
 * Sprint C.11: Sync lại asset status & stats sau khi xóa.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { onMaintenanceDeleted, updateMaintenanceStats } from '@/lib/asset-status-sync'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('assets.update')

    const { id } = await params

    const existing = await prisma.assetMaintenance.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Phiếu sửa chữa không tồn tại.' },
        { status: 404 },
      )
    }

    const assetId = existing.assetId

    await prisma.assetMaintenance.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    // Sprint C.11: Sync asset status & stats
    await updateMaintenanceStats(assetId)
    await onMaintenanceDeleted(assetId, undefined, existing.title)

    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}