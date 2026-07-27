/**
 * /api/notification-channels/[id]/test — Sprint C9.
 *
 * POST: gửi test ping tới channel.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { testSlackChannel } from '@/lib/notification-channel'
import { errorResponse, okResponse } from '@/lib/api'
import { ForbiddenError } from '@/lib/errors'

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
        { status: 401 }
      )
    }
    if (session.user.role !== 'ADMIN' && session.user.role !== 'IT_MANAGER') {
      throw new ForbiddenError('Chỉ ADMIN/IT_MANAGER mới có quyền.')
    }

    const { id } = await ctx.params
    const result = await testSlackChannel(id)
    if (!result.ok) {
      return Response.json(
        { ok: false, code: 'TEST_FAILED', message: result.error },
        { status: 400 }
      )
    }
    return okResponse({ message: 'Đã gửi test ping thành công.' })
  } catch (e) {
    return errorResponse(e)
  }
}
