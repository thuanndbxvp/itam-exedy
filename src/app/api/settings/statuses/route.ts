import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ForbiddenError } from '@/lib/errors'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session?.user?.role !== 'ADMIN') {
    throw new ForbiddenError('Chỉ ADMIN mới được thực hiện.')
  }
}

export async function GET() {
  try {
    await requireAdmin()
    const statuses = await prisma.statusLabel.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json({ ok: true, data: statuses })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi khi lấy danh sách.'
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: msg }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { name, deployable, pending, archived, color } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên không được trống.' }, { status: 400 })
    }

    const existing = await prisma.statusLabel.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Tên trạng thái đã tồn tại.' }, { status: 409 })
    }

    const status = await prisma.statusLabel.create({
      data: { name, deployable: !!deployable, pending: !!pending, archived: !!archived, color: color || null },
    })
    return NextResponse.json({ ok: true, data: status }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi khi tạo.'
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: msg }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}
