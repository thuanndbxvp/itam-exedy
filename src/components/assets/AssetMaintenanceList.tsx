'use client'

/**
 * AssetMaintenanceList — Tab Lịch sử sửa chữa.
 *
 * - Liệt kê các phiếu sửa chữa của asset (fetch /api/assets/[id]/maintenances)
 * - Mỗi phiếu: title, supplier, cost, startDate → completionDate, notes, createdBy
 * - Nếu user có quyền assets.update, có nút "Thêm phiếu sửa chữa" → mở modal.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, Plus, Calendar, Building2, DollarSign, FileText, Trash2, User } from 'lucide-react'
import { useToast } from '@/components/Toast'
import AddMaintenanceModal from './AddMaintenanceModal'

interface Maintenance {
  id: string
  title: string
  cost: number | null
  startDate: string | null
  completionDate: string | null
  notes: string | null
  supplier: { id: string; name: string } | null
  createdBy: { id: string; firstName: string; lastName: string | null } | null
  createdAt: string
}

interface Props {
  assetId: string
  canEdit: boolean
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function fmtCost(c: number | null): string {
  if (c == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(c)
}

export default function AssetMaintenanceList({ assetId, canEdit }: Props) {
  const router = useRouter()
  const { show } = useToast()
  const [items, setItems] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/assets/${assetId}/maintenances`, { credentials: 'include' })
      const j = await r.json()
      if (j?.ok) setItems(j.data.maintenances)
      else setError(j?.message ?? 'Không thể tải.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId])

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa phiếu sửa chữa này?')) return
    const r = await fetch(`/api/maintenances/${id}`, { method: 'DELETE', credentials: 'include' })
    const j = await r.json()
    if (j?.ok) reload()
    else show({ type: 'error', message: j?.message ?? 'Xóa thất bại.' })
  }

  const totalCost = items.reduce((sum, m) => sum + (m.cost ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Wrench className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold">Lịch sử sửa chữa ({items.length})</h3>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition text-sm font-medium shadow-sm"
          >
            <Plus size={16} />
            Thêm phiếu sửa chữa
          </button>
        )}
      </div>

      {/* Total cost summary */}
      {items.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-amber-800">Tổng chi phí sửa chữa</span>
          <span className="text-lg font-bold text-amber-900">{fmtCost(totalCost)}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-gray-500">Đang tải…</div>
      ) : error ? (
        <div className="p-6 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
          Lỗi: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
          <Wrench className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p>Chưa có phiếu sửa chữa nào.</p>
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-sm text-amber-700 hover:text-amber-800 font-medium"
            >
              + Tạo phiếu đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">{m.title}</h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                    {m.supplier && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">{m.supplier.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <DollarSign size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{fmtCost(m.cost)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{fmtDate(m.startDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{fmtDate(m.completionDate)}</span>
                    </div>
                  </div>

                  {m.notes && (
                    <div className="flex items-start gap-1.5 mt-3 text-sm text-gray-600">
                      <FileText size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{m.notes}</span>
                    </div>
                  )}

                  {m.createdBy && (
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                      <User size={12} />
                      Tạo bởi {m.createdBy.firstName}
                      {m.createdBy.lastName ? ` ${m.createdBy.lastName}` : ''}
                      <span className="text-gray-300">•</span>
                      {new Date(m.createdAt).toLocaleString('vi-VN')}
                    </div>
                  )}
                </div>

                {canEdit && (
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddMaintenanceModal
          assetId={assetId}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            reload()
            router.refresh()
          }}
        />
      )}
    </div>
  )
}