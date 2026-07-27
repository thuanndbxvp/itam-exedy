'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Pagination from '@/components/ui/Pagination'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface Log {
  id: string
  actionType: string
  itemType: string
  itemId: string
  targetType: string | null
  targetId: string | null
  notes: string | null
  createdAt: string
  user: { firstName: string; lastName: string | null } | null
}

interface User {
  id: string
  firstName: string
  lastName: string | null
}

interface AuditLogTableProps {
  logs: Log[]
  users: User[]
  currentPage: number
  totalPages: number
  totalItems: number
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  CHECKOUT: 'bg-purple-100 text-purple-700',
  CHECKIN: 'bg-orange-100 text-orange-700',
  DELETE: 'bg-red-100 text-red-700',
  AUDIT: 'bg-yellow-100 text-yellow-700',
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  CHECKOUT: 'Cấp phát',
  CHECKIN: 'Thu hồi',
  DELETE: 'Xóa',
  AUDIT: 'Kiểm kê',
  RESTORE: 'Khôi phục',
  NOTE_ADDED: 'Ghi chú',
  ACCEPTED: 'Chấp nhận',
  DECLINED: 'Từ chối',
}

export default function AuditLogTable({
  logs,
  users,
  currentPage,
  totalPages,
  totalItems,
}: AuditLogTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [filters, setFilters] = useState({
    actionType: searchParams.get('actionType') ?? '',
    itemType: searchParams.get('itemType') ?? '',
    userId: searchParams.get('userId') ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  })

  function applyFilters() {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    params.set('page', '1')
    router.push(`/audit-log?${params.toString()}`)
  }

  function clearFilters() {
    setFilters({ actionType: '', itemType: '', userId: '', from: '', to: '' })
    router.push('/audit-log')
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-3">
          <select
            value={filters.actionType}
            onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tất cả hành động</option>
            <option value="CREATE">Tạo mới</option>
            <option value="UPDATE">Cập nhật</option>
            <option value="CHECKOUT">Cấp phát</option>
            <option value="CHECKIN">Thu hồi</option>
            <option value="DELETE">Xóa</option>
          </select>

          <select
            value={filters.itemType}
            onChange={(e) => setFilters({ ...filters, itemType: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tất cả loại</option>
            <option value="ASSET">Tài sản</option>
            <option value="LICENSE">License</option>
            <option value="USER">Người dùng</option>
          </select>

          <select
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tất cả người dùng</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName}{u.lastName ? ' ' + u.lastName : ''}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />

          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />

          <button
            onClick={applyFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition font-medium"
          >
            Lọc
          </button>

          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition font-medium"
          >
            Xóa
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hành động</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Loại</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Người thực hiện</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: vi })}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[log.actionType] ?? 'bg-gray-100 text-gray-700'}`}>
                    {ACTION_LABELS[log.actionType] ?? log.actionType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.itemType}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {log.user
                    ? `${log.user.firstName}${log.user.lastName ? ' ' + log.user.lastName : ''}`
                    : 'System'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{log.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          Không có nhật ký nào
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={20}
      />
    </div>
  )
}
