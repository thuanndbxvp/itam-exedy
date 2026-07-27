import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    await requirePermissionApi('settings.read')
    const { id } = await params
    const location = await prisma.location.findUnique({ where: { id } })
    if (!location) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Not found' }, { status: 404 })
    }
    return okResponse(location)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PUT(req: NextRequest, { params }: Props) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    const body = await req.json()
    const { name, address, city, state, country, zip, parentId, managerId, companyId, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên vị trí là bắt buộc' }, { status: 400 })
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        name,
        address,
        city,
        state,
        country,
        zip,
        parentId: parentId || null,
        managerId: managerId || null,
        companyId: companyId || null,
        notes,
      },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'UPDATE',
        itemType: 'LOCATION',
        itemId: id,
        userId: user.id,
        notes: `Cập nhật vị trí "${name}"`,
      },
    })

    return okResponse(location)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    await prisma.location.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'DELETE',
        itemType: 'LOCATION',
        itemId: id,
        userId: user.id,
        notes: 'Xóa vị trí',
      },
    })

    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}