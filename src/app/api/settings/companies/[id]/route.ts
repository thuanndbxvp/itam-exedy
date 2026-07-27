import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    const { name, notes } = await req.json()
    const existing = await prisma.company.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }
    try {
      const updated = await prisma.company.update({
        where: { id },
        data: { name: name ?? existing.name, notes: notes !== undefined ? notes : existing.notes },
      })
      await recordAudit(
        user.id,
        'UPDATE',
        'COMPANY',
        id,
        `Cập nhật công ty "${updated.name}"`,
        { oldValues: { name: existing.name, notes: existing.notes }, newValues: { name: updated.name, notes: updated.notes } },
      )
      return okResponse(updated)
    } catch {
      return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Tên công ty đã tồn tại.' }, { status: 409 })
    }
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    const existing = await prisma.company.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }
    const assetsUsing = await prisma.asset.count({ where: { companyId: id } })
    if (assetsUsing > 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATE', message: `Đang được sử dụng bởi ${assetsUsing} tài sản.` },
        { status: 409 },
      )
    }
    await prisma.company.delete({ where: { id } })
    await recordAudit(user.id, 'DELETE', 'COMPANY', id, `Xóa công ty "${existing.name}"`)
    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}