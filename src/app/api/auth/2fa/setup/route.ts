/**
 * POST /api/auth/2fa/setup
 *
 * Sprint B17: bước 1 của 2FA enrollment — generate secret, trả QR cho user scan.
 *
 * Secret KHÔNG được lưu vào `User.twoFactorSecret` ngay — chỉ lưu sau khi user
 * verify OTP thành công ở bước /api/auth/2fa/verify.
 *
 * Nếu user đã enrolled → 409 (phải disable trước).
 *
 * Auth: bắt buộc (session).
 */
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generate2FASecret } from '@/lib/auth-2fa'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json(
      { ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' },
      { status: 401 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, twoFactorEnrolled: true, twoFactorSecret: true },
  })

  if (!user) {
    return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'User không tồn tại.' }, { status: 404 })
  }

  if (user.twoFactorEnrolled) {
    return NextResponse.json(
      { ok: false, code: 'ALREADY_ENROLLED', message: 'Đã bật 2FA. Disable trước khi setup lại.' },
      { status: 409 }
    )
  }

  // Generate secret + QR code
  const data = await generate2FASecret(user.email ?? user.id)

  // Lưu secret tạm (chưa enroll) — verify OTP sẽ set enrolled=true
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: data.secret }, // plain tạm thời
  })

  return NextResponse.json({
    ok: true,
    data: {
      secret: data.secret,
      otpauthUri: data.otpauthUri,
      qrCodeDataUri: data.qrCodeDataUri,
    },
  })
}
