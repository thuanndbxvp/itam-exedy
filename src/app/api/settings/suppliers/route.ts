import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    await requireRole('ADMIN')
    const suppliers = await prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ ok: true, data: suppliers })
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
    const { name, contact, address, phone, email, url, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: 'Tên nhà cung cấp là bắt buộc' }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: { name, contact, address, phone, email, url, notes },
    })

    await prisma.actionLog.create({
      data: {
        actionType: 'CREATE',
        itemType: 'SUPPLIER',
        itemId: supplier.id,
        userId,
        notes: `Tạo nhà cung cấp "${name}"`,
      },
    })

    return NextResponse.json({ ok: true, data: supplier })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}