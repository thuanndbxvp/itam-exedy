import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    await requireRole('ADMIN')
    const models = await prisma.assetModel.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        manufacturer: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ ok: true, data: models })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole('ADMIN')
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ?? ''
    const body = await req.json()
    const { name, modelNumber, categoryId, manufacturerId, depreciationId, eol, requireSerial, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: 'Tên model là bắt buộc' }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ ok: false, error: 'Danh mục là bắt buộc' }, { status: 400 })
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
        userId,
        notes: `Tạo model "${name}"`,
      },
    })

    return NextResponse.json({ ok: true, data: model })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}