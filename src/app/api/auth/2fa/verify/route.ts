/**
 * POST /api/auth/2fa/verify
 *
 * Sprint B17: bước 2 — verify OTP code, enable 2FA.
 *
 * Body: { code: string (6 digits) }
 * Sau khi verify OK → set `twoFactorEnrolled=true`, `twoFactorOptin=true`,
 * audit log TWO_FACTOR_ENABLED.
 *
 * Auth: bắt buộc.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verify2FACode } from '@/lib/auth-2fa'

const Body = z.object({
  code: z.string().regex(/^\d{6}$/),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
      { status: 401 }
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, twoFactorSecret: true, twoFactorEnrolled: true },
  })

  if (!user?.twoFactorSecret) {
    return NextResponse.json(
      { ok: false, code: 'NO_SECRET', message: 'Chưa setup 2FA. Gọi /api/auth/2fa/setup trước.' },
      { status: 400 }
    )
  }

  if (user.twoFactorEnrolled) {
    return NextResponse.json(
      { ok: false, code: 'ALREADY_ENROLLED', message: 'Đã bật 2FA rồi.' },
      { status: 409 }
    )
  }

  const ok = verify2FACode(user.twoFactorSecret, code)
  if (!ok) {
    return NextResponse.json(
      { ok: false, code: 'INVALID_CODE', message: 'Mã OTP không hợp lệ hoặc đã hết hạn.' },
      { status: 400 }
    )
  }

  // Enable 2FA
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnrolled: true,
        twoFactorOptin: true,
      },
    }),
    prisma.actionLog.create({
      data: {
        actionType: 'TWO_FACTOR_ENABLED',
        itemType: 'USER',
        itemId: user.id,
        userId: user.id,
        notes: 'Bật xác thực 2 bước (TOTP)',
      },
    }),
  ])

  return NextResponse.json({ ok: true, message: 'Đã bật xác thực 2 bước thành công.' })
}
