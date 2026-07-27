import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ForbiddenError } from '@/lib/errors'
import bcrypt from 'bcryptjs'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session?.user?.role !== 'ADMIN') {
    throw new ForbiddenError('Chỉ ADMIN mới được thực hiện.')
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const user = await prisma.user.findUnique({ where: { id }, include: { department: true } })
    if (!user) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    return NextResponse.json({ ok: true, data: user })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi khi lấy.'
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: msg }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { firstName, email, password, role, departmentId } = body

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })

    const updateData: Record<string, unknown> = {}
    if (firstName) updateData.firstName = firstName
    if (role) updateData.role = role
    if (departmentId !== undefined) updateData.departmentId = departmentId || null
    if (email && email !== existing.email) {
      const conflict = await prisma.user.findUnique({ where: { email } })
      if (conflict) return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Email đã tồn tại.' }, { status: 409 })
      updateData.email = email
    }
    if (password) updateData.password = await bcrypt.hash(password, 10)

    const updated = await prisma.user.update({ where: { id }, data: updateData })
    return NextResponse.json({ ok: true, data: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi khi cập nhật.'
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: msg }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    if (id === 'system') return NextResponse.json({ ok: false, code: 'INVALID_STATE', message: 'Không thể xóa tài khoản hệ thống.' }, { status: 400 })
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true, data: undefined })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi khi xóa.'
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: msg }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}
