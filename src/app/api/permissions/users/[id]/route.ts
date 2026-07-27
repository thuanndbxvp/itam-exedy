/**
 * GET   /api/permissions/users/[id]   — lấy effective permissions + overrides của 1 user
 * POST  /api/permissions/users/[id]   — set customRoleId hoặc upsert 1 override
 *
 * Yêu cầu quyền: users.manage_roles
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { resolvePermissions, invalidatePermissionCache } from '@/lib/permissions'
import { SYSTEM_ROLE_PERMISSIONS } from '@/lib/permissions/catalog'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('users.manage_roles')

    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        customRoleId: true,
        customRole: { select: { id: true, name: true, slug: true } },
        userPermissions: {
          select: {
            id: true,
            effect: true,
            reason: true,
            expiresAt: true,
            permission: { select: { id: true, key: true, label: true, group: true } },
          },
        },
      },
    })
    if (!user) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy user.' }, { status: 404 })

    const effective = await resolvePermissions({
      id: user.id,
      role: user.role,
      customRoleId: user.customRoleId,
    })

    return okResponse({
      ...user,
      basePermissions: SYSTEM_ROLE_PERMISSIONS[user.role] ?? [],
      effectivePermissions: Array.from(effective),
    })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('users.manage_roles')

    const { id } = await params
    const body = await req.json()
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy user.' }, { status: 404 })

    // Action 1: gán custom role
    if (body.action === 'set_custom_role') {
      const { customRoleId } = body
      await prisma.user.update({
        where: { id },
        data: { customRoleId: customRoleId || null },
      })
      invalidatePermissionCache(id)
      return okResponse({ customRoleId: customRoleId || null })
    }

    // Action 2: upsert 1 override (GRANT/DENY)
    if (body.action === 'set_override') {
      const { permissionId, effect, reason, expiresAt } = body
      if (!permissionId || !['GRANT', 'DENY'].includes(effect)) {
        return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'permissionId & effect (GRANT/DENY) bắt buộc.' }, { status: 400 })
      }
      const existing = await prisma.userPermission.findUnique({
        where: { userId_permissionId: { userId: id, permissionId } },
      })
      if (existing) {
        await prisma.userPermission.update({
          where: { id: existing.id },
          data: {
            effect,
            reason: reason || null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        })
      } else {
        await prisma.userPermission.create({
          data: {
            userId: id,
            permissionId,
            effect,
            reason: reason || null,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        })
      }
      invalidatePermissionCache(id)
      return okResponse(undefined)
    }

    // Action 3: xóa override
    if (body.action === 'clear_override') {
      const { permissionId } = body
      if (!permissionId) {
        return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'permissionId bắt buộc.' }, { status: 400 })
      }
      await prisma.userPermission.deleteMany({ where: { userId: id, permissionId } })
      invalidatePermissionCache(id)
      return okResponse(undefined)
    }

    return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Action không hợp lệ.' }, { status: 400 })
  } catch (e) {
    return errorResponse(e)
  }
}