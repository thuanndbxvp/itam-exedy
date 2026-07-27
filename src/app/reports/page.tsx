/**
 * ReportsPage — Sprint B9.
 *
 * Server Component:
 *  - Phân quyền `reports.view` (ADMIN / IT_MANAGER xem).
 *  - 4 cards counters (assets / users / licenses / checked-out)
 *  - Bar chart "theo trạng thái"
 *  - Pie chart "theo danh mục" (proxy cho department, do schema Location không FK Department)
 *  - Bảng "Top 10 licenses sắp hết hạn"
 */
import { redirect } from 'next/navigation'
import { BarChart3, AlertCircle, CheckCircle2, Database } from 'lucide-react'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions/guard'
import StatusBarChart from '@/components/reports/StatusBarChart'
import CategoryPieChart from '@/components/reports/CategoryPieChart'
import LicenseExpiringTable from '@/components/reports/LicenseExpiringTable'

interface Counters {
  totalAssets: number
  totalUsers: number
  totalLicenses: number
  checkedOutAssets: number
  availableAssets: number
  pendingAssets: number
}

interface StatusBucket {
  statusId: string
  statusName: string
  color: string
  count: number
}

interface CategoryBucket {
  categoryId: string
  categoryName: string
  color: string
  count: number
}

interface ExpiringLicense {
  licenseId: string
  name: string
  expirationDate: string
  daysUntil: number
  totalSeats: number
  usedSeats: number
}

async function getCounters(): Promise<Counters> {
  const [totalAssets, totalUsers, totalLicenses, checkedOutAssets, availableAssets, pendingAssets] =
    await Promise.all([
      prisma.asset.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.license.count({ where: { deletedAt: null } }),
      prisma.asset.count({ where: { deletedAt: null, assignedUserId: { not: null } } }),
      prisma.asset.count({
        where: {
          deletedAt: null,
          status: { deployable: true, pending: false, archived: false },
        },
      }),
      prisma.asset.count({ where: { deletedAt: null, status: { pending: true } } }),
    ])
  return {
    totalAssets,
    totalUsers,
    totalLicenses,
    checkedOutAssets,
    availableAssets,
    pendingAssets,
  }
}

async function getStatusBuckets(): Promise<StatusBucket[]> {
  const data = await prisma.asset.groupBy({
    by: ['statusId'],
    where: { deletedAt: null },
    _count: { id: true },
  })
  const statuses = await prisma.statusLabel.findMany({
    where: { id: { in: data.map((d) => d.statusId) } },
    select: { id: true, name: true, color: true },
  })
  return data
    .map((d) => {
      const s = statuses.find((x) => x.id === d.statusId)
      return {
        statusId: d.statusId,
        statusName: s?.name ?? 'Unknown',
        color: s?.color ?? '#6b7280',
        count: d._count.id,
      }
    })
    .sort((a, b) => b.count - a.count)
}

async function getCategoryBuckets(): Promise<CategoryBucket[]> {
  const data = await prisma.asset.groupBy({
    by: ['categoryId'],
    where: { deletedAt: null, categoryId: { not: null } },
    _count: { id: true },
  })
  const ids = data.map((d) => d.categoryId).filter(Boolean) as string[]
  const categories = await prisma.category.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, color: true },
  })
  const map = new Map(categories.map((c) => [c.id, c]))
  return data
    .map((d) => {
      const c = d.categoryId ? map.get(d.categoryId) : null
      return {
        categoryId: d.categoryId ?? 'null',
        categoryName: c?.name ?? 'Chưa phân loại',
        color: c?.color ?? '#94a3b8',
        count: d._count.id,
      }
    })
    .sort((a, b) => b.count - a.count)
}

async function getExpiringLicenses(withinDays = 60, limit = 10): Promise<ExpiringLicense[]> {
  const now = new Date()
  const horizon = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000)
  const licenses = await prisma.license.findMany({
    where: {
      deletedAt: null,
      expirationDate: { not: null, gte: now, lte: horizon },
      terminationDate: null,
    },
    orderBy: { expirationDate: 'asc' },
    take: limit,
    include: {
      _count: { select: { seats: true } },
      seats: {
        where: { deletedAt: null },
        select: { assignedUserId: true, assignedAssetId: true },
      },
    },
  })
  return licenses.map((l) => {
    const totalSeats = l._count.seats
    const usedSeats = l.seats.filter((s) => s.assignedUserId || s.assignedAssetId).length
    const daysUntil = l.expirationDate
      ? Math.ceil((new Date(l.expirationDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : 0
    return {
      licenseId: l.id,
      name: l.name,
      expirationDate: l.expirationDate?.toISOString() ?? '',
      daysUntil,
      totalSeats,
      usedSeats,
    }
  })
}

export default async function ReportsPage() {
  try {
    await requirePermission('reports.view')
  } catch {
    redirect('/')
  }

  const [counters, statusBuckets, categoryBuckets, expiring] = await Promise.all([
    getCounters(),
    getStatusBuckets(),
    getCategoryBuckets(),
    getExpiringLicenses(60, 10),
  ])

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="w-7 h-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo</h1>
          <p className="text-gray-500 text-sm">
            Thống kê tổng quan tài sản, license sắp hết hạn.
          </p>
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<Database className="w-5 h-5" />} label="Tổng tài sản" value={counters.totalAssets} accent="bg-blue-50 text-blue-700" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Sẵn sàng cấp" value={counters.availableAssets} accent="bg-emerald-50 text-emerald-700" />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Đang cấp phát" value={counters.checkedOutAssets} accent="bg-amber-50 text-amber-700" />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} label="Pending" value={counters.pendingAssets} accent="bg-purple-50 text-purple-700" />
        <StatCard icon={<Database className="w-5 h-5" />} label="Người dùng" value={counters.totalUsers} accent="bg-indigo-50 text-indigo-700" />
        <StatCard icon={<Database className="w-5 h-5" />} label="Bản quyền" value={counters.totalLicenses} accent="bg-rose-50 text-rose-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart by status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Tài sản theo Trạng thái</h2>
          <StatusBarChart data={statusBuckets} />
        </div>

        {/* Pie chart by category */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Phân bố tài sản theo Danh mục</h2>
          <CategoryPieChart data={categoryBuckets} />
        </div>
      </div>

      {/* Top 10 licenses expiring */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-4">Top 10 bản quyền sắp hết hạn (60 ngày tới)</h2>
        <LicenseExpiringTable data={expiring} />
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: number
  accent: string
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <div className={`inline-flex p-2 rounded-lg ${accent}`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
