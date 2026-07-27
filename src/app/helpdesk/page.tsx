'use client'

import { useEffect, useState, Suspense, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Filter, Loader2, LifeBuoy, UserCheck } from 'lucide-react'
import TicketFilterBar from '@/components/helpdesk/TicketFilterBar'

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

type Tab = 'mine' | 'new' | 'all'

function HelpdeskContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [assignees, setAssignees] = useState<{ id: string; firstName: string; lastName: string | null }[]>([])

  const isIt = session?.user?.role === 'IT_STAFF' || session?.user?.role === 'IT_MANAGER' || session?.user?.role === 'ADMIN'

  const initialTab = (searchParams.get('tab') as Tab) || (isIt ? 'mine' : 'all')
  const [tab, setTab] = useState<Tab>(initialTab)
  const [filterStatus, setFilterStatus] = useState('')

  // A6: priority / teamId / assigneeId tu URL
  const filterPriority = searchParams.get('priority') ?? ''
  const filterTeamId = searchParams.get('teamId') ?? ''
  const filterAssigneeId = searchParams.get('assigneeId') ?? ''

  // Fetch teams + assignees 1 lan cho filter bar (IT only)
  useEffect(() => {
    if (!isIt) return
    let cancelled = false
    Promise.all([
      fetch('/api/helpdesk-teams', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/admin/ticket-rules', { cache: 'no-store' }).then((r) => r.json()),
    ]).then(([tJson, rJson]) => {
      if (cancelled) return
      if (tJson.ok) setTeams(tJson.data)
      if (rJson.ok) setAssignees(rJson.data.users)
    }).catch(console.error)
    return () => { cancelled = true }
  }, [isIt])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let url = '/api/tickets'

        if (isIt) {
          if (tab === 'mine') {
            url = '/api/tickets?mine=1'
          } else if (tab === 'new') {
            url = '/api/tickets?status=NEW'
          } else if (tab === 'all') {
            const params = new URLSearchParams()
            if (filterStatus) params.set('status', filterStatus)
            if (filterPriority) params.set('priority', filterPriority)
            if (filterTeamId) params.set('teamId', filterTeamId)
            if (filterAssigneeId) params.set('assigneeId', filterAssigneeId)
            url = params.toString() ? `/api/tickets?${params.toString()}` : '/api/tickets'
          }
        } else {
          // Employee: status + filter
          const params = new URLSearchParams()
          if (filterStatus) params.set('status', filterStatus)
          if (filterPriority) params.set('priority', filterPriority)
          url = params.toString() ? `/api/tickets?${params.toString()}` : '/api/tickets'
        }

        const r = await fetch(url, { cache: 'no-store' })
        const json = await r.json()
        if (json.ok) setTickets(json.data.tickets)
      } finally {
        setLoading(false)
      }
    }
    if (session?.user?.role) {
      load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filterStatus, filterPriority, filterTeamId, filterAssigneeId, isIt, session?.user?.role])

  const handleTabChange = useCallback((newTab: Tab) => {
    setTab(newTab)
    const newParams = new URLSearchParams(searchParams.toString())
    newParams.set('tab', newTab)
    router.replace(`/helpdesk?${newParams.toString()}`)
  }, [searchParams, router])

  async function claim(t: Ticket, e: React.MouseEvent) {
    e.stopPropagation()
    setClaiming(t.id)
    try {
      const r = await fetch(`/api/tickets/${t.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'claim' }),
      })
      const json = await r.json()
      if (json.ok) {
        router.push(`/helpdesk/${t.code}`)
      } else {
        alert(json.message ?? 'Không thể nhận ticket.')
      }
    } finally {
      setClaiming(null)
    }
  }

  // Chỉ show filter bar khi tab 'all' (IT) hoặc luôn luôn (Employee)
  const showFilterBar = !isIt || tab === 'all'

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
              ? 'Trung tâm quản lý, tiếp nhận và xử lý yêu cầu hỗ trợ.'
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs for IT Staff */}
        {isIt && (
          <div className="border-b border-gray-200 flex px-2 bg-gray-50/50">
            <button
              onClick={() => handleTabChange('mine')}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition ${
                tab === 'mine'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Của tôi (Đang xử lý)
            </button>
            <button
              onClick={() => handleTabChange('new')}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition ${
                tab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Chưa nhận
            </button>
            <button
              onClick={() => handleTabChange('all')}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition ${
                tab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Toàn công ty (Tất cả)
            </button>
          </div>
        )}

        {/* Filter Bar (A6 — multi-filter via URL searchParams) */}
        {showFilterBar && (
          <div className="p-4 border-b border-gray-100 bg-gray-50/30 space-y-3">
            <TicketFilterBar
              teams={teams}
              assignees={assignees}
              showTeamFilter={isIt}
              showAssigneeFilter={isIt}
            />
            {isIt && (
              <div className="flex items-center gap-3">
                <Filter size={16} className="text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500 ml-auto">{tickets.length} ticket</span>
              </div>
            )}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 size={20} className="animate-spin mr-2" /> Đang tải...
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <LifeBuoy size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Chưa có ticket nào trong mục này.</p>
            {!isIt && (
              <Link
                href="/helpdesk/new"
                className="text-blue-600 hover:underline text-sm mt-2 inline-block"
              >
                Tạo ticket đầu tiên →
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3 min-w-[250px]">Tiêu đề</th>
                  <th className="px-4 py-3">Phân loại</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">{isIt ? 'Người báo' : 'Phụ trách'}</th>
                  <th className="px-4 py-3">{isIt ? 'SLA' : 'Cập nhật'}</th>
                  {isIt && tab === 'new' && <th className="px-4 py-3 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((t) => {
                  const slaMs = t.slaDueAt ? new Date(t.slaDueAt).getTime() - Date.now() : null
                  const overdue = slaMs !== null && slaMs < 0
                  
                  return (
                    <tr
                      key={t.id}
                      onClick={() => router.push(`/helpdesk/${t.code}`)}
                      className="hover:bg-gray-50 cursor-pointer transition group"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">
                        {t.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 line-clamp-1">{t.title}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                              PRIORITY_COLORS[t.priority]
                            }`}
                          >
                            {t.priority}
                          </span>
                          {t.reportedAsset && (
                            <span className="text-xs text-gray-500 truncate">
                              Asset: {t.reportedAsset.assetTag}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{CATEGORY_LABELS[t.category] ?? t.category}</td>
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
                        {isIt ? (
                          <span>{t.reporter.firstName} {t.reporter.lastName ?? ''}</span>
                        ) : (
                          t.assignee
                            ? <span>{t.assignee.firstName} {t.assignee.lastName ?? ''}</span>
                            : t.team
                            ? <span className="text-blue-600">{t.team.name}</span>
                            : <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {isIt ? (
                          t.slaDueAt ? (
                            <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {new Date(t.slaDueAt).toLocaleString('vi-VN', {
                                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                              })}
                            </span>
                          ) : <span className="text-gray-400">—</span>
                        ) : (
                          <span className="text-gray-500">
                            {new Date(t.updatedAt).toLocaleString('vi-VN', {
                              hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                            })}
                          </span>
                        )}
                      </td>
                      {isIt && tab === 'new' && (
                        <td className="px-4 py-3 text-right">
                          {!t.assignee && (
                            <button
                              onClick={(e) => claim(t, e)}
                              disabled={claiming === t.id}
                              className="inline-flex items-center gap-1 bg-white border border-gray-200 shadow-sm hover:border-blue-300 hover:text-blue-600 disabled:opacity-60 text-gray-600 px-3 py-1.5 rounded text-xs font-medium transition"
                            >
                              {claiming === t.id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                              Nhận vé
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function HelpdeskPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Đang tải Helpdesk...</div>}>
      <HelpdeskContent />
    </Suspense>
  )
}