import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

export async function GET() {
  try {
    await requirePermissionApi('settings.read')
    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return okResponse(suppliers)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('settings.update')
    const body = await req.json()
    const { name, contact, address, phone, email, url, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên nhà cung cấp là bắt buộc' }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: { name, contact, address, phone, email, url, notes },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'CREATE',
        itemType: 'SUPPLIER',
        itemId: supplier.id,
        userId: user.id,
        notes: `Tạo nhà cung cấp "${name}"`,
      },
    })

    return okResponse(supplier)
  } catch (e) {
    return errorResponse(e)
  }
}