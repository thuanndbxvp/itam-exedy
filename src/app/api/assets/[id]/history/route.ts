/**
 * GET /api/assets/[id]/history
 *
 * Trả về timeline lịch sử thao tác trên asset:
 *   - CHECKOUT / CHECKIN (cấp phát / thu hồi)
 *   - UPDATE (sửa thông tin)
 *   - CREATE (tạo mới)
 *   - NOTE_ADDED (ghi chú)
 *   - AUDIT (kiểm kê)
 *
 * Auth: assets.read (xem lịch sử).
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('assets.read')

    const { id } = await params

    // Asset phải tồn tại + chưa bị xóa
    const asset = await prisma.asset.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, assetTag: true, name: true },
    })
    if (!asset) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Asset không tồn tại.' }, { status: 404 })
    }

    const logs = await prisma.actionLog.findMany({
      where: {
        itemType: 'ASSET',
        itemId: id,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Serialize để Server → Client component không bị lỗi Date
    const events = logs.map((l) => ({
      id: l.id,
      actionType: l.actionType,
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

    return okResponse({ asset, events })
  } catch (e) {
    return errorResponse(e)
  }
}