'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Pagination from '@/components/ui/Pagination'
import JsonDiff from '@/components/audit/JsonDiff'
import type { Prisma } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ChevronRight, ExternalLink } from 'lucide-react'

interface Log {
  id: string
  actionType: string
  itemType: string
  itemId: string
  targetType: string | null
  targetId: string | null
  notes: string | null
  oldValues: Prisma.JsonValue
  newValues: Prisma.JsonValue
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

/**
 * Map itemType → URL để drill-down từ Audit Log row sang entity detail page.
 * Source: MSEW-A2-audit-log-diff.md Bước 2.
 */
function getEntityLink(type: string, id: string): string | null {
  switch (type) {
    case 'USER':
      return `/settings/users/${id}`
    case 'ASSET':
      return `/assets/${id}`
    case 'LICENSE':
      return `/licenses/${id}`
    case 'CATEGORY':
      return `/settings/categories/${id}`
    case 'LOCATION':
      return `/settings/locations/${id}`
    case 'DEPARTMENT':
      return `/settings/departments/${id}`
    case 'STATUS':
      return `/settings/statuses/${id}`
    case 'STATUS_LABEL':
      return `/settings/statuses/${id}`
    case 'ROLE':
      return `/settings/permissions/${id}`
    case 'CUSTOM_ROLE':
      return `/settings/permissions/${id}`
    case 'TEAM':
      return `/helpdesk/teams/${id}`
    case 'TICKET':
      return `/helpdesk/${id}`
    case 'COMPANY':
      return `/settings/companies/${id}`
    case 'SUPPLIER':
      return `/settings/suppliers/${id}`
    case 'MANUFACTURER':
      return `/settings/manufacturers/${id}`
    case 'ASSET_MODEL':
      return `/settings/asset-models/${id}`
    default:
      return null
  }
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

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

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function expandAll() {
    setExpandedIds(new Set(logs.map((l) => l.id)))
  }

  function collapseAll() {
    setExpandedIds(new Set())
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
            <option value="TICKET">Ticket</option>
          </select>

          <select
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Tất cả người dùng</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName}
                {u.lastName ? ' ' + u.lastName : ''}
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

          <div className="ml-auto flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg border border-gray-200 transition"
              title="Mở rộng tất cả diff"
            >
              Mở rộng
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg border border-gray-200 transition"
              title="Thu gọn tất cả"
            >
              Thu gọn
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 w-8" aria-label="Mở rộng" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Thời gian
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Hành động
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Đối tượng
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Người thực hiện
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Ghi chú
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => {
              const isExpanded = expandedIds.has(log.id)
              const entityLink = getEntityLink(log.itemType, log.itemId)
              const hasDiff =
                log.oldValues !== null || log.newValues !== null
              return (
                <>
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => hasDiff && toggleExpand(log.id)}
                  >
                    <td className="px-2 py-3 text-center">
                      {hasDiff && (
                        <ChevronRight
                          size={14}
                          className={`text-gray-400 inline-block transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          ACTION_COLORS[log.actionType] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {ACTION_LABELS[log.actionType] ?? log.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {entityLink ? (
                        <Link
                          href={entityLink}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline font-mono text-xs"
                        >
                          <span className="font-sans font-medium">{log.itemType}</span>
                          <span>·</span>
                          <span>{log.itemId.slice(0, 8)}</span>
                          <ExternalLink size={11} />
                        </Link>
                      ) : (
                        <span className="text-gray-500 text-xs">
                          {log.itemType} · {log.itemId.slice(0, 8)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {log.user
                        ? `${log.user.firstName}${
                            log.user.lastName ? ' ' + log.user.lastName : ''
                          }`
                        : 'Hệ thống'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {log.notes ?? '—'}
                    </td>
                  </tr>
                  {isExpanded && hasDiff && (
                    <tr key={`${log.id}-diff`} className="bg-gray-50/50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Chi tiết thay đổi
                          </p>
                          <JsonDiff
                            oldValues={log.oldValues}
                            newValues={log.newValues}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
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
