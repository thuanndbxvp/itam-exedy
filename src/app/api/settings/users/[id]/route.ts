import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { errorResponse, okResponse } from '@/lib/api'
import { invalidatePermissionCache } from '@/lib/permissions'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('users.read')
    const { id } = await params
    const user = await prisma.user.findUnique({ where: { id }, include: { department: true } })
    if (!user) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }
    return okResponse(user)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('users.update')
    const { id } = await params
    const body = await req.json()
    const { firstName, lastName, jobTitle, email, password, role, departmentId, customRoleId } = body

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (firstName) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName || null
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle || null
    if (role) updateData.role = role
    if (departmentId !== undefined) updateData.departmentId = departmentId || null
    if (customRoleId !== undefined) updateData.customRoleId = customRoleId || null
    if (email && email !== existing.email) {
      const conflict = await prisma.user.findUnique({ where: { email } })
      if (conflict) {
        return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Email đã tồn tại.' }, { status: 409 })
      }
      updateData.email = email
    }
    if (password) updateData.password = await bcrypt.hash(password, 10)

    const updated = await prisma.user.update({ where: { id }, data: updateData })
    invalidatePermissionCache(id)

    // Audit — KHÔNG ghi password (chỉ note "đã đổi mật khẩu" nếu có).
    const name = [updated.firstName, updated.lastName].filter(Boolean).join(' ')
    await recordAudit(
      actor.id,
      'UPDATE',
      'USER',
      id,
      `Cập nhật người dùng "${name}"${password ? ' (đổi mật khẩu)' : ''}`,
      {
        oldValues: { firstName: existing.firstName, lastName: existing.lastName, email: existing.email, role: existing.role, departmentId: existing.departmentId },
        newValues: { firstName: updated.firstName, lastName: updated.lastName, email: updated.email, role: updated.role, departmentId: updated.departmentId },
      },
    )

    return okResponse(updated)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('users.delete')
    const { id } = await params
    if (id === 'system') {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATE', message: 'Không thể xóa tài khoản hệ thống.' },
        { status: 400 },
      )
    }
    const existing = await prisma.user.findUnique({ where: { id } })
    await prisma.user.delete({ where: { id } })
    if (existing) {
      const name = [existing.firstName, existing.lastName].filter(Boolean).join(' ')
      await recordAudit(actor.id, 'DELETE', 'USER', id, `Xóa người dùng "${name}"`)
    }
    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}