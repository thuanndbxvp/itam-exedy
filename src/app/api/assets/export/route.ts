/**
 * GET /api/assets/export — Export assets to CSV.
 *
 * Supports query params:
 *   - statusId: filter by status
 *   - categoryId: filter by category
 *   - search: case-insensitive contains on name/assetTag
 *   - assignedOnly: 'true' to export only assigned assets
 *
 * Returns: text/csv với UTF-8 BOM (Excel hiển thị đúng tiếng Việt) + CRLF rows.
 * Permission: reports.export.
 *
 * Sprint B14: refactor dùng `lib/csv.ts` helper. Thêm fields: notes, purchaseOrder,
 * warrantyMonths, eolExplicit, requestable, byod, createdAt.
 */
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { errorResponse } from '@/lib/api'
import { requirePermissionApi } from '@/lib/permissions/http-guard'
import { buildCsv, csvResponse, formatCsvDate, formatCsvBool, formatCsvNumber } from '@/lib/csv'

export async function GET(request: NextRequest) {
  try {
    await requirePermissionApi('reports.export')
  } catch (e) {
    return errorResponse(e)
  }

  const { searchParams } = new URL(request.url)
  const statusId = searchParams.get('statusId')
  const categoryId = searchParams.get('categoryId')
  const search = searchParams.get('search')?.trim() ?? ''
  const assignedOnly = searchParams.get('assignedOnly') === 'true'

  const assets = await prisma.asset.findMany({
    where: {
      deletedAt: null,
      ...(statusId && { statusId }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { assetTag: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(assignedOnly && {
        OR: [
          { assignedUserId: { not: null } },
          { assignedLocationId: { not: null } },
          { assignedAssetId: { not: null } },
        ],
      }),
    },
    include: {
      status: true,
      category: true,
      model: true,
      supplier: true,
      assignedUser: { select: { firstName: true, lastName: true, email: true } },
      assignedLocation: { select: { name: true } },
      assignedAsset: { select: { assetTag: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'AssetTag',
    'Name',
    'Serial',
    'Model',
    'Category',
    'Status',
    'AssignedTo',
    'AssignedLocation',
    'AssignedAsset',
    'PurchaseDate',
    'PurchaseCost',
    'PurchaseOrder',
    'WarrantyMonths',
    'Supplier',
    'Requestable',
    'BYOD',
    'EOLExplicit',
    'Notes',
    'CreatedAt',
  ]

  const rows = assets.map((a) => {
    const assignedTo = a.assignedUser
      ? `${a.assignedUser.firstName}${a.assignedUser.lastName ? ' ' + a.assignedUser.lastName : ''}` +
        (a.assignedUser.email ? ` <${a.assignedUser.email}>` : '')
      : ''
    return [
      a.assetTag,
      a.name,
      a.serial ?? '',
      a.model?.name ?? '',
      a.category?.name ?? '',
      a.status.name,
      assignedTo,
      a.assignedLocation?.name ?? '',
      a.assignedAsset ? `${a.assignedAsset.assetTag} (${a.assignedAsset.name})` : '',
      formatCsvDate(a.purchaseDate),
      formatCsvNumber(a.purchaseCost),
      a.orderNumber ?? '',
      a.warrantyMonths ?? '',
      a.supplier?.name ?? '',
      formatCsvBool(a.requestable),
      formatCsvBool(a.byod),
      formatCsvBool(a.eolExplicit),
      a.notes ?? '',
      formatCsvDate(a.createdAt),
    ]
  })

  const csv = buildCsv(headers, rows)
  const today = new Date().toISOString().split('T')[0]
  return csvResponse(`assets-export-${today}.csv`, csv)
}
