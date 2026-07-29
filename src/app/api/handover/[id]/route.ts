/**
 * GET /api/handover/[id] — Chi tiết handover
 * DELETE /api/handover/[id] — Xóa handover
 *
 * Sprint C.12
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { getHandoverDetails } from '@/lib/handover'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('assets.read')
    const { id } = await params

    const details = await getHandoverDetails(id)
    if (!details) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy biên bản.' },
        { status: 404 }
      )
    }

    return okResponse(details)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('assets.delete')
    const { id } = await params

    const existing = await prisma.assetHandover.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy biên bản.' },
        { status: 404 }
      )
    }

    await prisma.assetHandover.delete({ where: { id } })

    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}
