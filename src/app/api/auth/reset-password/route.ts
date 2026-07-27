/**
 * POST /api/auth/reset-password
 *
 * Sprint B16: nhận token + newPassword, verify token, hash & save password, invalidate token.
 *
 * Body: { token: string, newPassword: string }
 *  - token: raw token từ URL
 *  - newPassword: ≥ 8 chars (bcrypt cost 10)
 *
 * Response: { ok: true } nếu OK, error nếu token invalid/expired/used.
 */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { hashToken, safeEqualHex, isTokenValid } from '@/lib/auth-tokens'
import { headers } from 'next/headers'

const Body = z.object({
  token: z.string().min(20).max(128),
  newPassword: z.string().min(8).max(200),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null)
    const parsed = Body.safeParse(json)
    if (!parsed.success) {
      return Response.json(
        { ok: false, code: 'VALIDATION', message: 'Token hoặc mật khẩu không hợp lệ.' },
        { status: 400 }
      )
    }
    const { token, newPassword } = parsed.data

    const tokenHash = hashToken(token)

    // Tìm token theo hash (constant-time compare để chống timing attack).
    const candidates = await prisma.passwordResetToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: 200, // bound scan — TTL 1h nên số active tokens giới hạn
      select: { id: true, userId: true, tokenHash: true, expiresAt: true, usedAt: true },
    })

    let matched: typeof candidates[number] | null = null
    for (const c of candidates) {
      if (safeEqualHex(c.tokenHash, tokenHash)) {
        matched = c
        break
      }
    }

    if (!matched || !isTokenValid(matched)) {
      return Response.json(
        { ok: false, code: 'INVALID_TOKEN', message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.' },
        { status: 400 }
      )
    }

    // Hash password (bcrypt cost 10)
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Update password + mark token used (atomic transaction)
    const userId = matched.userId
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          password: passwordHash,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: matched.id },
        data: { usedAt: new Date() },
      }),
    ])

    // Audit log: PASSWORD_RESET (dùng ActionLog UPDATE action)
    try {
      const hdrs = await headers()
      const ipAddress =
        hdrs.get('x-forwarded-for')?.split(',')[0].trim() ??
        hdrs.get('x-real-ip') ??
        null
      const userAgent = hdrs.get('user-agent') ?? null
      await prisma.actionLog.create({
        data: {
          actionType: 'PASSWORD_RESET',
          itemType: 'USER',
          itemId: userId,
          userId,
          ipAddress,
          userAgent,
          notes: 'Đặt lại mật khẩu qua email',
        },
      })
    } catch {
      // ignore audit failure
    }

    return Response.json({
      ok: true,
      message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.',
    })
  } catch (e) {
    console.error('[reset-password] error:', e)
    return Response.json(
      { ok: false, code: 'INTERNAL', message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
