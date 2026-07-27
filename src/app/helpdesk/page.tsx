'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Filter, Loader2, LifeBuoy } from 'lucide-react'

interface Ticket {
  id: string
  code: string
  title: string
  type: string
  status: string
  priority: string
  category: string
  slaDueAt: string | null
  createdAt: string
  updatedAt: string
  reporter: { id: string; firstName: string; lastName: string | null }
  assignee: { id: string; firstName: string; lastName: string | null } | null
  team: { id: string; name: string; slug: string } | null
  reportedAsset: { id: string; assetTag: string; name: string } | null
  _count: { comments: number }
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'NEW', label: 'Mới' },
  { value: 'ASSIGNED', label: 'Đã giao' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'PENDING', label: 'Tạm chờ' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'CLOSED', label: 'Đã đóng' },
  { value: 'REJECTED', label: 'Bị từ chối' },
]

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  ASSIGNED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-cyan-100 text-cyan-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-600',
  REJECTED: 'bg-red-100 text-red-600',
}

const CATEGORY_LABELS: Record<string, string> = {
  HARDWARE: 'Phần cứng',
  SOFTWARE: 'Phần mềm',
  NETWORK: 'Mạng',
  ACCOUNT: 'Tài khoản',
  OTHER: 'Khác',
}

export default function HelpdeskPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

  const isIt = session?.user?.role === 'IT_STAFF' || session?.user?.role === 'IT_MANAGER' || session?.user?.role === 'ADMIN'

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const url = filterStatus ? `/api/tickets?status=${filterStatus}` : '/api/tickets'
        const r = await fetch(url, { cache: 'no-store' })
        const json = await r.json()
        if (json.ok) setTickets(json.data.tickets)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filterStatus])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LifeBuoy className="text-blue-600" />
            Helpdesk
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isIt
              ? 'Tất cả ticket hệ thống. Chuyển sang Hộp thư IT để xử lý.'
              : 'Danh sách yêu cầu hỗ trợ của bạn. Nhấn "Tạo ticket mới" để báo lỗi.'}
          </p>
        </div>
        <Link
          href="/helpdesk/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-sm transition"
        >
          <Plus size={16} />
          Tạo ticket mới
        </Link>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 flex items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500 ml-auto">{tickets.length} ticket</span>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 size={20} className="animate-spin mr-2" /> Đang tải...
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <LifeBuoy size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Chưa có ticket nào.</p>
            <Link
              href="/helpdesk/new"
              className="text-blue-600 hover:underline text-sm mt-2 inline-block"
            >
              Tạo ticket đầu tiên →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Phân loại</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">{isIt ? 'Người báo' : 'Phụ trách'}</th>
                <th className="px-4 py-3">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/helpdesk/${t.code}`)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">
                    {t.code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 line-clamp-1">{t.title}</div>
                    {t.reportedAsset && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        Asset: {t.reportedAsset.assetTag}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{CATEGORY_LABELS[t.category] ?? t.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded border ${
                        PRIORITY_COLORS[t.priority]
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                        STATUS_COLORS[t.status] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {isIt
                      ? `${t.reporter.firstName} ${t.reporter.lastName ?? ''}`
                      : t.assignee
                      ? `${t.assignee.firstName} ${t.assignee.lastName ?? ''}`
                      : t.team
                      ? t.team.name
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(t.updatedAt).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}