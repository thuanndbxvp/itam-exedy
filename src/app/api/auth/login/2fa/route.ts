/**
 * POST /api/auth/login/2fa
 *
 * Sprint B17: bước 2 của login — verify OTP từ cookie pending.
 *
 * Body: { code: string (6 digits) }
 *
 * Yêu cầu:
 *  - Cookie `2fa_pending` hợp lệ (HMAC, chưa expire)
 *  - OTP verify thành công
 *  - Rate limit: 10 attempts / 5 minutes per IP
 *
 * Sau khi verify OK → KHÔNG tự tạo session NextAuth. Client nhận `verified: true`
 * + cờ `challengeCompleted: true`, sau đó client gọi NextAuth `signIn('credentials', ...)`
 * với 1 secret header `X-2FA-Completed: true` để authorize() skip 2FA check.
 *
 * Security: Sprint R.1 - Rate limiting added for OTP brute-force protection.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { decodePendingCookie, PENDING_COOKIE_NAME } from '@/lib/auth-2fa-cookie'
import { verify2FACode } from '@/lib/auth-2fa'

const Body = z.object({
  code: z.string().regex(/^\d{6}$/),
})

const PASSED_COOKIE = '2fa_passed'

/** R.1: Rate limit config - 10 OTP attempts per 5 minutes per IP */
const OTP_RATE_LIMIT = {
  max: 10,
  windowMs: 5 * 60 * 1000, // 5 minutes
}

export async function POST(req: NextRequest) {
  // R.1: Rate limit check first
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  const rateLimitKey = `2fa-otp:${ip}`
  const { allowed, resetAt } = checkRateLimit({
    key: rateLimitKey,
    max: OTP_RATE_LIMIT.max,
    windowMs: OTP_RATE_LIMIT.windowMs,
  })

  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
    return NextResponse.json(
      {
        ok: false,
        code: 'RATE_LIMITED',
        message: `Quá nhiều lần thử OTP. Vui lòng thử lại sau ${retryAfter} giây.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
        },
      }
    )
  }

  const json = await req.json().catch(() => null)
  const parsed = Body.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'Mã phải là 6 chữ số.' },
      { status: 400 }
    )
  }
  const { code } = parsed.data

  const cookieStore = await cookies()
  const raw = cookieStore.get(PENDING_COOKIE_NAME)?.value
  const pending = decodePendingCookie(raw)

  if (!pending) {
    return NextResponse.json(
      {
        ok: false,
        code: 'NO_PENDING',
        message: 'Phiên 2FA đã hết hạn. Vui lòng đăng nhập lại.',
      },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: pending.userId },
    select: { id: true, twoFactorSecret: true, twoFactorEnrolled: true },
  })

  if (!user || !user.twoFactorEnrolled || !user.twoFactorSecret) {
    // Clear pending cookie
    cookieStore.delete(PENDING_COOKIE_NAME)
    return NextResponse.json(
      { ok: false, code: 'INVALID_STATE', message: 'Trạng thái 2FA không hợp lệ.' },
      { status: 400 }
    )
  }

  const ok = verify2FACode(user.twoFactorSecret, code)
  if (!ok) {
    return NextResponse.json(
      { ok: false, code: 'INVALID_CODE', message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' },
      { status: 400 }
    )
  }

  // OTP OK → clear pending cookie + set passed cookie (TTL 60s)
  cookieStore.delete(PENDING_COOKIE_NAME)
  cookieStore.set({
    name: PASSED_COOKIE,
    value: '1',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60,
    path: '/',
  })

  return NextResponse.json({
    ok: true,
    challengeCompleted: true,
    message: 'Xác thực 2 bước thành công. Đang đăng nhập...',
  })
}
