/**
 * GET  /api/permissions/roles      — list tất cả RoleDefinition + permission count
 * POST /api/permissions/roles      — tạo custom role
 *
 * Yêu cầu quyền: users.manage_roles
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET() {
  try {
    await requirePermissionApi('users.manage_roles')

    const roles = await prisma.roleDefinition.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      include: {
        _count: { select: { permissions: true, users: true } },
      },
    })
    return okResponse(roles)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermissionApi('users.manage_roles')

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
      return okResponse(role, { status: 201 })
    } catch {
      return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Slug đã tồn tại.' }, { status: 409 })
    }
  } catch (e) {
    return errorResponse(e)
  }
}