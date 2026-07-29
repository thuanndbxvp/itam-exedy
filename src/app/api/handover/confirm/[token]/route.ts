/**
 * GET /api/handover/confirm/[token] — Verify E-sign token
 * POST /api/handover/confirm/[token] — Confirm E-sign
 *
 * Sprint C.12
 * Public endpoint — không cần auth vì dùng token
 */
import { NextRequest, NextResponse } from 'next/server'
import { errorResponse, okResponse } from '@/lib/api'
import { verifyConfirmToken, confirmHandover } from '@/lib/handover'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params

    const result = await verifyConfirmToken(token)

    if (!result.valid) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_TOKEN', message: result.error },
        { status: 400 }
      )
    }

    return okResponse({ handover: result.handover })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const body = await req.json().catch(() => ({}))

    // Get client IP
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    const result = await confirmHandover(token, {
      confirmedByIp: ipAddress,
      confirmedUserId: body.userId,
    })

    if (!result.success) {
      return NextResponse.json(
        { ok: false, code: 'CONFIRM_FAILED', message: result.error },
        { status: 400 }
      )
    }

    return okResponse({ message: 'Xác nhận thành công!' })
  } catch (e) {
    return errorResponse(e)
  }
}
