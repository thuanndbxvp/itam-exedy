/**
 * /api/licenses/[id]/seats — Sprint A.5
 *
 * GET ?available=true → danh sach seat TRONG (chua gan user/asset) của License này.
 *                     Used by AssignLicenseModal to pick a free seat.
 * GET (mac dinh)     → tat ca seat (bao gom da gan + deleted).
 *
 * Auth: licenses.read.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('licenses.read')
    const { id } = await params
    const availableOnly = req.nextUrl.searchParams.get('available') === 'true'

    const license = await prisma.license.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, name: true },
    })
    if (!license) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'License không tồn tại.' }, { status: 404 })
    }

    const seats = await prisma.licenseSeat.findMany({
      where: {
        licenseId: id,
        deletedAt: null,
        ...(availableOnly
          ? { assignedUserId: null, assignedAssetId: null, unreassignableSeat: false }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        notes: true,
        unreassignableSeat: true,
        assignedUserId: true,
        assignedAssetId: true,
        createdAt: true,
      },
    })

    return okResponse({ license, seats, availableCount: seats.length })
  } catch (e) {
    return errorResponse(e)
  }
}
