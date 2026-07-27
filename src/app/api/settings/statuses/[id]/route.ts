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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const status = await prisma.statusLabel.findUnique({ where: { id } })
    if (!status) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, data: status })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi khi lấy.'
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: msg }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const { name, deployable, pending, archived, color } = body

    const existing = await prisma.statusLabel.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }

    if (name && name !== existing.name) {
      const conflict = await prisma.statusLabel.findUnique({ where: { name } })
      if (conflict) {
        return NextResponse.json({ ok: false, code: 'CONFLICT', message: 'Tên trạng thái đã tồn tại.' }, { status: 409 })
      }
    }

    const updated = await prisma.statusLabel.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        deployable: deployable ?? existing.deployable,
        pending: pending ?? existing.pending,
        archived: archived ?? existing.archived,
        color: color !== undefined ? color : existing.color,
      },
    })
    return NextResponse.json({ ok: true, data: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi khi cập nhật.'
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: msg }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const existing = await prisma.statusLabel.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }

    const assetsUsing = await prisma.asset.count({ where: { statusId: id } })
    if (assetsUsing > 0) {
      return NextResponse.json({
        ok: false, code: 'INVALID_STATE',
        message: `Đang được sử dụng bởi ${assetsUsing} tài sản. Không thể xóa.`
      }, { status: 409 })
    }

    await prisma.statusLabel.delete({ where: { id } })
    return NextResponse.json({ ok: true, data: undefined })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Lỗi khi xóa.'
    const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
    return NextResponse.json({ ok: false, code, message: msg }, { status: code === 'FORBIDDEN' ? 403 : 500 })
  }
}
