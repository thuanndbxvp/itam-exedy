import prisma from '@/lib/prisma'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Plus, Key, Edit2, Archive, ExternalLink } from 'lucide-react'
import LicenseFilterBar from '@/components/licenses/LicenseFilterBar'
import ExportLicensesButton from '@/components/licenses/ExportLicensesButton'

/**
 * F9 fix (security audit): mask productKey cho non-ADMIN.
 */
function maskProductKey(key: string | null): string {
  if (!key) return ''
  const cleaned = key.replace(/[^a-zA-Z0-9]/g, '')
  const last4 = cleaned.slice(-4)
  return `••••-••••-••••-${last4}`
}

type LicenseStatusFilter = 'all' | 'active' | 'expiring_soon' | 'expired' | 'terminated'

const VALID_STATUSES: ReadonlySet<LicenseStatusFilter> = new Set([
  'all',
  'active',
  'expiring_soon',
  'expired',
  'terminated',
])

function buildStatusWhere(status: LicenseStatusFilter): Record<string, unknown> {
  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  switch (status) {
    case 'active':
      return {
        OR: [
          { expirationDate: null },
          { expirationDate: { gte: now } },
        ],
        terminationDate: null,
      }
    case 'expiring_soon':
      return {
        expirationDate: { gte: now, lte: thirtyDays },
        terminationDate: null,
      }
    case 'expired':
      return {
        expirationDate: { lt: now },
        terminationDate: null,
      }
    case 'terminated':
      return { terminationDate: { not: null } }
    default:
      return {}
  }
}

type LicensesPageProps = {
  searchParams: Promise<{
    search?: string
    status?: string
  }>
}

export default async function LicensesPage({ searchParams }: LicensesPageProps) {
  // F7 fix (security audit): EMPLOYEE chỉ thấy license có seat của mình.
  // F9 fix (security audit): mask productKey cho non-ADMIN.
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  const role = session?.user?.role
  const isAdmin = role === 'ADMIN'
  const isEmployee = role === 'EMPLOYEE'

  const params = await searchParams
  const rawSearch = (params.search ?? '').trim()
  const rawStatus = (params.status ?? 'all') as LicenseStatusFilter
  const status: LicenseStatusFilter = VALID_STATUSES.has(rawStatus) ? rawStatus : 'all'
  const hasFilter = rawSearch.length > 0 || status !== 'all'

  const licenses = await prisma.license.findMany({
    where: {
      AND: [
        { deletedAt: null },
        ...(isEmployee && userId
          ? [{ seats: { some: { assignedUserId: userId, deletedAt: null } } }]
          : []),
        ...(rawSearch.length > 0
          ? [{ name: { contains: rawSearch, mode: 'insensitive' as const } }]
          : []),
        ...(status !== 'all' ? [buildStatusWhere(status)] : []),
      ],
    },
    include: { seats: { where: { deletedAt: null } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <LicenseFilterBar initialSearch={rawSearch} initialStatus={status} />

        <div className="flex items-center gap-2 flex-wrap">
          <ExportLicensesButton
            searchParams={new URLSearchParams({ ...(rawSearch && { search: rawSearch }), ...(status !== 'all' && { status }) })}
            canExport={isAdmin}
          />
          {isAdmin && (
            <Link
              href="/licenses/new"
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition shadow-sm font-medium whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm Bản Quyền</span>
            </Link>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {hasFilter && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Đang lọc:</span>
          {rawSearch && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
              Tìm: <strong>“{rawSearch}”</strong>
            </span>
          )}
          {status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
              Trạng thái: <strong>{statusLabel(status)}</strong>
            </span>
          )}
          <Link
            href="/licenses"
            className="text-gray-500 hover:text-gray-800 underline underline-offset-2"
          >
            Xóa bộ lọc
          </Link>
        </div>
      )}

      {/* Data Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-gray-100 text-gray-500">
                <th className="px-6 py-4 font-medium whitespace-nowrap">Tên Phần mềm</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Product Key</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap text-center">Tổng License (Seats)</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Trạng thái</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Ngày tạo</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {licenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Archive className="w-10 h-10 text-gray-300" />
                      <p>
                        {hasFilter
                          ? 'Không có license nào khớp bộ lọc.'
                          : isEmployee
                            ? 'Bạn hiện chưa được cấp license nào.'
                            : 'Chưa có bản quyền phần mềm nào. Hãy thêm mới!'}
                      </p>
                      {hasFilter && (
                        <Link
                          href="/licenses"
                          className="text-indigo-600 hover:underline text-sm"
                        >
                          Xóa bộ lọc
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                licenses.map(lic => {
                  const licStatus = deriveStatus(lic.expirationDate, lic.terminationDate)
                  return (
                    <tr key={lic.id} className="hover:bg-slate-50/50 transition group">
                      {/* Cột 1 — Epic D: bọc tên license thành Link tới /licenses/[id] */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/licenses/${lic.id}`}
                          className="flex items-center space-x-3 group/link"
                        >
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover/link:bg-indigo-100 transition">
                            <Key className="w-5 h-5" />
                          </div>
                          <p className="font-semibold text-gray-900 group-hover:text-indigo-600 group-hover/link:text-indigo-600 transition-colors flex items-center space-x-1">
                            <span>{lic.name}</span>
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition" />
                          </p>
                        </Link>
                      </td>

                      {/* Cột 2 — F9 fix: mask productKey cho non-ADMIN */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                          {lic.productKey
                            ? isAdmin
                              ? lic.productKey
                              : maskProductKey(lic.productKey)
                            : 'Không áp dụng'}
                        </span>
                      </td>

                      {/* Cột 3 — ĐỔI từ seatsTotal → seats.length */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-full bg-slate-100 font-bold text-slate-700">
                          {lic.seats?.length ?? 0}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          tổng ghế
                        </p>
                      </td>

                      {/* Cột 4 — derived status badge */}
                      <td className="px-6 py-4">
                        <StatusBadge status={licStatus} />
                      </td>

                      {/* Cột 5 — giữ nguyên */}
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(lic.createdAt).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Cột 6 */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isAdmin && (
                            <Link
                              href={`/licenses/${lic.id}/edit`}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Sửa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Link>
                          )}
                          <Link
                            href={`/licenses/${lic.id}`}
                            className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
                            title="Chi tiết"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Hiển thị <span className="font-medium text-gray-900">{licenses.length}</span> bản quyền
            {hasFilter && <span className="text-gray-400"> (đã lọc)</span>}
          </span>
          <div className="flex space-x-2">
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm" disabled>Trước</button>
            <button className="px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm" disabled>Sau</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function statusLabel(s: LicenseStatusFilter): string {
  switch (s) {
    case 'active': return 'Đang hoạt động'
    case 'expiring_soon': return 'Sắp hết hạn'
    case 'expired': return 'Đã hết hạn'
    case 'terminated': return 'Đã thanh lý'
    default: return 'Tất cả'
  }
}

export type DerivedLicenseStatus = 'active' | 'expiring_soon' | 'expired' | 'terminated' | 'no_expiry'

export function deriveStatus(
  expirationDate: Date | string | null,
  terminationDate: Date | string | null
): DerivedLicenseStatus {
  if (terminationDate) return 'terminated'
  if (!expirationDate) return 'no_expiry'
  const exp = expirationDate instanceof Date ? expirationDate : new Date(expirationDate)
  const now = new Date()
  if (exp < now) return 'expired'
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (exp <= thirtyDays) return 'expiring_soon'
  return 'active'
}

function StatusBadge({ status }: { status: DerivedLicenseStatus }) {
  const config: Record<DerivedLicenseStatus, { label: string; className: string }> = {
    active: { label: 'Đang hoạt động', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    expiring_soon: { label: 'Sắp hết hạn', className: 'bg-amber-50 text-amber-700 border-amber-100' },
    expired: { label: 'Đã hết hạn', className: 'bg-rose-50 text-rose-700 border-rose-100' },
    terminated: { label: 'Đã thanh lý', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    no_expiry: { label: 'Không thời hạn', className: 'bg-sky-50 text-sky-700 border-sky-100' },
  }
  const c = config[status]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${c.className}`}>
      {c.label}
    </span>
  )
}
