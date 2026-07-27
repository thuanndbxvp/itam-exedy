/**
 * GET /api/audit-log/export — Export ActionLog entries to CSV.
 *
 * Sprint B15.2: Admin/compliance report.
 *
 * Query params (all optional):
 *   - from: ISO date (yyyy-MM-dd or full ISO) — inclusive lower bound on createdAt
 *   - to: ISO date — inclusive upper bound on createdAt
 *   - actionType: filter by ActionType (CREATE/UPDATE/LOGIN/etc.)
 *   - itemType: filter by ItemType (ASSET/LICENSE/USER/etc.)
 *   - actorId: filter by user who performed the action
 *
 * Limit: 10,000 rows (admin export — không phải bulk data sync).
 *
 * Returns: text/csv với UTF-8 BOM + CRLF rows.
 * Permission: settings.read (admin/IT_MANAGER only).
 */
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { buildCsv, csvResponse, formatCsvDateTime } from '@/lib/csv'

const MAX_ROWS = 10_000

export async function GET(request: NextRequest) {
  try {
    await requirePermissionApi('settings.read')
  } catch (e) {
    return errorResponse(e)
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')?.trim() ?? ''
  const to = searchParams.get('to')?.trim() ?? ''
  const actionType = searchParams.get('actionType')?.trim() ?? ''
  const itemType = searchParams.get('itemType')?.trim() ?? ''
  const actorId = searchParams.get('actorId')?.trim() ?? ''

  // Build WHERE clause
  const where: Record<string, unknown> = {}
  if (actionType) where.actionType = actionType
  if (itemType) where.itemType = itemType
  if (actorId) where.userId = actorId

  // Date range
  if (from || to) {
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (from) {
      const d = new Date(from)
      if (!isNaN(d.getTime())) dateFilter.gte = d
    }
    if (to) {
      const d = new Date(to)
      if (!isNaN(d.getTime())) {
        // Inclusive end-of-day nếu chỉ truyền yyyy-MM-dd
        if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
          d.setHours(23, 59, 59, 999)
        }
        dateFilter.lte = d
      }
    }
    if (dateFilter.gte || dateFilter.lte) {
      where.createdAt = dateFilter
    }
  }

  const logs = await prisma.actionLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: MAX_ROWS,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  })

  const headers = [
    'CreatedAt',
    'ActorID',
    'ActorName',
    'ActorEmail',
    'ActionType',
    'ItemType',
    'ItemID',
    'TargetType',
    'TargetID',
    'IPAddress',
    'Notes',
  ]

  const rows = logs.map((log) => {
    const actorName = log.user
      ? `${log.user.firstName}${log.user.lastName ? ' ' + log.user.lastName : ''}`.trim()
      : ''
    return [
      formatCsvDateTime(log.createdAt),
      log.userId,
      actorName,
      log.user?.email ?? '',
      log.actionType,
      log.itemType,
      log.itemId,
      log.targetType ?? '',
      log.targetId ?? '',
      log.ipAddress ?? '',
      (log.notes ?? '').replace(/\n/g, ' '),
    ]
  })

  const csv = buildCsv(headers, rows)
  const today = new Date().toISOString().split('T')[0]
  return csvResponse(`audit-log-export-${today}.csv`, csv)
}
