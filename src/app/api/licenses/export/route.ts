/**
 * GET /api/licenses/export — Export licenses to CSV.
 *
 * Supports query params:
 *   - status: 'active' | 'expiring_soon' | 'expired' | 'terminated' | 'all' (default 'all')
 *   - search: case-insensitive contains on name
 *
 * Returns: text/csv với UTF-8 BOM (Excel hiển thị đúng tiếng Việt) + CRLF rows.
 * Permission: reports.export.
 *
 * Sprint B14: refactor dùng `lib/csv.ts` helper (thay vì inline string concat).
 */
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { buildCsv, csvResponse, formatCsvDate, formatCsvNumber } from '@/lib/csv'

type StatusFilter = 'active' | 'expiring_soon' | 'expired' | 'terminated' | 'all'

function buildStatusWhere(status: StatusFilter): Record<string, unknown> {
  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  switch (status) {
    case 'active':
      return {
        OR: [{ expirationDate: null }, { expirationDate: { gte: now } }],
        terminationDate: null,
      }
    case 'expiring_soon':
      return {
        expirationDate: { gte: now, lte: thirtyDays },
        terminationDate: null,
      }
    case 'expired':
      return { expirationDate: { lt: now }, terminationDate: null }
    case 'terminated':
      return { terminationDate: { not: null } }
    default:
      return {}
  }
}

function deriveStatus(expirationDate: Date | null, terminationDate: Date | null): string {
  if (terminationDate) return 'terminated'
  if (!expirationDate) return 'no_expiry'
  const now = new Date()
  if (expirationDate < now) return 'expired'
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (expirationDate <= thirtyDays) return 'expiring_soon'
  return 'active'
}

export async function GET(request: NextRequest) {
  try {
    await requirePermissionApi('reports.export')
  } catch (e) {
    return errorResponse(e)
  }

  const { searchParams } = new URL(request.url)
  const rawStatus = (searchParams.get('status') ?? 'all') as StatusFilter
  const status: StatusFilter = ['active', 'expiring_soon', 'expired', 'terminated', 'all'].includes(rawStatus)
    ? rawStatus
    : 'all'
  const search = searchParams.get('search')?.trim() ?? ''

  const licenses = await prisma.license.findMany({
    where: {
      deletedAt: null,
      ...(search.length > 0 ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
      ...(status !== 'all' ? buildStatusWhere(status) : {}),
    },
    include: {
      seats: { where: { deletedAt: null } },
      manufacturer: { select: { name: true } },
      category: { select: { name: true } },
      company: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'Name',
    'ProductKey',
    'SeatsTotal',
    'SeatsAssigned',
    'Available',
    'Status',
    'ExpirationDate',
    'TerminationDate',
    'Manufacturer',
    'Category',
    'Company',
    'PurchaseDate',
    'PurchaseCost',
    'Notes',
  ]

  const rows = licenses.map((lic) => {
    const assigned = lic.seats.filter((s) => s.assignedUserId || s.assignedAssetId).length
    return [
      lic.name,
      lic.productKey ?? '',
      String(lic.seats.length),
      String(assigned),
      String(Math.max(0, lic.seats.length - assigned)),
      deriveStatus(lic.expirationDate, lic.terminationDate),
      formatCsvDate(lic.expirationDate),
      formatCsvDate(lic.terminationDate),
      lic.manufacturer?.name ?? '',
      lic.category?.name ?? '',
      lic.company?.name ?? '',
      formatCsvDate(lic.purchaseDate),
      formatCsvNumber(lic.purchaseCost),
      (lic.notes ?? '').replace(/\n/g, ' '),
    ]
  })

  const csv = buildCsv(headers, rows)
  const today = new Date().toISOString().split('T')[0]
  return csvResponse(`licenses-export-${today}.csv`, csv)
}
