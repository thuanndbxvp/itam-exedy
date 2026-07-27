import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    const { name, managerId, companyId, notes } = await req.json()
    const existing = await prisma.department.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }
    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        managerId: managerId !== undefined ? managerId || null : existing.managerId,
        companyId: companyId !== undefined ? companyId || null : existing.companyId,
        notes: notes !== undefined ? notes : existing.notes,
      },
    })
    await recordAudit(
      user.id,
      'UPDATE',
      'DEPARTMENT',
      id,
      `Cập nhật phòng ban "${updated.name}"`,
      {
        oldValues: { managerId: existing.managerId, companyId: existing.companyId, notes: existing.notes },
        newValues: { managerId: updated.managerId, companyId: updated.companyId, notes: updated.notes },
      },
    )
    return okResponse(updated)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    const existing = await prisma.department.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }
    const usersUsing = await prisma.user.count({ where: { departmentId: id } })
    if (usersUsing > 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATE', message: `Đang được sử dụng bởi ${usersUsing} người dùng.` },
        { status: 409 },
      )
    }
    await prisma.department.delete({ where: { id } })
    await recordAudit(user.id, 'DELETE', 'DEPARTMENT', id, `Xóa phòng ban "${existing.name}"`)
    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}