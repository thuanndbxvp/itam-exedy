/**
 * /maintenances — Global maintenance list (A9).
 *
 * Liệt kê tất cả phiếu sửa chữa/bảo trì từ AssetMaintenance.
 * Filter: status (derived: pending/in_progress/completed).
 *
 * Permission: assets.read (admin/IT_STAFF only — EMPLOYEE không truy cập).
 */
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { requirePermission } from '@/lib/permissions/guard'
import { redirect } from 'next/navigation'
import { Wrench } from 'lucide-react'
import MaintenanceTable from '@/components/maintenances/MaintenanceTable'

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed'

const VALID_STATUSES: ReadonlySet<StatusFilter> = new Set([
  'all', 'pending', 'in_progress', 'completed',
])

function statusLabel(s: StatusFilter): string {
  switch (s) {
    case 'pending': return 'Chưa bắt đầu'
    case 'in_progress': return 'Đang thực hiện'
    case 'completed': return 'Hoàn thành'
    default: return 'Tất cả'
  }
}

type PageProps = {
  searchParams: Promise<{ status?: string; assetId?: string }>
}

export default async function MaintenancesPage({ searchParams }: PageProps) {
  try {
    await requirePermission('assets.read')
  } catch {
    redirect('/')
  }

  const params = await searchParams
  const rawStatus = (params.status ?? 'all') as StatusFilter
  const status: StatusFilter = VALID_STATUSES.has(rawStatus) ? rawStatus : 'all'
  const assetIdFilter = params.assetId?.trim() || ''
  const hasFilter = status !== 'all' || assetIdFilter.length > 0

  // Build where cho status filter
  const now = new Date()
  let statusWhere: Record<string, unknown> = {}
  if (status === 'pending') {
    statusWhere = { startDate: null }
  } else if (status === 'in_progress') {
    statusWhere = {
      startDate: { not: null, lte: now },
      completionDate: null,
    }
  } else if (status === 'completed') {
    statusWhere = { completionDate: { not: null } }
  }

  const maintenances = await prisma.assetMaintenance.findMany({
    where: {
      deletedAt: null,
      ...statusWhere,
      ...(assetIdFilter ? { assetId: assetIdFilter } : {}),
    },
    include: {
      asset: { select: { id: true, assetTag: true, name: true } },
      supplier: { select: { id: true, name: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
    take: 200, // Cap — pagination nếu cần sau
  })

  // Serialize Decimal → number cho client
  const items = maintenances.map((m) => ({
    id: m.id,
    title: m.title,
    asset: m.asset,
    supplier: m.supplier,
    createdBy: m.createdBy,
    cost: m.cost ? Number(m.cost) : null,
    startDate: m.startDate?.toISOString() ?? null,
    completionDate: m.completionDate?.toISOString() ?? null,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
  }))

  // Total cost summary (chỉ filter hiện tại)
  const totalCost = items.reduce((sum, m) => sum + (m.cost ?? 0), 0)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wrench size={22} className="text-amber-600" />
            Bảo trì
          </h1>
          <p className="text-gray-500 mt-1">Lịch sử sửa chữa & bảo trì toàn hệ thống.</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'pending', 'in_progress', 'completed'] as const).map((s) => {
          const isActive = status === s
          const href = s === 'all'
            ? (assetIdFilter ? `/maintenances?assetId=${assetIdFilter}` : '/maintenances')
            : `/maintenances?status=${s}${assetIdFilter ? `&assetId=${assetIdFilter}` : ''}`
          return (
            <Link
              key={s}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {statusLabel(s)}
            </Link>
          )
        })}
        {hasFilter && (
          <Link
            href="/maintenances"
            className="text-sm text-gray-500 hover:text-gray-800 underline underline-offset-2 ml-2"
          >
            Xóa bộ lọc
          </Link>
        )}
      </div>

      {/* Summary */}
      {items.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-800">
            {items.length} phiếu {hasFilter && <span className="text-amber-600">(đã lọc)</span>}
          </span>
          <span className="text-lg font-bold text-amber-900">
            Tổng chi phí: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalCost)}
          </span>
        </div>
      )}

      {/* Table */}
      <MaintenanceTable items={items} />
    </div>
  )
}