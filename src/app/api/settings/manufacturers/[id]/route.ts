import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    await requirePermissionApi('settings.read')
    const { id } = await params
    const manufacturer = await prisma.manufacturer.findUnique({ where: { id } })
    if (!manufacturer) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Not found' }, { status: 404 })
    }
    return okResponse(manufacturer)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PUT(req: NextRequest, { params }: Props) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    const body = await req.json()
    const { name, url, supportUrl, supportPhone, supportEmail, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên nhà sản xuất là bắt buộc' }, { status: 400 })
    }

    const manufacturer = await prisma.manufacturer.update({
      where: { id },
      data: { name, url, supportUrl, supportPhone, supportEmail, notes },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'UPDATE',
        itemType: 'MANUFACTURER',
        itemId: id,
        userId: user.id,
        notes: `Cập nhật nhà sản xuất "${name}"`,
      },
    })

    return okResponse(manufacturer)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    await prisma.manufacturer.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'DELETE',
        itemType: 'MANUFACTURER',
        itemId: id,
        userId: user.id,
        notes: 'Xóa nhà sản xuất',
      },
    })

    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}