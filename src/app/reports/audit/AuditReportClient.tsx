'use client'

/**
 * AuditReportClient — Sprint C.12
 *
 * Client Component:
 * - Fetch audit summary data
 * - Display counters and data table
 */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'

interface AuditAsset {
  id: string
  assetTag: string
  name: string
  nextAuditDate: string | null
  lastAuditDate: string | null
  status: 'overdue' | 'due_soon'
  assignedUser: {
    id: string
    name: string
    email: string | null
  } | null
}

interface AuditSummary {
  counters: { overdue: number; dueSoon: number; safe: number }
  assets: AuditAsset[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN')
}

function getStatusBadge(status: 'overdue' | 'due_soon') {
  if (status === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        <XCircle className="w-3 h-3" />
        Quá hạn
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
      <AlertTriangle className="w-3 h-3" />
      Sắp đến hạn
    </span>
  )
}

export default function AuditReportClient() {
  const [data, setData] = useState<AuditSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchData() {
    try {
      setLoading(true)
      const res = await fetch('/api/reports/audit-summary')
      const json = await res.json()
      if (json.ok) {
        setData(json.data)
      } else {
        setError(json.message || 'Lỗi khi tải dữ liệu')
      }
    } catch (e) {
      setError('Không thể kết nối server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
          Thử lại
        </button>
      </div>
    )
  }

  const { counters, assets } = data!

  return (
    <div className="space-y-6">
      {/* Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overdue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-red-600">{counters.overdue}</p>
              <p className="text-sm text-gray-500">Quá hạn kiểm kê</p>
            </div>
          </div>
        </div>

        {/* Due Soon */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-600">{counters.dueSoon}</p>
              <p className="text-sm text-gray-500">Sắp đến hạn (30 ngày)</p>
            </div>
          </div>
        </div>

        {/* Safe */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">{counters.safe}</p>
              <p className="text-sm text-gray-500">An toàn</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Tài sản cần kiểm kê ({assets.length})
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách tài sản quá hạn hoặc sắp đến hạn kiểm kê
          </p>
        </div>

        {assets.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-gray-500">Tất cả tài sản đều an toàn, không có gì cần kiểm kê!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tài sản</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mã thẻ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Người giữ</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kiểm kê cuối</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hạn tiếp theo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/assets/${asset.id}`} className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                        {asset.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{asset.assetTag}</td>
                    <td className="px-6 py-4">{getStatusBadge(asset.status)}</td>
                    <td className="px-6 py-4">
                      {asset.assignedUser ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">{asset.assignedUser.name}</p>
                          {asset.assignedUser.email && (
                            <p className="text-xs text-gray-500">{asset.assignedUser.email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(asset.lastAuditDate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(asset.nextAuditDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
