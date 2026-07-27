'use client'

/**
 * ItCostsClient — Sprint C.1.
 *
 * Báo cáo chi phí IT với:
 *  - Date range picker + presets (Tháng này / Quý này / Năm nay)
 *  - 4 summary cards (Tài sản / Bản quyền / Bảo trì / Tổng)
 *  - Pie chart tỷ trọng 3 loại chi phí (recharts)
 *  - Bảng chi tiết hỗn hợp sort theo ngày desc
 */

import { useState, useEffect } from 'react'
import {
  Loader2,
  DollarSign,
  Package,
  KeyRound,
  Wrench,
  Calendar,
  Filter,
  Download,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface CostRow {
  id: string
  date: string
  type: 'ASSET' | 'LICENSE' | 'MAINTENANCE'
  description: string
  amount: number
}

interface ReportData {
  range: { startDate: string; endDate: string }
  summary: {
    assetCost: number
    licenseCost: number
    maintenanceCost: number
    totalCost: number
  }
  details: CostRow[]
}

type Preset = 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_QUARTER' | 'THIS_YEAR' | 'CUSTOM'

function vnd(n: number): string {
  if (Number.isNaN(n) || n === 0) return '0 ₫'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n)
}

function computeRange(preset: Preset, customStart?: string, customEnd?: string) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  if (preset === 'THIS_MONTH') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (preset === 'LAST_MONTH') {
    start.setMonth(now.getMonth() - 1)
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    end.setDate(0) // last day of previous month
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  if (preset === 'THIS_QUARTER') {
    const q = Math.floor(now.getMonth() / 3) * 3
    start.setMonth(q)
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  if (preset === 'THIS_YEAR') {
    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }
  // CUSTOM
  if (customStart && customEnd) {
    const s = new Date(customStart)
    const e = new Date(customEnd)
    e.setHours(23, 59, 59, 999)
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) return { start: s, end: e }
  }
  // Fallback: 90 days ago
  start.setDate(now.getDate() - 90)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

const TYPE_META: Record<CostRow['type'], { label: string; color: string; icon: typeof Package }> = {
  ASSET: { label: 'Mua tài sản', color: '#3b82f6', icon: Package },
  LICENSE: { label: 'Mua bản quyền', color: '#8b5cf6', icon: KeyRound },
  MAINTENANCE: { label: 'Bảo trì / Sửa chữa', color: '#f59e0b', icon: Wrench },
}

const PRESET_LABELS: Record<Preset, string> = {
  THIS_MONTH: 'Tháng này',
  LAST_MONTH: 'Tháng trước',
  THIS_QUARTER: 'Quý này',
  THIS_YEAR: 'Năm nay',
  CUSTOM: 'Tùy chọn',
}

export default function ItCostsClient() {
  const [preset, setPreset] = useState<Preset>('THIS_MONTH')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const { start, end } = computeRange(preset, customStart, customEnd)
    setLoading(true)
    setError(null)
    const url = `/api/reports/it-costs?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
    fetch(url, { cache: 'no-store' })
      .then(async (r) => {
        const text = await r.text()
        if (!text) throw new Error('Empty response')
        const json = JSON.parse(text)
        if (json.ok) {
          setData(json.data)
        } else {
          setError(json.message ?? 'Lỗi tải dữ liệu.')
        }
      })
      .catch((e) => setError((e as Error).message ?? 'Lỗi kết nối.'))
      .finally(() => setLoading(false))
  }, [preset, customStart, customEnd])
  /* eslint-enable react-hooks/set-state-in-effect */

  const summary = data?.summary ?? {
    assetCost: 0,
    licenseCost: 0,
    maintenanceCost: 0,
    totalCost: 0,
  }
  const details = data?.details ?? []
  const range = data?.range

  const pieData = [
    { name: TYPE_META.ASSET.label, value: summary.assetCost, color: TYPE_META.ASSET.color },
    { name: TYPE_META.LICENSE.label, value: summary.licenseCost, color: TYPE_META.LICENSE.color },
    { name: TYPE_META.MAINTENANCE.label, value: summary.maintenanceCost, color: TYPE_META.MAINTENANCE.color },
  ].filter((d) => d.value > 0)

  function exportCSV() {
    if (!details.length) return
    const headers = ['Ngày', 'Loại', 'Mô tả', 'Số tiền (VND)']
    const lines = details.map((d) => [
      new Date(d.date).toLocaleString('vi-VN'),
      TYPE_META[d.type].label,
      `"${d.description.replace(/"/g, '""')}"`,
      String(d.amount),
    ])
    const csv = [headers.join(','), ...lines.map((l) => l.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `it-costs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <DollarSign className="w-7 h-7 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Báo cáo Chi phí IT</h1>
            <p className="text-gray-500 text-sm">
              Tổng hợp chi phí mua tài sản, bản quyền và bảo trì trong kỳ.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={exportCSV}
          disabled={!details.length}
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Khoảng thời gian:</span>
          {(Object.keys(PRESET_LABELS) as Preset[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition ${
                preset === p
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              {PRESET_LABELS[p]}
            </button>
          ))}
        </div>

        {preset === 'CUSTOM' && (
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar size={14} className="text-gray-500" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
            />
            <span className="text-gray-500">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        )}

        {range && (
          <p className="text-xs text-gray-500 md:ml-auto">
            {new Date(range.startDate).toLocaleDateString('vi-VN')} →{' '}
            {new Date(range.endDate).toLocaleDateString('vi-VN')}
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Mua tài sản"
          icon={<Package size={18} />}
          value={summary.assetCost}
          accent="bg-blue-50 text-blue-700"
        />
        <SummaryCard
          label="Mua bản quyền"
          icon={<KeyRound size={18} />}
          value={summary.licenseCost}
          accent="bg-purple-50 text-purple-700"
        />
        <SummaryCard
          label="Bảo trì / Sửa chữa"
          icon={<Wrench size={18} />}
          value={summary.maintenanceCost}
          accent="bg-amber-50 text-amber-700"
        />
        <SummaryCard
          label="Tổng chi phí IT"
          icon={<DollarSign size={18} />}
          value={summary.totalCost}
          accent="bg-emerald-50 text-emerald-700"
          highlight
        />
      </div>

      {loading && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin mr-2" />
          Đang tải dữ liệu...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pie chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
            <h2 className="font-semibold text-gray-900 mb-4">Tỷ trọng chi phí</h2>
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Chưa có dữ liệu.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => vnd(Number(value ?? 0))}
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Details table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Chi tiết các khoản chi ({details.length})
              </h2>
            </div>
            {details.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">
                Không có khoản chi nào trong khoảng thời gian đã chọn.
              </p>
            ) : (
              <div className="max-h-[480px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-600 uppercase sticky top-0">
                    <tr>
                      <th className="text-left px-4 py-2">Ngày</th>
                      <th className="text-left px-4 py-2">Loại</th>
                      <th className="text-left px-4 py-2">Mô tả</th>
                      <th className="text-right px-4 py-2">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map((d) => {
                      const meta = TYPE_META[d.type]
                      const Icon = meta.icon
                      return (
                        <tr
                          key={`${d.type}-${d.id}`}
                          className="border-t border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-gray-600 text-xs">
                            {new Date(d.date).toLocaleString('vi-VN')}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                              style={{
                                color: meta.color,
                                background: `${meta.color}15`,
                              }}
                            >
                              <Icon size={12} />
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-900">{d.description}</td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900 tabular-nums">
                            {vnd(d.amount)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface SummaryCardProps {
  label: string
  icon: React.ReactNode
  value: number
  accent: string
  highlight?: boolean
}

function SummaryCard({ label, icon, value, accent, highlight }: SummaryCardProps) {
  return (
    <div
      className={`bg-white p-4 rounded-2xl shadow-sm border ${
        highlight ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-100'
      }`}
    >
      <div className={`inline-flex p-2 rounded-lg ${accent}`}>{icon}</div>
      <p className="text-xl lg:text-2xl font-bold text-gray-900 mt-3 tabular-nums">
        {vnd(value)}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
