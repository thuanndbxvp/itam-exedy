/**
 * POST /api/auth/2fa/disable
 *
 * Sprint B17: tắt 2FA — verify password trước khi disable (an toàn).
 *
 * Body: { password: string }
 * Xóa secret + set twoFactorEnrolled=false, twoFactorOptin=false, audit log.
 *
 * Auth: bắt buộc.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const Body = z.object({
  password: z.string().min(1).max(200),
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
      { ok: false, code: 'VALIDATION', message: 'Mật khẩu là bắt buộc.' },
      { status: 400 }
    )
  }
  const { password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true, twoFactorEnrolled: true },
  })

  if (!user) {
    return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'User không tồn tại.' }, { status: 404 })
  }

  if (!user.twoFactorEnrolled) {
    return NextResponse.json(
      { ok: false, code: 'NOT_ENROLLED', message: '2FA chưa bật.' },
      { status: 400 }
    )
  }

  // Verify password (bảo vệ khỏi account-takeover tắt 2FA)
  if (!user.password) {
    return NextResponse.json(
      { ok: false, code: 'NO_PASSWORD', message: 'Tài khoản không có mật khẩu (SSO?).' },
      { status: 400 }
    )
  }
  const ok = await bcrypt.compare(password, user.password)
  if (!ok) {
    return NextResponse.json(
      { ok: false, code: 'WRONG_PASSWORD', message: 'Mật khẩu không đúng.' },
      { status: 401 }
    )
  }

  // Disable 2FA
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnrolled: false,
        twoFactorOptin: false,
        twoFactorSecret: null,
      },
    }),
    prisma.actionLog.create({
      data: {
        actionType: 'TWO_FACTOR_DISABLED',
        itemType: 'USER',
        itemId: user.id,
        userId: user.id,
        notes: 'Tắt xác thực 2 bước (TOTP)',
      },
    }),
  ])

  return NextResponse.json({ ok: true, message: 'Đã tắt xác thực 2 bước.' })
}
