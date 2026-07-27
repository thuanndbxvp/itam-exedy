import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireRole } from '@/lib/auth-guard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    await requireRole('ADMIN')
    const locations = await prisma.location.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ ok: true, data: locations })
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
    const { name, address, city, state, country, zip, parentId, managerId, companyId, notes } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, error: 'Tên vị trí là bắt buộc' }, { status: 400 })
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
        userId,
        notes: `Tạo vị trí "${name}"`,
      },
    })

    return NextResponse.json({ ok: true, data: location })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}