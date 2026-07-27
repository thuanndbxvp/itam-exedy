/**
 * DELETE /api/maintenances/[id]  — soft-delete 1 phiếu sửa chữa
 *
 * Auth: assets.update.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

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

    await prisma.assetMaintenance.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}