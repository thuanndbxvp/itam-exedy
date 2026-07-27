/**
 * GET /api/me/permissions — trả về effective permissions + role + customRoleId của user hiện tại.
 * Dùng cho client-side guards (ẩn menu item, button…).
 */
import { NextResponse } from 'next/server'
import { loadCurrentUserWithCustomRole, resolvePermissions } from '@/lib/permissions'

export async function GET() {
  const u = await loadCurrentUserWithCustomRole()
  if (!u) return NextResponse.json({ ok: false, code: 'UNAUTHORIZED', message: 'Chưa đăng nhập.' }, { status: 401 })

  const perms = await resolvePermissions({
    id: u.id,
    role: u.role,
    customRoleId: u.customRoleId,
  })
  return NextResponse.json({
    ok: true,
    data: {
      id: u.id,
      role: u.role,
      customRoleId: u.customRoleId,
      permissions: Array.from(perms),
    },
  })
}