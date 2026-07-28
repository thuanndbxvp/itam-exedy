'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, TrendingDown, HelpCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'

interface Depreciation {
  id: string
  name: string
  months: number
  depreciationType: string
  minimumValue: string | number
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  initial: Depreciation[]
  canEdit: boolean
}

type FormData = {
  name: string
  months: string
  depreciationType: 'LINEAR' | 'HALF_YEAR'
  minimumValue: string
  notes: string
}

const EMPTY_FORM: FormData = { name: '', months: '36', depreciationType: 'LINEAR', minimumValue: '0', notes: '' }

function depreciationToForm(d: Depreciation): FormData {
  return {
    name: d.name,
    months: String(d.months),
    depreciationType: d.depreciationType as 'LINEAR' | 'HALF_YEAR',
    minimumValue: typeof d.minimumValue === 'string' ? d.minimumValue : String(d.minimumValue),
    notes: d.notes ?? '',
  }
}

export default function DepreciationTable({ initial, canEdit }: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [items, setItems] = useState<Depreciation[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(d: Depreciation) {
    setEditingId(d.id)
    setForm(depreciationToForm(d))
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const months = Number(form.months)
    if (!form.name.trim()) {
      showCommandResult({ ok: false, code: 'VALIDATION', message: 'Tên là bắt buộc.' })
      return
    }
    if (!Number.isInteger(months) || months <= 0) {
      showCommandResult({ ok: false, code: 'VALIDATION', message: 'Số tháng phải là số nguyên dương.' })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/settings/depreciations/${editingId}` : '/api/settings/depreciations'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          months,
          depreciationType: form.depreciationType,
          minimumValue: Number(form.minimumValue) || 0,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setShowForm(false)
        setItems((prev) => {
          if (editingId) return prev.map((d) => (d.id === editingId ? data.data : d))
          return [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name))
        })
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleRequestDelete(d: Depreciation) {
    setConfirmDeleteId(d.id)
  }

  async function handleConfirmDelete() {
    const id = confirmDeleteId
    if (!id) return
    setConfirmDeleteId(null)
    setDeletingId(id)
    try {
      const res = await fetch(`/api/settings/depreciations/${id}`, { method: 'DELETE' })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setItems((prev) => prev.filter((x) => x.id !== id))
        router.refresh()
      }
    } finally {
      setDeletingId(null)
    }
  }

  const fmtValue = (v: string | number) => {
    const n = typeof v === 'string' ? Number(v) : v
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex items-center justify-end">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
          >
            <Plus size={16} />
            Thêm quy tắc
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <TrendingDown size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Chưa có quy tắc khấu hao nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Số tháng</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Giá trị tối thiểu</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ghi chú</th>
                {canEdit && <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{d.name}</td>
                  <td className="px-6 py-4 text-gray-600">{d.months} tháng</td>
                  <td className="px-6 py-4 text-gray-600">{d.depreciationType === 'LINEAR' ? 'Tuyến tính' : 'Nửa năm'}</td>
                  <td className="px-6 py-4 text-gray-600">{fmtValue(d.minimumValue)}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">{d.notes ?? '—'}</td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(d)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleRequestDelete(d)}
                          disabled={deletingId === d.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Sửa quy tắc khấu hao' : 'Thêm quy tắc khấu hao'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên quy tắc <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="VD: Khấu hao 3 năm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số tháng <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min={1}
                value={form.months}
                onChange={(e) => setForm({ ...form, months: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 group relative inline-flex items-center gap-1">
                Loại
                <HelpCircle size={13} className="text-gray-400" />
                <span className="invisible group-hover:visible absolute left-full ml-2 top-1/2 -translate-y-1/2 w-56 p-2 bg-gray-800 text-white text-xs rounded z-50 leading-relaxed">
                  Tuyến tính: khấu hao đều mỗi năm.<br/>Nửa năm: chỉ tính 50% cho năm đầu và năm cuối.
                </span>
              </label>
              <select
                value={form.depreciationType}
                onChange={(e) => setForm({ ...form, depreciationType: e.target.value as 'LINEAR' | 'HALF_YEAR' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="LINEAR">Tuyến tính</option>
                <option value="HALF_YEAR">Nửa năm</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị còn lại tối thiểu (VND)</label>
            <input
              type="number"
              min={0}
              step="1000"
              value={form.minimumValue}
              onChange={(e) => setForm({ ...form, minimumValue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm delete depreciation */}
      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Xóa quy tắc khấu hao"
      >
        <p className="text-gray-600 mb-2">
          Xóa quy tắc{" "}
          <strong>"{items.find((d) => d.id === confirmDeleteId)?.name}"</strong>?
        </p>
        <p className="text-sm text-red-600 mb-4">Hành động này không thể hoàn tác.</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmDeleteId(null)}
            disabled={!!deletingId}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={!!deletingId}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm disabled:opacity-50"
          >
            {deletingId ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </Modal>
    </div>
  )
}