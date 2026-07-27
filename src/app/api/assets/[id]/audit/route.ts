/**
 * POST /api/assets/[id]/audit — Mark asset as audited.
 *
 * Updates Asset.lastAuditDate = NOW()
 *   + Asset.nextAuditDate = NOW() + 365 days (default audit interval)
 *   + recordAudit(actionType='AUDIT')
 *
 * Permission: assets.update (no dedicated assets.audit key in catalog).
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse, okResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { recordAudit } from '@/lib/audit'

/** Default audit interval: 365 days. Override via Depreciation months nếu cần. */
const DEFAULT_AUDIT_INTERVAL_DAYS = 365

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requirePermissionApi('assets.update')
    const { id } = await params

    const existing = await prisma.asset.findUnique({
      where: { id },
      select: {
        id: true, name: true, assetTag: true,
        lastAuditDate: true, nextAuditDate: true,
        deletedAt: true,
      },
    })
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { ok: false, code: 'NOT_FOUND', message: 'Không tìm thấy tài sản.' },
        { status: 404 },
      )
    }

    const now = new Date()
    const next = new Date(now.getTime() + DEFAULT_AUDIT_INTERVAL_DAYS * 24 * 60 * 60 * 1000)

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        lastAuditDate: now,
        nextAuditDate: next,
      },
      select: {
        id: true, name: true, assetTag: true,
        lastAuditDate: true, nextAuditDate: true,
      },
    })

    await recordAudit(actor.id, 'AUDIT', 'ASSET', id, `Kiểm kê tài sản "${updated.name}" (${updated.assetTag})`, {
      oldValues: {
        lastAuditDate: existing.lastAuditDate,
        nextAuditDate: existing.nextAuditDate,
      },
      newValues: {
        lastAuditDate: updated.lastAuditDate,
        nextAuditDate: updated.nextAuditDate,
      },
    })

    return okResponse({
      lastAuditDate: updated.lastAuditDate?.toISOString() ?? null,
      nextAuditDate: updated.nextAuditDate?.toISOString() ?? null,
    })
  } catch (e) {
    return errorResponse(e)
  }
}
