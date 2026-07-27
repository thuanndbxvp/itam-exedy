'use client'

import Link from 'next/link'
import { Calendar, Building2, DollarSign, FileText, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Item {
  id: string
  title: string
  asset: { id: string; assetTag: string; name: string }
  supplier: { id: string; name: string } | null
  createdBy: { id: string; firstName: string; lastName: string | null } | null
  cost: number | null
  startDate: string | null
  completionDate: string | null
  notes: string | null
  createdAt: string
}

interface Props {
  items: Item[]
}

type DerivedStatus = 'pending' | 'in_progress' | 'completed'

function deriveStatus(startDate: string | null, completionDate: string | null): DerivedStatus {
  if (completionDate) return 'completed'
  if (!startDate) return 'pending'
  const now = new Date()
  if (new Date(startDate) > now) return 'pending'
  return 'in_progress'
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function fmtCost(c: number | null): string {
  if (c == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c)
}

const STATUS_BADGE: Record<DerivedStatus, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: 'Chưa bắt đầu', className: 'bg-slate-100 text-slate-600 border-slate-200', icon: AlertTriangle },
  in_progress: { label: 'Đang thực hiện', className: 'bg-amber-100 text-amber-700 border-amber-200', icon: Wrench },
  completed: { label: 'Hoàn thành', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
}

export default function MaintenanceTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Wrench size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Chưa có phiếu bảo trì nào.</p>
        <p className="text-xs text-gray-400 mt-2">
          Phiếu bảo trì được tạo từ trang chi tiết tài sản (tab "Lịch sử sửa chữa").
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-gray-100 text-gray-500">
              <th className="px-6 py-4 font-medium whitespace-nowrap">Tài sản</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Tiêu đề</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Nhà cung cấp</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Chi phí</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Bắt đầu</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Hoàn thành</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Trạng thái</th>
              <th className="px-6 py-4 font-medium whitespace-nowrap">Người tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((m) => {
              const st = deriveStatus(m.startDate, m.completionDate)
              const badge = STATUS_BADGE[st]
              const Icon = badge.icon
              return (
                <tr key={m.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <Link
                      href={`/assets/${m.asset.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                    >
                      {m.asset.assetTag}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{m.asset.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-1.5">
                      <span className="font-medium text-gray-900">{m.title}</span>
                    </div>
                    {m.notes && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-[200px]" title={m.notes}>
                        {m.notes}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {m.supplier ? (
                      <span className="inline-flex items-center gap-1">
                        <Building2 size={12} className="text-gray-400" />
                        {m.supplier.name}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">{fmtCost(m.cost)}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">{fmtDate(m.startDate)}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm whitespace-nowrap">{fmtDate(m.completionDate)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${badge.className}`}>
                      <Icon size={12} />
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {m.createdBy
                      ? `${m.createdBy.firstName}${m.createdBy.lastName ? ' ' + m.createdBy.lastName : ''}`
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}