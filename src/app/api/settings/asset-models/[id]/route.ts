import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    await requirePermissionApi('settings.read')
    const { id } = await params
    const model = await prisma.assetModel.findUnique({ where: { id } })
    if (!model) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Not found' }, { status: 404 })
    }
    return okResponse(model)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PUT(req: NextRequest, { params }: Props) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    const body = await req.json()
    const { name, modelNumber, categoryId, manufacturerId, depreciationId, eol, requireSerial, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên model là bắt buộc' }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Danh mục là bắt buộc' }, { status: 400 })
    }

    const model = await prisma.assetModel.update({
      where: { id },
      data: {
        name,
        modelNumber,
        categoryId,
        manufacturerId: manufacturerId || null,
        depreciationId: depreciationId || null,
        eol,
        requireSerial: requireSerial ?? false,
        notes,
      },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'UPDATE',
        itemType: 'ASSET_MODEL',
        itemId: id,
        userId: user.id,
        notes: `Cập nhật model "${name}"`,
      },
    })

    return okResponse(model)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    await prisma.assetModel.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'DELETE',
        itemType: 'ASSET_MODEL',
        itemId: id,
        userId: user.id,
        notes: 'Xóa model',
      },
    })

    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}