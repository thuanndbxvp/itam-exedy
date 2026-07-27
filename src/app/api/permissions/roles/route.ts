/**
 * GET  /api/permissions/roles      — list tất cả RoleDefinition + permission count
 * POST /api/permissions/roles      — tạo custom role
 *
 * Yêu cầu quyền: users.manage_roles
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

export async function GET() {
  try {
    await requirePermission('users.manage_roles')
  } catch (e) {
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: (e as Error).message }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }

  const roles = await prisma.roleDefinition.findMany({
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    include: {
      _count: { select: { permissions: true, users: true } },
    },
  })
  return NextResponse.json({ ok: true, data: roles })
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission('users.manage_roles')
  } catch (e) {
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: (e as Error).message }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }

  const { name, slug, description, baseRole, color, permissionIds } = await req.json()
  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên và slug là bắt buộc.' }, { status: 400 })
  }

  try {
    const role = await prisma.roleDefinition.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        description: description || null,
        baseRole: baseRole || 'EMPLOYEE',
        color: color || null,
        isSystem: false,
        permissions: Array.isArray(permissionIds) && permissionIds.length
          ? { create: permissionIds.map((permissionId: string) => ({ permissionId })) }
          : undefined,
      },
      include: { _count: { select: { permissions: true, users: true } } },
    })
    return NextResponse.json({ ok: true, data: role }, { status: 201 })
  } catch {
    return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Slug đã tồn tại.' }, { status: 409 })
  }
}