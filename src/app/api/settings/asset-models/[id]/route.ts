import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface Props { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    await requireRole('ADMIN')
    const { id } = await params
    const model = await prisma.assetModel.findUnique({ where: { id } })
    if (!model) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, data: model })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 401 })
  }
}

export async function PUT(req: NextRequest, { params }: Props) {
  try {
    await requireRole('ADMIN')
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ?? ''
    const { id } = await params
    const body = await req.json()
    const { name, modelNumber, categoryId, manufacturerId, depreciationId, eol, requireSerial, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: 'Tên model là bắt buộc' }, { status: 400 })
    }
    if (!categoryId) {
      return NextResponse.json({ ok: false, error: 'Danh mục là bắt buộc' }, { status: 400 })
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
        userId,
        notes: `Cập nhật model "${name}"`,
      },
    })

    return NextResponse.json({ ok: true, data: model })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  try {
    await requireRole('ADMIN')
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id ?? ''
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
        userId,
        notes: 'Xóa model',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}