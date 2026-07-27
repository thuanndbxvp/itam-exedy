/**
 * /api/licenses/checkout-seat — Sprint A.5
 *
 * POST { seatId, targetUserId? | targetAssetId? } → checkin/out 1 LicenseSeat.
 *
 * Thin wrapper around server action `checkoutLicenseSeatCmd` (which uses
 * withRowLock + checkoutLicenseSeat command in lib/commands/license.ts).
 *
 * Auth: licenses.assign.
 */
import { NextRequest, NextResponse } from 'next/server'
import { checkoutLicenseSeatCmd } from '@/app/actions/license'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const seatId = body.seatId as string | undefined
    if (!seatId) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'seatId required.' }, { status: 400 })
    }
    if (!body.targetUserId && !body.targetAssetId) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Phải chọn User hoặc Asset.' },
        { status: 400 },
      )
    }

    const result = await checkoutLicenseSeatCmd({
      seatId,
      targetUserId: body.targetUserId || undefined,
      targetAssetId: body.targetAssetId || undefined,
      notes: body.notes,
    })
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (e) {
    console.error('[checkout-seat] error:', e)
    return NextResponse.json({ ok: false, code: 'INTERNAL', message: 'Có lỗi xảy ra.' }, { status: 500 })
  }
}
