/**
 * /api/reports/licenses-expiring — Sprint B9
 *
 * GET ?withinDays=60 → Top N licenses sắp hết hạn trong khoảng.
 *
 * Output:
 *   { licenseId, name, productKey, expirationDate, daysUntil, totalSeats,
 *     usedSeats, availableSeats }
 *
 * Auth: reports.view.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET(req: NextRequest) {
  try {
    await requirePermissionApi('reports.view')

    const withinDays = parseInt(req.nextUrl.searchParams.get('withinDays') ?? '60', 10)
    const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '10', 10)
    const now = new Date()
    const horizon = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000)

    const licenses = await prisma.license.findMany({
      where: {
        deletedAt: null,
        expirationDate: {
          not: null,
          gte: now,
          lte: horizon,
        },
        terminationDate: null,
      },
      orderBy: { expirationDate: 'asc' },
      take: limit,
      include: {
        _count: { select: { seats: true } },
        seats: {
          where: { deletedAt: null },
          select: { id: true, assignedToUserId: true, assignedToAssetId: true },
        },
      },
    })

    const result = licenses.map((l) => {
      const totalSeats = l._count.seats
      const usedSeats = l.seats.filter(
        (s) => s.assignedToUserId || s.assignedToAssetId
      ).length
      const daysUntil = l.expirationDate
        ? Math.ceil(
            (new Date(l.expirationDate).getTime() - now.getTime()) /
              (24 * 60 * 60 * 1000)
          )
        : null
      return {
        licenseId: l.id,
        name: l.name,
        productKey: l.productKey,
        expirationDate: l.expirationDate,
        daysUntil,
        totalSeats,
        usedSeats,
        availableSeats: totalSeats - usedSeats,
      }
    })

    return okResponse(result)
  } catch (e) {
    return errorResponse(e)
  }
}
