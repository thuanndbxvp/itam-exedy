/**
 * /api/licenses/checkin-seat — Sprint A.5
 *
 * POST { seatId } → thu hồi LicenseSeat (clear assignedUserId/AssetId).
 *
 * Thin wrapper around server action checkinLicenseSeatCmd.
 *
 * Auth: licenses.assign.
 */
import { NextRequest, NextResponse } from 'next/server'
import { checkinLicenseSeatCmd } from '@/app/actions/license'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const seatId = body.seatId as string | undefined
    if (!seatId) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'seatId required.' }, { status: 400 })
    }
    const result = await checkinLicenseSeatCmd({ seatId, notes: body.notes })
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (e) {
    console.error('[checkin-seat] error:', e)
    return NextResponse.json({ ok: false, code: 'INTERNAL', message: 'Có lỗi xảy ra.' }, { status: 500 })
  }
}
