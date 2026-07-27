/**
 * POST /api/auth/login
 *
 * Sprint B17: 2-step login entry.
 *
 * Body: { email: string, password: string }
 *
 * Luồng:
 *  1. Validate credentials (bcrypt)
 *  2. Nếu user tồn tại & pass đúng & `twoFactorEnrolled=true`:
 *     - Set HTTP-only cookie `2fa_pending` = HMAC(userId + expiry)
 *     - Trả { ok: true, require2FA: true, userId }
 *     - KHÔNG tạo NextAuth session
 *  3. Nếu không có 2FA → credentials hợp lệ nhưng KHÔNG tự login NextAuth ở đây
 *     (client phải gọi NextAuth signIn() riêng để tránh duplicate session)
 *  4. Trả { ok: true, require2FA: false } nếu OK, hoặc 401 nếu sai.
 *
 * Client flow:
 *  - Nếu !require2FA → gọi `signIn('credentials', { email, password, redirect: false })`.
 *  - Nếu require2FA → show OTP step, submit OTP → /api/auth/login/2fa verify +
 *    `signIn('credentials', { email, password, redirect: false })` để tạo session.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import {
  encodePendingCookie,
  PENDING_COOKIE_NAME,
  PENDING_COOKIE_TTL_S,
} from '@/lib/auth-2fa-cookie'

const Body = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
  password: z.string().min(1).max(200),
})

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null)
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'Email hoặc mật khẩu không hợp lệ.' },
      { status: 400 }
    )
  }
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true, activated: true, twoFactorEnrolled: true, deletedAt: true },
  })

  if (!user || user.deletedAt || !user.activated) {
    return NextResponse.json(
      { ok: false, code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng.' },
      { status: 401 }
    )
  }

  if (!user.password) {
    return NextResponse.json(
      { ok: false, code: 'NO_PASSWORD', message: 'Tài khoản chưa thiết lập mật khẩu.' },
      { status: 401 }
    )
  }

  const passOk = await bcrypt.compare(password, user.password)
  if (!passOk) {
    return NextResponse.json(
      { ok: false, code: 'INVALID_CREDENTIALS', message: 'Email hoặc mật khẩu không đúng.' },
      { status: 401 }
    )
  }

  // Credentials OK. Nếu 2FA enabled → set pending cookie.
  if (user.twoFactorEnrolled) {
    const cookieStore = await cookies()
    cookieStore.set({
      name: PENDING_COOKIE_NAME,
      value: encodePendingCookie(user.id),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: PENDING_COOKIE_TTL_S,
      path: '/',
    })
    return NextResponse.json({
      ok: true,
      require2FA: true,
      userId: user.id,
    })
  }

  // Không 2FA — credentials OK. Client tự gọi NextAuth signIn.
  return NextResponse.json({ ok: true, require2FA: false })
}
