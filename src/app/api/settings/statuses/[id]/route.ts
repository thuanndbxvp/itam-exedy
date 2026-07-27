import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermissionApi('settings.read')
    const { id } = await params
    const status = await prisma.statusLabel.findUnique({ where: { id } })
    if (!status) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }
    return okResponse(status)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermissionApi('settings.update')
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
        return NextResponse.json(
          { ok: false, code: 'CONFLICT', message: 'Tên trạng thái đã tồn tại.' },
          { status: 409 },
        )
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
    await recordAudit(
      user.id,
      'UPDATE',
      'STATUS_LABEL',
      id,
      `Cập nhật trạng thái "${updated.name}"`,
      { oldValues: { deployable: existing.deployable, pending: existing.pending, archived: existing.archived }, newValues: { deployable: updated.deployable, pending: updated.pending, archived: updated.archived } },
    )
    return okResponse(updated)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params

    const existing = await prisma.statusLabel.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy.' }, { status: 404 })
    }

    const assetsUsing = await prisma.asset.count({ where: { statusId: id } })
    if (assetsUsing > 0) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_STATE',
          message: `Đang được sử dụng bởi ${assetsUsing} tài sản. Không thể xóa.`,
        },
        { status: 409 },
      )
    }

    await prisma.statusLabel.delete({ where: { id } })
    await recordAudit(user.id, 'DELETE', 'STATUS_LABEL', id, `Xóa trạng thái "${existing.name}"`)
    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}