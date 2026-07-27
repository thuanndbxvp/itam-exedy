/**
 * /api/licenses/with-availability — Sprint A.5
 *
 * GET → tra ve danh sach license kem so luong seat con trong/tong.
 *      Used by AssignLicenseModal để hiện list + badge.
 *
 * Auth: licenses.read.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET(req: NextRequest) {
  try {
    await requirePermissionApi('licenses.read')
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '200', 10) || 200, 500)

    const licenses = await prisma.license.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        productKey: true,
        expirationDate: true,
        seats: {
          where: { deletedAt: null },
          select: { id: true, assignedUserId: true, assignedAssetId: true, unreassignableSeat: true },
        },
      },
    })

    const result = licenses.map((l) => {
      const total = l.seats.length
      const available = l.seats.filter(
        (s) =>
          !s.assignedUserId &&
          !s.assignedAssetId &&
          !s.unreassignableSeat,
      ).length
      return {
        id: l.id,
        name: l.name,
        productKey: l.productKey,
        expirationDate: l.expirationDate?.toISOString() ?? null,
        totalSeats: total,
        availableSeats: available,
      }
    })

    return okResponse({ licenses: result })
  } catch (e) {
    return errorResponse(e)
  }
}
