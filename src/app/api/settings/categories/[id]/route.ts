import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    const { name, categoryType, color } = await req.json()
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }
    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        categoryType: categoryType ?? existing.categoryType,
        color: color !== undefined ? color : existing.color,
      },
    })
    await recordAudit(
      user.id,
      'UPDATE',
      'CATEGORY',
      id,
      `Cập nhật danh mục "${updated.name}"`,
      { oldValues: { name: existing.name, categoryType: existing.categoryType, color: existing.color }, newValues: { name: updated.name, categoryType: updated.categoryType, color: updated.color } },
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
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }
    const assetsUsing = await prisma.asset.count({ where: { categoryId: id } })
    if (assetsUsing > 0) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_STATE', message: `Đang được sử dụng bởi ${assetsUsing} tài sản.` },
        { status: 409 },
      )
    }
    await prisma.category.delete({ where: { id } })
    await recordAudit(user.id, 'DELETE', 'CATEGORY', id, `Xóa danh mục "${existing.name}"`)
    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}