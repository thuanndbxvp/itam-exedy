'use client'

/**
 * LicenseExpiryAlert — Widget cảnh báo License sắp hết hạn.
 *
 * Fetch /api/admin/alerts, hiển thị:
 *   - Đếm tổng
 *   - Danh sách license với badge màu (đỏ đã hết hạn, cam < 7 ngày, vàng < 30 ngày)
 *   - Click row → link tới /licenses/[id]
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Key, AlertTriangle, Clock, ExternalLink, RefreshCw } from 'lucide-react'

interface ExpiringLicense {
  id: string
  name: string
  expirationDate: string | null
  daysUntilExpiry: number | null
  seatCount: number
  maintained: boolean
}

interface AlertsResponse {
  expiringLicenses: ExpiringLicense[]
  summary: { expiringLicenseCount: number }
}

function urgency(daysUntil: number | null): 'expired' | 'urgent' | 'soon' | 'normal' {
  if (daysUntil == null) return 'normal'
  if (daysUntil < 0) return 'expired'
  if (daysUntil <= 7) return 'urgent'
  if (daysUntil <= 30) return 'soon'
  return 'normal'
}

const URGENCY_STYLE: Record<ReturnType<typeof urgency>, { dot: string; text: string; bg: string; label: string }> = {
  expired: { dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', label: 'Đã hết hạn' },
  urgent: { dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', label: 'Khẩn cấp' },
  soon: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Sắp hết hạn' },
  normal: { dot: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', label: 'Sắp hết hạn' },
}

function fmtDays(days: number | null): string {
  if (days == null) return '—'
  if (days < 0) return `Quá ${Math.abs(days)} ngày`
  if (days === 0) return 'Hết hạn hôm nay'
  return `Còn ${days} ngày`
}

export default function LicenseExpiryAlert() {
  const [data, setData] = useState<AlertsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/alerts', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setData(j.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Key className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">License sắp hết hạn</h3>
            <p className="text-xs text-gray-500 mt-0.5">Trong vòng 30 ngày tới</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              {data.summary.expiringLicenseCount}
            </span>
          )}
          <button
            onClick={() => {
              setLoading(true)
              fetch('/api/admin/alerts', { credentials: 'include' })
                .then((r) => r.json())
                .then((j) => {
                  if (j?.ok) setData(j.data)
                  setLoading(false)
                })
            }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition"
            title="Tải lại"
          >
            <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div>
        {loading && !data ? (
          <div className="p-8 text-center text-gray-500 text-sm">Đang tải…</div>
        ) : !data || data.expiringLicenses.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">Không có license nào sắp hết hạn.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {data.expiringLicenses.map((l) => {
              const u = urgency(l.daysUntilExpiry)
              const s = URGENCY_STYLE[u]
              return (
                <li key={l.id}>
                  <Link
                    href={`/licenses/${l.id}`}
                    className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition group"
                  >
                    <span className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">{l.name}</p>
                        {u === 'expired' && (
                          <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-xs ${s.text} mt-0.5`}>
                        {s.label} · {fmtDays(l.daysUntilExpiry)} · {l.seatCount} ghế
                        {!l.maintained && ' · Không gia hạn'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {l.expirationDate
                        ? new Date(l.expirationDate).toLocaleDateString('vi-VN')
                        : '—'}
                    </span>
                    <ExternalLink
                      size={14}
                      className="text-gray-300 group-hover:text-gray-500 transition"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}