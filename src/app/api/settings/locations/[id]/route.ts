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
    const location = await prisma.location.findUnique({ where: { id } })
    if (!location) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, data: location })
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
    const { name, address, city, state, country, zip, parentId, managerId, companyId, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: 'Tên vị trí là bắt buộc' }, { status: 400 })
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
        userId,
        notes: `Cập nhật vị trí "${name}"`,
      },
    })

    return NextResponse.json({ ok: true, data: location })
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
    await prisma.location.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'DELETE',
        itemType: 'LOCATION',
        itemId: id,
        userId,
        notes: 'Xóa vị trí',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}