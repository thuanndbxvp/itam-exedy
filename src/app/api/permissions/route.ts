/**
 * GET /api/permissions — trả về permission catalog (cho UI matrix).
 */
import { NextResponse } from 'next/server'
import { requirePermission } from '@/lib/permissions'
import { PERMISSIONS } from '@/lib/permissions/catalog'

export async function GET() {
  try {
    await requirePermission('users.manage_roles')
  } catch (e) {
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: (e as Error).message }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
  return NextResponse.json({ ok: true, data: PERMISSIONS })
}