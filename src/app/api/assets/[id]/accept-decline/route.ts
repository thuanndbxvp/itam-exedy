/**
 * POST /api/assets/[id]/accept-decline — Sprint C4.
 *
 * Body: { action: 'accept' | 'decline', notes?: string }
 *
 * Permission: chỉ `assignedUserId` của asset mới accept/decline được.
 *  - IT side không thể accept thay user (audit trail riêng).
 *
 * Ghi ActionLog ACCEPTED hoặc DECLINED.
 * Optional: tạo notification cho IT assignee/team.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getActorUserId } from '@/lib/audit'
import { errorResponse, okResponse } from '@/lib/api'
import { ForbiddenError, NotFoundError, InvalidStateError } from '@/lib/errors'

const Body = z.object({
  action: z.enum(['accept', 'decline']),
  notes: z.string().max(500).optional(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }

    const { id } = await ctx.params

    const json = await req.json().catch(() => null)
    const parsed = Body.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Action không hợp lệ.' },
        { status: 400 }
      )
    }
    const { action, notes } = parsed.data

    const asset = await prisma.asset.findUnique({
      where: { id },
      select: {
        id: true,
        assetTag: true,
        name: true,
        assignedUserId: true,
        deletedAt: true,
      },
    })
    if (!asset || asset.deletedAt) throw new NotFoundError('Asset', id)

    // Permission: chỉ assignedUser
    if (asset.assignedUserId !== session.user.id) {
      throw new ForbiddenError('Chỉ người được cấp phát asset mới có quyền accept/decline.')
    }

    if (!asset.assignedUserId) {
      throw new InvalidStateError('Asset chưa được cấp phát cho user.')
    }

    const actorId = await getActorUserId(session.user.id)

    // Ghi ActionLog
    await prisma.actionLog.create({
      data: {
        actionType: action === 'accept' ? 'ACCEPTED' : 'DECLINED',
        itemType: 'ASSET',
        itemId: asset.id,
        userId: actorId,
        targetType: 'USER',
        targetId: actorId,
        notes:
          notes ??
          (action === 'accept'
            ? `User xác nhận đã nhận asset "${asset.assetTag}"`
            : `User từ chối nhận asset "${asset.assetTag}"`),
      },
    })

    return okResponse({
      message:
        action === 'accept'
          ? `Đã xác nhận nhận asset "${asset.assetTag}".`
          : `Đã ghi nhận từ chối asset "${asset.assetTag}".`,
    })
  } catch (e) {
    return errorResponse(e)
  }
}
