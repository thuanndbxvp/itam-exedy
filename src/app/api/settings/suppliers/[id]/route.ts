import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    await requirePermissionApi('settings.read')
    const { id } = await params
    const supplier = await prisma.supplier.findUnique({ where: { id } })
    if (!supplier) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Not found' }, { status: 404 })
    }
    return okResponse(supplier)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PUT(req: NextRequest, { params }: Props) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    const body = await req.json()
    const { name, contact, address, phone, email, url, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên nhà cung cấp là bắt buộc' }, { status: 400 })
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, contact, address, phone, email, url, notes },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'UPDATE',
        itemType: 'SUPPLIER',
        itemId: id,
        userId: user.id,
        notes: `Cập nhật nhà cung cấp "${name}"`,
      },
    })

    return okResponse(supplier)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'DELETE',
        itemType: 'SUPPLIER',
        itemId: id,
        userId: user.id,
        notes: 'Xóa nhà cung cấp',
      },
    })

    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}