import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET() {
  try {
    await requirePermissionApi('settings.read')
    const models = await prisma.assetModel.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        manufacturer: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })
    return okResponse(models)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('settings.update')
    const body = await req.json()
    const { name, modelNumber, categoryId, manufacturerId, depreciationId, eol, requireSerial, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên model là bắt buộc' }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Danh mục là bắt buộc' }, { status: 400 })
    }

    const model = await prisma.assetModel.create({
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
        actionType: 'CREATE',
        itemType: 'ASSET_MODEL',
        itemId: model.id,
        userId: user.id,
        notes: `Tạo model "${name}"`,
      },
    })

    return okResponse(model)
  } catch (e) {
    return errorResponse(e)
  }
}