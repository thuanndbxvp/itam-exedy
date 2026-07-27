'use client'

/**
 * AssetEolAlert — Widget cảnh báo Asset sắp tới EOL hoặc quá tuổi khấu hao.
 *
 * 2 sections:
 *  - "Sắp hết vòng đời" (EOL ≤ 60 ngày): red/orange dot, link tới asset detail.
 *  - "Đã quá tuổi khấu hao" (purchaseDate + depreciationMonths < now): gray dot, hint "cần nâng cấp".
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Monitor,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  TrendingDown,
} from 'lucide-react'

interface EolAsset {
  id: string
  assetTag: string
  name: string
  assetEolDate: string | null
  daysUntilEol: number | null
  categoryName: string | null
  purchaseDate: string | null
}

interface MaintenanceAsset {
  id: string
  assetTag: string
  name: string
  purchaseDate: string
  depreciationMonths: number
  ageMonths: number
}

interface AlertsResponse {
  eolAssets: EolAsset[]
  maintenanceDue: MaintenanceAsset[]
  summary: { eolAssetCount: number; maintenanceDueCount: number }
}

function urgency(daysUntil: number | null): 'expired' | 'urgent' | 'soon' | 'normal' {
  if (daysUntil == null) return 'normal'
  if (daysUntil < 0) return 'expired'
  if (daysUntil <= 30) return 'urgent'
  if (daysUntil <= 60) return 'soon'
  return 'normal'
}

const URGENCY_STYLE: Record<ReturnType<typeof urgency>, { dot: string; text: string; label: string }> = {
  expired: { dot: 'bg-red-500', text: 'text-red-700', label: 'Đã quá EOL' },
  urgent: { dot: 'bg-orange-500', text: 'text-orange-700', label: 'Sắp EOL' },
  soon: { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Cần theo dõi' },
  normal: { dot: 'bg-yellow-500', text: 'text-yellow-700', label: 'Sắp EOL' },
}

function fmtDays(days: number | null): string {
  if (days == null) return '—'
  if (days < 0) return `Quá ${Math.abs(days)} ngày`
  if (days === 0) return 'Hết hạn hôm nay'
  return `Còn ${days} ngày`
}

export default function AssetEolAlert() {
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

  const isEmpty =
    data && data.eolAssets.length === 0 && data.maintenanceDue.length === 0

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Tài sản cần nâng cấp</h3>
            <p className="text-xs text-gray-500 mt-0.5">EOL & tuổi khấu hao</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              {data.summary.eolAssetCount + data.summary.maintenanceDueCount}
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
        ) : isEmpty ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">Không có tài sản nào cần nâng cấp.</p>
          </div>
        ) : (
          <div>
            {/* Section 1: Sắp hết vòng đời */}
            {data && data.eolAssets.length > 0 && (
              <div>
                <div className="px-6 py-2 bg-gray-50/50 flex items-center gap-2">
                  <AlertTriangle size={12} className="text-red-500" />
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Sắp hết vòng đời ({data.eolAssets.length})
                  </span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {data.eolAssets.map((a) => {
                    const u = urgency(a.daysUntilEol)
                    const s = URGENCY_STYLE[u]
                    return (
                      <li key={a.id}>
                        <Link
                          href={`/assets/${a.id}`}
                          className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition group"
                        >
                          <span className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-gray-500">
                                {a.assetTag}
                              </span>
                              <p className="font-medium text-gray-900 truncate">{a.name}</p>
                            </div>
                            <p className={`text-xs ${s.text} mt-0.5`}>
                              {s.label} · {fmtDays(a.daysUntilEol)}
                              {a.categoryName ? ` · ${a.categoryName}` : ''}
                            </p>
                          </div>
                          <ExternalLink
                            size={14}
                            className="text-gray-300 group-hover:text-gray-500 transition"
                          />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* Section 2: Quá tuổi khấu hao */}
            {data && data.maintenanceDue.length > 0 && (
              <div>
                <div className="px-6 py-2 bg-gray-50/50 flex items-center gap-2 border-t border-gray-100">
                  <TrendingDown size={12} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Quá tuổi khấu hao ({data.maintenanceDue.length})
                  </span>
                </div>
                <ul className="divide-y divide-gray-50">
                  {data.maintenanceDue.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/assets/${a.id}`}
                        className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition group"
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-500">
                              {a.assetTag}
                            </span>
                            <p className="font-medium text-gray-900 truncate">{a.name}</p>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">
                            Đã dùng {a.ageMonths} tháng (khấu hao: {a.depreciationMonths} tháng)
                          </p>
                        </div>
                        <ExternalLink
                          size={14}
                          className="text-gray-300 group-hover:text-gray-500 transition"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}