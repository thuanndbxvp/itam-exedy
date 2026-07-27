'use client'

/**
 * EmployeeDashboard — Phase 1 F10 fix.
 *
 * Giao diện tối giản cho EMPLOYEE: chỉ hiển thị
 *  - Tài sản đang mượn
 *  - License đang dùng
 *  - Nút Tạo Ticket Helpdesk
 *
 * KHÔNG gọi /api/reports/* — endpoint này giờ đã gate reports.view
 * (EMPLOYEE không có quyền → 403). Dùng /api/helpdesk/my-assets (đã filter
 * ownership) + /api/tickets?myOnly=true.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Monitor, Key, Ticket, Plus, ExternalLink } from 'lucide-react'

interface MyAsset {
  id: string
  assetTag: string
  name: string
  modelName: string | null
  categoryName: string | null
}

interface MySeat {
  id: string
  licenseId: string
  licenseName: string
}

interface MyTicket {
  id: string
  code: string
  title: string
  state: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
}

interface MyAssetsResponse {
  assets: MyAsset[]
  licenseSeats: MySeat[]
}

export default function EmployeeDashboard({ firstName }: { firstName: string }) {
  const [assets, setAssets] = useState<MyAsset[]>([])
  const [seats, setSeats] = useState<MySeat[]>([])
  const [tickets, setTickets] = useState<MyTicket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/helpdesk/my-assets', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/tickets?myOnly=true', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([assetsRes, ticketsRes]) => {
        if (assetsRes?.ok) {
          setAssets(assetsRes.data?.assets ?? [])
          setSeats(assetsRes.data?.licenseSeats ?? [])
        }
        if (ticketsRes?.ok) {
          setTickets(ticketsRes.data?.slice(0, 5) ?? [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Chào mừng, {firstName}!
          </h2>
          <p className="text-gray-500 mt-2">
            Dưới đây là các tài sản và license công ty đang cấp cho bạn.
          </p>
        </div>
        <Link
          href="/tickets/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
        >
          <Plus size={18} />
          Tạo Ticket Helpdesk
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Monitor className="w-5 h-5 text-blue-600" />}
          label="Tài sản đang mượn"
          value={loading ? '…' : assets.length}
          accent="bg-blue-50"
        />
        <StatCard
          icon={<Key className="w-5 h-5 text-indigo-600" />}
          label="License đang dùng"
          value={loading ? '…' : seats.length}
          accent="bg-indigo-50"
        />
        <StatCard
          icon={<Ticket className="w-5 h-5 text-amber-600" />}
          label="Ticket của tôi (đang mở)"
          value={loading ? '…' : tickets.filter((t) => t.state !== 'CLOSED' && t.state !== 'RESOLVED').length}
          accent="bg-amber-50"
        />
      </div>

      {/* Asset list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <Monitor className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Tài sản của tôi</h3>
          </div>
          <Link href="/assets" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Xem tất cả →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải…</div>
          ) : assets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Bạn hiện chưa được cấp tài sản nào.
            </div>
          ) : (
            assets.slice(0, 5).map((a) => (
              <Link
                key={a.id}
                href={`/assets/${a.id}`}
                className="block p-5 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {a.assetTag}
                      {a.modelName ? ` • ${a.modelName}` : ''}
                      {a.categoryName ? ` • ${a.categoryName}` : ''}
                    </p>
                  </div>
                  <ExternalLink size={14} className="text-gray-400" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Licenses */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <Key className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">License của tôi</h3>
          </div>
          <Link href="/licenses" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Xem tất cả →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải…</div>
          ) : seats.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Bạn hiện chưa được cấp license nào.
            </div>
          ) : (
            seats.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                href={`/licenses/${s.licenseId}`}
                className="block p-5 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{s.licenseName}</p>
                  <ExternalLink size={14} className="text-gray-400" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* My tickets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <Ticket className="w-5 h-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Ticket gần đây của tôi</h3>
          </div>
          <Link href="/tickets/my" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Xem tất cả →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải…</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Bạn chưa tạo ticket nào.{' '}
              <Link href="/tickets/new" className="text-blue-600 font-medium hover:underline">
                Tạo ticket đầu tiên
              </Link>
              .
            </div>
          ) : (
            tickets.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="block p-5 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-500">{t.code}</p>
                    <p className="text-sm text-gray-900 truncate">{t.title}</p>
                  </div>
                  <StateBadge state={t.state} />
                </div>
              </Link>
            ))
          )}
        </div>
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
  value: number | string
  accent: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center space-x-4">
      <div className={`w-12 h-12 rounded-xl ${accent} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function StateBadge({ state }: { state: MyTicket['state'] }) {
  const styles = {
    OPEN: 'bg-amber-100 text-amber-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    RESOLVED: 'bg-emerald-100 text-emerald-700',
    CLOSED: 'bg-gray-100 text-gray-600',
  } as const
  const labels = {
    OPEN: 'Mở',
    IN_PROGRESS: 'Đang xử lý',
    RESOLVED: 'Đã giải quyết',
    CLOSED: 'Đã đóng',
  } as const
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[state]}`}>
      {labels[state]}
    </span>
  )
}
