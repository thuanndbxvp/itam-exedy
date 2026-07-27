'use client'

/**
 * AddMaintenanceModal — Form tạo phiếu sửa chữa.
 *
 * Fields: title, supplierId, cost, startDate, completionDate, notes.
 *
 * Auth: yêu cầu assets.update (backend enforced).
 */

import { useEffect, useState } from 'react'
import { X, Save } from 'lucide-react'

interface Supplier {
  id: string
  name: string
}

interface Props {
  assetId: string
  onClose: () => void
  onCreated: () => void
}

export default function AddMaintenanceModal({ assetId, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [cost, setCost] = useState('')
  const [startDate, setStartDate] = useState('')
  const [completionDate, setCompletionDate] = useState('')
  const [notes, setNotes] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load suppliers cho dropdown (từ /api/settings/suppliers)
    fetch('/api/settings/suppliers', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok && Array.isArray(j.data)) {
          setSuppliers(j.data.map((s: { id: string; name: string }) => ({ id: s.id, name: s.name })))
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Tiêu đề là bắt buộc.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(`/api/assets/${assetId}/maintenances`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          supplierId: supplierId || null,
          cost: cost || null,
          startDate: startDate || null,
          completionDate: completionDate || null,
          notes: notes.trim() || null,
        }),
      })
      const j = await r.json()
      if (j?.ok) onCreated()
      else setError(j?.message ?? 'Lưu thất bại.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Thêm phiếu sửa chữa</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thay pin MacBook"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
              >
                <option value="">— Chọn —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí (VND)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hoàn thành</label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Mô tả chi tiết vấn đề / giải pháp..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Đang lưu…' : 'Lưu phiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}