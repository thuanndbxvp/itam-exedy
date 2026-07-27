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
    const manufacturer = await prisma.manufacturer.findUnique({ where: { id } })
    if (!manufacturer) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, data: manufacturer })
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
    const { name, url, supportUrl, supportPhone, supportEmail, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: 'Tên nhà sản xuất là bắt buộc' }, { status: 400 })
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
        userId,
        notes: `Cập nhật nhà sản xuất "${name}"`,
      },
    })

    return NextResponse.json({ ok: true, data: manufacturer })
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
    await prisma.manufacturer.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'DELETE',
        itemType: 'MANUFACTURER',
        itemId: id,
        userId,
        notes: 'Xóa nhà sản xuất',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}