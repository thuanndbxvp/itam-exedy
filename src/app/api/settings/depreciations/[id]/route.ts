/**
 * PUT    /api/settings/depreciations/[id] — update depreciation rule.
 * DELETE /api/settings/depreciations/[id] — soft-delete depreciation rule.
 *
 * Permission: settings.update.
 *
 * Soft-delete (set deletedAt) thay vì xóa cứng — vì có FK từ AssetModel và Asset.
 * Nếu đang được sử dụng → trả 409 INVALID_STATE.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'
import { Prisma } from '@prisma/client'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params
    const { name, months, depreciationType, minimumValue, notes } = await req.json()

    const existing = await prisma.depreciation.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy quy tắc.' },
        { status: 404 },
      )
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Tên quy tắc là bắt buộc.' },
        { status: 400 },
      )
    }
    if (typeof months !== 'number' || months <= 0) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Số tháng phải là số nguyên dương.' },
        { status: 400 },
      )
    }

    if (name !== existing.name) {
      const dup = await prisma.depreciation.findUnique({ where: { name } })
      if (dup) {
        return NextResponse.json(
          { ok: false, code: 'CONFLICT', message: 'Tên quy tắc đã được sử dụng.' },
          { status: 409 },
        )
      }
    }

    const updated = await prisma.depreciation.update({
      where: { id },
      data: {
        name: name.trim(),
        months,
        depreciationType: depreciationType ?? existing.depreciationType,
        minimumValue: typeof minimumValue === 'number' ? new Prisma.Decimal(minimumValue) : existing.minimumValue,
        notes: notes?.trim() || null,
      },
    })

    await recordAudit(
      user.id,
      'UPDATE',
      'DEPRECIATION',
      id,
      `Cập nhật quy tắc khấu hao "${updated.name}"`,
      {
        oldValues: {
          name: existing.name,
          months: existing.months,
          depreciationType: existing.depreciationType,
          minimumValue: existing.minimumValue.toString(),
        },
        newValues: {
          name: updated.name,
          months: updated.months,
          depreciationType: updated.depreciationType,
          minimumValue: updated.minimumValue.toString(),
        },
      },
    )

    return okResponse(updated)
  } catch (e) {
    return errorResponse(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermissionApi('settings.update')
    const { id } = await params

    const existing = await prisma.depreciation.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy quy tắc.' },
        { status: 404 },
      )
    }

    // Không cho xóa nếu đang có Asset/AssetModel tham chiếu
    const [assetCount, modelCount] = await Promise.all([
      prisma.asset.count({ where: { depreciationId: id, deletedAt: null } }),
      prisma.assetModel.count({ where: { depreciationId: id, deletedAt: null } }),
    ])

    if (assetCount + modelCount > 0) {
      return NextResponse.json(
        {
          ok: false,
          code: 'INVALID_STATE',
          message: `Đang được sử dụng bởi ${assetCount} tài sản và ${modelCount} model.`,
        },
        { status: 409 },
      )
    }

    await prisma.depreciation.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await recordAudit(user.id, 'DELETE', 'DEPRECIATION', id, `Xóa quy tắc khấu hao "${existing.name}"`)

    return okResponse(undefined)
  } catch (e) {
    return errorResponse(e)
  }
}