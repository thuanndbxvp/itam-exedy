/**
 * GET /api/licenses/export — Export licenses to CSV.
 *
 * Supports query params:
 *   - status: 'active' | 'expiring_soon' | 'expired' | 'terminated' | 'all' (default 'all')
 *   - search: case-insensitive contains on name
 *
 * Returns: text/csv with UTF-8 BOM for Excel Vietnamese display.
 * Permission: reports.export.
 */
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'

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

  const header = [
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
      `"${lic.name.replace(/"/g, '""')}"`,
      lic.productKey ? `"${lic.productKey.replace(/"/g, '""')}"` : '',
      String(lic.seats.length),
      String(assigned),
      String(Math.max(0, lic.seats.length - assigned)),
      deriveStatus(lic.expirationDate, lic.terminationDate),
      lic.expirationDate?.toISOString().split('T')[0] ?? '',
      lic.terminationDate?.toISOString().split('T')[0] ?? '',
      lic.manufacturer?.name ?? '',
      lic.category?.name ?? '',
      lic.company?.name ?? '',
      lic.purchaseDate?.toISOString().split('T')[0] ?? '',
      lic.purchaseCost?.toString() ?? '',
      lic.notes ? `"${lic.notes.replace(/"/g, '""').replace(/\n/g, ' ')}"` : '',
    ]
  })

  const BOM = '\uFEFF'
  const csv = BOM + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="licenses-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}