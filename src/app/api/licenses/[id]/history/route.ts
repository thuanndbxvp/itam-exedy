/**
 * GET /api/licenses/[id]/history
 *
 * Trả về timeline lịch sử cấp phát license seat (CHECKOUT / CHECKIN / UPDATE).
 *
 * Auth: licenses.read.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('licenses.read')

    const { id } = await params

    const license = await prisma.license.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, name: true },
    })
    if (!license) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'License không tồn tại.' }, { status: 404 })
    }

    // Lay danh sach tat ca seat (ke ca da xoa mem) de match log, vi log ton tai sau khi seat bi check-in
    const seats = await prisma.licenseSeat.findMany({
      where: { licenseId: id },
      select: { id: true },
    })
    const seatIds = seats.map((s) => s.id)
    // Match:
    //   - LICENSE logs (itemType=LICENSE, itemId=licenseId) → create/update notes
    //   - LICENSE_SEAT logs (itemType=LICENSE_SEAT, itemId in seatsOfThisLicense) → checkout/checkin
    //   - LICENSE_SEAT logs (itemType=LICENSE_SEAT, targetId=licenseId) → legacy semantic where target was license
    const logs = await prisma.actionLog.findMany({
      where: {
        OR: [
          { itemType: 'LICENSE', itemId: id },
          ...(seatIds.length > 0
            ? [{ itemType: 'LICENSE_SEAT' as const, itemId: { in: seatIds } }]
            : []),
          { itemType: 'LICENSE_SEAT', targetId: id },
        ],
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const events = logs.map((l) => ({
      id: l.id,
      actionType: l.actionType,
      itemType: l.itemType,
      notes: l.notes,
      oldValues: l.oldValues,
      newValues: l.newValues,
      createdAt: l.createdAt.toISOString(),
      actor: {
        id: l.user.id,
        firstName: l.user.firstName,
        lastName: l.user.lastName,
        email: l.user.email,
      },
    }))

    return okResponse({ license, events })
  } catch (e) {
    return errorResponse(e)
  }
}