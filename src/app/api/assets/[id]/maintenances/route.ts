/**
 * POST /api/assets/[id]/maintenances  — tạo phiếu sửa chữa mới
 *
 * Auth: assets.update.
 *
 * Sprint C.11: Tự động sync:
 * - Asset status → MAINTENANCE (nếu chưa hoàn thành)
 * - Asset repairCount, totalRepairCost
 * - Asset healthScore (recalculate)
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { onMaintenanceCreated, updateMaintenanceStats } from '@/lib/asset-status-sync'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermissionApi('assets.read')

    const { id } = await params

    const asset = await prisma.asset.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, assetTag: true, name: true },
    })
    if (!asset) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Asset không tồn tại.' }, { status: 404 })
    }

    const maintenances = await prisma.assetMaintenance.findMany({
      where: { assetId: id, deletedAt: null },
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    })

    const data = maintenances.map((m) => ({
      id: m.id,
      title: m.title,
      cost: m.cost ? Number(m.cost) : null,
      startDate: m.startDate?.toISOString() ?? null,
      completionDate: m.completionDate?.toISOString() ?? null,
      notes: m.notes,
      supplier: m.supplier,
      createdBy: m.createdBy
        ? { id: m.createdBy.id, firstName: m.createdBy.firstName, lastName: m.createdBy.lastName }
        : null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }))

    return okResponse({ asset, maintenances: data })
  } catch (e) {
    return errorResponse(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('assets.update')
    const { id } = await params

    const asset = await prisma.asset.findUnique({
      where: { id, deletedAt: null },
      select: { id: true },
    })
    if (!asset) {
      return NextResponse.json({ ok: false, code: 'NOT_FOUND', message: 'Asset không tồn tại.' }, { status: 404 })
    }

    const body = await req.json()
    const { title, supplierId, cost, startDate, completionDate, notes } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { ok: false, code: 'VALIDATION', message: 'Tiêu đề là bắt buộc.' },
        { status: 400 },
      )
    }

    const created = await prisma.assetMaintenance.create({
      data: {
        assetId: id,
        title: title.trim(),
        supplierId: supplierId || null,
        cost: cost != null && cost !== '' ? Number(cost) : null,
        startDate: startDate ? new Date(startDate) : null,
        completionDate: completionDate ? new Date(completionDate) : null,
        notes: notes?.trim() || null,
        createdById: actor.id,
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    })

    // Sprint C.11: Sync asset status & stats
    await updateMaintenanceStats(id)
    const syncResult = await onMaintenanceCreated(id, actor.id, title)

    return okResponse(
      {
        ...created,
        cost: created.cost ? Number(created.cost) : null,
        startDate: created.startDate?.toISOString() ?? null,
        completionDate: created.completionDate?.toISOString() ?? null,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
        // Extra: health info for UI refresh
        assetHealth: {
          healthScore: syncResult.healthScore,
          recommendation: syncResult.recommendation,
        },
      },
      { status: 201 },
    )
  } catch (e) {
    return errorResponse(e)
  }
}