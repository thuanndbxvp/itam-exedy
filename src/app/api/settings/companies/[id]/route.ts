import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ForbiddenError } from '@/lib/errors'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || session?.user?.role !== 'ADMIN') throw new ForbiddenError('Chỉ ADMIN.')
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch (e) {
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: '' }, { status: 403 })
  }
  const { id } = await params
  const { name, notes } = await req.json()
  const existing = await prisma.company.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
  try {
    const updated = await prisma.company.update({ where: { id }, data: { name: name ?? existing.name, notes: notes !== undefined ? notes : existing.notes } })
    return NextResponse.json({ ok: true, data: updated })
  } catch {
    return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Tên công ty đã tồn tại.' }, { status: 409 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await requireAdmin() } catch (e) {
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: '' }, { status: 403 })
  }
  const { id } = await params
  const assetsUsing = await prisma.asset.count({ where: { companyId: id } })
  if (assetsUsing > 0) return NextResponse.json({ ok: false, code: 'INVALID_STATE', message: `Đang được sử dụng bởi ${assetsUsing} tài sản.` }, { status: 409 })
  await prisma.company.delete({ where: { id } })
  return NextResponse.json({ ok: true, data: undefined })
}
