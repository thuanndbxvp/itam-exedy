/**
 * POST /api/auth/forgot-password
 *
 * Sprint B16: nhận email, tạo reset token, gửi link qua email.
 *
 * Security: luôn trả 200 OK với message generic để KHÔNG leak email
 * có tồn tại hay không (timing attack prevention).
 *
 * Rate limit: 3 requests / email / 15 phút.
 */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/notifications/email'
import { generateRawToken, hashToken, tokenExpiry } from '@/lib/auth-tokens'
import { checkRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

const Body = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null)
    const parsed = Body.safeParse(json)
    if (!parsed.success) {
      return Response.json(
        { ok: false, code: 'VALIDATION', message: 'Email không hợp lệ.' },
        { status: 400 }
      )
    }
    const { email } = parsed.data

    // Rate limit theo email (3 req / 15 min)
    const rl = checkRateLimit({
      key: `forgot:${email}`,
      max: 3,
      windowMs: 15 * 60 * 1000,
    })
    if (!rl.allowed) {
      // Vẫn trả 200 generic để không leak
      return Response.json({
        ok: true,
        message:
          'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi trong ít phút.',
      })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, lastName: true, email: true, activated: true },
    })

    // Generic response — không phân biệt user tồn tại hay không
    const genericMessage =
      'Nếu email tồn tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi trong ít phút.'

    if (!user || !user.activated) {
      return Response.json({ ok: true, message: genericMessage })
    }

    // Generate raw token + hash, lưu hash vào DB
    const rawToken = generateRawToken()
    const tokenHash = hashToken(rawToken)
    const expiresAt = tokenExpiry()

    // Capture IP + UA cho audit
    const hdrs = await headers()
    const ipAddress =
      hdrs.get('x-forwarded-for')?.split(',')[0].trim() ??
      hdrs.get('x-real-ip') ??
      null
    const userAgent = hdrs.get('user-agent') ?? null

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    })

    // Build reset link (use origin from request, no settings.appUrl yet)
    const baseUrl = req.nextUrl.origin
    const resetUrl = `${baseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`

    const fullName = `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim()
    const html = `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937;">Đặt lại mật khẩu</h2>
        <p>Chào <strong>${fullName}</strong>,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Bấm vào nút dưới đây để đặt mật khẩu mới:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Đặt lại mật khẩu
          </a>
        </p>
        <p>Hoặc copy link sau vào trình duyệt:</p>
        <p style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px;">
          ${resetUrl}
        </p>
        <p style="color: #6b7280; font-size: 13px;">
          ⏰ Link có hiệu lực trong <strong>1 giờ</strong>. Sau thời gian này, bạn cần yêu cầu lại.
        </p>
        <p style="color: #6b7280; font-size: 13px;">
          Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          IT Asset Management — Internal system email
        </p>
      </div>
    `

    // Fire-and-log email (best-effort — vẫn return 200 cho client)
    const emailResult = await sendEmail({
      to: user.email!,
      subject: '[IT Asset] Đặt lại mật khẩu',
      html,
    })

    if (!emailResult.ok) {
      console.warn(`[forgot-password] Email send failed: ${emailResult.error}`)
    }

    return Response.json({ ok: true, message: genericMessage })
  } catch (e) {
    console.error('[forgot-password] error:', e)
    return Response.json(
      { ok: false, code: 'INTERNAL', message: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' },
      { status: 500 }
    )
  }
}
