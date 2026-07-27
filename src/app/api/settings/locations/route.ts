import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET() {
  try {
    await requirePermissionApi('settings.read')
    const locations = await prisma.location.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return okResponse(locations)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('settings.update')
    const body = await req.json()
    const { name, address, city, state, country, zip, parentId, managerId, companyId, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên vị trí là bắt buộc' }, { status: 400 })
    }

    const location = await prisma.location.create({
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
        actionType: 'CREATE',
        itemType: 'LOCATION',
        itemId: location.id,
        userId: user.id,
        notes: `Tạo vị trí "${name}"`,
      },
    })

    return okResponse(location)
  } catch (e) {
    return errorResponse(e)
  }
}