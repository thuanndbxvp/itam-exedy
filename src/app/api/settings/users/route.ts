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
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { department: true, company: true },
    })
    return NextResponse.json({ ok: true, data: users })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi khi lấy danh sách.'
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: msg }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const { firstName, email, password, role } = await req.json()

    if (!firstName?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Thông tin không đầy đủ.' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Email đã tồn tại.' }, { status: 409 })
    }

    const user = await prisma.user.create({
      data: { firstName, email, password, role: role || 'EMPLOYEE', activated: true },
    })
    return NextResponse.json({ ok: true, data: user }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi khi tạo.'
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: msg }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}
