import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET() {
  try {
    await requirePermissionApi('settings.read')
    const manufacturers = await prisma.manufacturer.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return okResponse(manufacturers)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('settings.update')
    const body = await req.json()
    const { name, url, supportUrl, supportPhone, supportEmail, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên nhà sản xuất là bắt buộc' }, { status: 400 })
    }

    const existing = await prisma.manufacturer.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Nhà sản xuất đã tồn tại' }, { status: 409 })
    }

    const manufacturer = await prisma.manufacturer.create({
      data: { name, url, supportUrl, supportPhone, supportEmail, notes },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'CREATE',
        itemType: 'MANUFACTURER',
        itemId: manufacturer.id,
        userId: user.id,
        notes: `Tạo nhà sản xuất "${name}"`,
      },
    })

    return okResponse(manufacturer)
  } catch (e) {
    return errorResponse(e)
  }
}