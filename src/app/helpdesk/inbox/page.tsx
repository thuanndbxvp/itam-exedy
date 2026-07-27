'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Inbox, Loader2, UserCheck } from 'lucide-react'

interface Ticket {
  id: string
  code: string
  title: string
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

type Tab = 'open' | 'mine' | 'all'

export default function InboxPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [tab, setTab] = useState<Tab>('open')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        let url = '/api/tickets'
        if (tab === 'open') url = '/api/tickets?status=NEW'
        else if (tab === 'mine') url = '/api/tickets?mine=1'
        const r = await fetch(url, { cache: 'no-store' })
        const json = await r.json()
        if (json.ok) setTickets(json.data.tickets)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tab])

  async function claim(t: Ticket) {
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

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'open', label: 'Chưa nhận (NEW)' },
    { id: 'mine', label: 'Của tôi' },
    { id: 'all', label: 'Tất cả' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Inbox className="text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hộp thư IT</h2>
          <p className="text-sm text-gray-500">
            Xin chào {session?.user?.firstName} — chọn ticket để xem chi tiết hoặc nhận xử lý.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
                tab === t.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 size={20} className="animate-spin mr-2" /> Đang tải...
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Inbox size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Không có ticket nào trong tab này.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Người báo</th>
                <th className="px-4 py-3">Phụ trách</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">SLA</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => {
                const slaMs = t.slaDueAt ? new Date(t.slaDueAt).getTime() - Date.now() : null
                const overdue = slaMs !== null && slaMs < 0
                return (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium">
                      <button
                        onClick={() => router.push(`/helpdesk/${t.code}`)}
                        className="hover:underline"
                      >
                        {t.code}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 line-clamp-1">{t.title}</div>
                      {t.reportedAsset && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {t.reportedAsset.assetTag} — {t.reportedAsset.name}
                        </div>
                      )}
                      <span
                        className={`inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          t.priority === 'URGENT'
                            ? 'bg-red-100 text-red-700'
                            : t.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {t.reporter.firstName} {t.reporter.lastName ?? ''}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {t.assignee
                        ? `${t.assignee.firstName} ${t.assignee.lastName ?? ''}`
                        : t.team
                        ? <span className="text-blue-600">{t.team.name}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{t.status}</td>
                    <td className="px-4 py-3">
                      {t.slaDueAt ? (
                        <span className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {new Date(t.slaDueAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.status === 'NEW' && !t.assignee && (
                        <button
                          onClick={() => claim(t)}
                          disabled={claiming === t.id}
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1 rounded text-xs font-medium"
                        >
                          <UserCheck size={12} />
                          Nhận
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}