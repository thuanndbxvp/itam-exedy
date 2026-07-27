import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    await requireRole('ADMIN')
    const manufacturers = await prisma.manufacturer.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ ok: true, data: manufacturers })
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
    const { name, url, supportUrl, supportPhone, supportEmail, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: 'Tên nhà sản xuất là bắt buộc' }, { status: 400 })
    }

    const existing = await prisma.manufacturer.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ ok: false, error: 'Nhà sản xuất đã tồn tại' }, { status: 409 })
    }

    const manufacturer = await prisma.manufacturer.create({
      data: { name, url, supportUrl, supportPhone, supportEmail, notes },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'CREATE',
        itemType: 'MANUFACTURER',
        itemId: manufacturer.id,
        userId,
        notes: `Tạo nhà sản xuất "${name}"`,
      },
    })

    return NextResponse.json({ ok: true, data: manufacturer })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}