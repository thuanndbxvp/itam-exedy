/**
 * GET    /api/permissions/roles/[id]   — chi tiết role + danh sách permission
 * PUT    /api/permissions/roles/[id]   — sửa role + sync permissions
 * DELETE /api/permissions/roles/[id]   — xóa (không xóa nếu là system role)
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { invalidatePermissionCache } from '@/lib/permissions'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('users.manage_roles')

    const { id } = await params
    const role = await prisma.roleDefinition.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    })
    if (!role) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    return okResponse(role)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('users.manage_roles')

    const { id } = await params
    const existing = await prisma.roleDefinition.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    if (existing.isSystem) {
      return NextResponse.json({ ok: false, code: 'INVALID_STATE', message: 'Không thể sửa role hệ thống.' }, { status: 400 })
    }

    const { name, description, baseRole, color, permissionIds } = await req.json()
    const updated = await prisma.$transaction(async (tx) => {
      const role = await tx.roleDefinition.update({
        where: { id },
        data: {
          name: name ?? existing.name,
          description: description !== undefined ? description : existing.description,
          baseRole: baseRole ?? existing.baseRole,
          color: color !== undefined ? color : existing.color,
        },
      })
      if (Array.isArray(permissionIds)) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } })
        if (permissionIds.length) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((permissionId: string) => ({ roleId: id, permissionId })),
          })
        }
      }
      return role
    })

    // Invalidate cache cho tất cả user đang dùng role này
    const users = await prisma.user.findMany({ where: { customRoleId: id }, select: { id: true } })
    for (const u of users) invalidatePermissionCache(u.id)

    return okResponse(updated)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('users.manage_roles')

    const { id } = await params
    const role = await prisma.roleDefinition.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    })
    if (!role) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    if (role.isSystem) {
      return NextResponse.json({ ok: false, code: 'INVALID_STATE', message: 'Không thể xóa role hệ thống.' }, { status: 400 })
    }
    if (role._count.users > 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATE', message: `Đang có ${role._count.users} người dùng gán role này.` },
        { status: 409 },
      )
    }
    await prisma.roleDefinition.delete({ where: { id } })
    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}