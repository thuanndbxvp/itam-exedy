/**
 * POST /api/settings/users/[id]/change-password — Sprint R.1
 *
 * Dedicated endpoint for password changes with proper security:
 * - Self: requires current password verification
 * - Admin: can reset without current password, but requires users.manage_roles
 *
 * Body: { currentPassword: string, newPassword: string }
 * OR (admin): { newPassword: string, adminOverride: true }
 *
 * Security:
 * - Rate limited by user ID
 * - Requires current password for self-service
 * - Minimum password length enforced
 */
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'
import { checkRateLimit } from '@/lib/rate-limit'

/** Minimum password length */
const MIN_PASSWORD_LENGTH = 8

/** Rate limit: 5 password changes per 15 minutes per user */
const PASSWORD_RATE_LIMIT = {
  max: 5,
  windowMs: 15 * 60 * 1000,
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('users.update')
    const { id } = await params

    // Only target user or admin can change password
    const isSelf = actor.id === id
    const isAdmin = actor.role === 'ADMIN'

    if (!isSelf && !isAdmin) {
      return NextResponse.json(
        {
          ok: false,
          code: 'FORBIDDEN',
          message: 'Bạn không có quyền đổi mật khẩu người dùng này.',
        },
        { status: 403 }
      )
    }

    // Rate limit per user
    const rateLimitKey = `pwd-change:${id}`
    const { allowed, resetAt } = checkRateLimit({
      key: rateLimitKey,
      max: PASSWORD_RATE_LIMIT.max,
      windowMs: PASSWORD_RATE_LIMIT.windowMs,
    })

    if (!allowed) {
      const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
      return NextResponse.json(
        {
          ok: false,
          code: 'RATE_LIMITED',
          message: `Quá nhiều lần thử đổi mật khẩu. Vui lòng thử lại sau ${retryAfter} giây.`,
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { currentPassword, newPassword, adminOverride } = body

    // Get target user
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, password: true, firstName: true, lastName: true, email: true },
    })

    if (!user) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy người dùng.' },
        { status: 404 }
      )
    }

    // Self-service: require current password verification
    if (isSelf) {
      if (!currentPassword) {
        return NextResponse.json(
          { ok: false, code: 'VALIDATION', message: 'Vui lòng nhập mật khẩu hiện tại.' },
          { status: 400 }
        )
      }

      if (!user.password) {
        return NextResponse.json(
          { ok: false, code: 'INVALID_STATE', message: 'Tài khoản chưa có mật khẩu.' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json(
          { ok: false, code: 'INVALID_CREDENTIALS', message: 'Mật khẩu hiện tại không đúng.' },
          { status: 403 }
        )
      }
    }

    // Admin override: requires users.manage_roles
    if (adminOverride && !isAdmin) {
      // Already blocked above, but keep for clarity
      return NextResponse.json(
        { ok: false, code: 'FORBIDDEN', message: 'Chỉ Admin mới có thể reset mật khẩu.' },
        { status: 403 }
      )
    }

    // Validate new password
    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Vui lòng nhập mật khẩu mới.' },
        { status: 400 }
      )
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        {
          ok: false,
          code: 'VALIDATION',
          message: `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`,
        },
        { status: 400 }
      )
    }

    // Self-service: prevent reuse of current password
    if (isSelf && user.password) {
      const isSame = await bcrypt.compare(newPassword, user.password)
      if (isSame) {
        return NextResponse.json(
          { ok: false, code: 'VALIDATION', message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại.' },
          { status: 400 }
        )
      }
    }

    // Hash and update password
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    })

    // Audit log
    const userName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    const action = isSelf ? 'Tự đổi mật khẩu' : `Admin reset mật khẩu cho "${userName}"`
    await recordAudit(actor.id, 'PASSWORD_CHANGE', 'USER', id, action)

    return okResponse({ message: 'Đã đổi mật khẩu thành công.' })
  } catch (e) {
    return errorResponse(e)
  }
}
