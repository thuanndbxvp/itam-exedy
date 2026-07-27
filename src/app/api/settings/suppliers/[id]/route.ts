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
    const supplier = await prisma.supplier.findUnique({ where: { id } })
    if (!supplier) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true, data: supplier })
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
    const { name, contact, address, phone, email, url, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: 'Tên nhà cung cấp là bắt buộc' }, { status: 400 })
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { name, contact, address, phone, email, url, notes },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'UPDATE',
        itemType: 'SUPPLIER',
        itemId: id,
        userId,
        notes: `Cập nhật nhà cung cấp "${name}"`,
      },
    })

    return NextResponse.json({ ok: true, data: supplier })
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
    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'DELETE',
        itemType: 'SUPPLIER',
        itemId: id,
        userId,
        notes: 'Xóa nhà cung cấp',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}