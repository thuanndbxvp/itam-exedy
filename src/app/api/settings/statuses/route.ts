import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

export async function GET() {
  try {
    await requirePermissionApi('settings.read')
    const statuses = await prisma.statusLabel.findMany({ orderBy: { name: 'asc' } })
    return okResponse(statuses)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermissionApi('settings.update')
    const body = await req.json()
    const { name, deployable, pending, archived, color } = body

    if (!name?.trim()) {
      return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Tên không được trống.' }, { status: 400 })
    }

    const existing = await prisma.statusLabel.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json(
        { ok: false, code: 'CONFLICT', message: 'Tên trạng thái đã tồn tại.' },
        { status: 409 },
      )
    }

    const status = await prisma.statusLabel.create({
      data: { name, deployable: !!deployable, pending: !!pending, archived: !!archived, color: color || null },
    })
    await recordAudit(user.id, 'CREATE', 'STATUS_LABEL', status.id, `Tạo trạng thái "${name}"`)
    return okResponse(status, { status: 201 })
  } catch (e) {
    return errorResponse(e)
  }
}