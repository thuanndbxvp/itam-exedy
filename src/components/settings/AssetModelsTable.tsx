'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { Box, Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AssetModel {
  id: string
  name: string
  modelNumber: string | null
  categoryId: string
  manufacturerId: string | null
  depreciationId: string | null
  eol: number | null
  requireSerial: boolean
  notes: string | null
  category?: { name: string } | null
  manufacturer?: { name: string } | null
}

interface Props {
  models: AssetModel[]
  categories: { id: string; name: string }[]
  manufacturers: { id: string; name: string }[]
  depreciations: { id: string; name: string }[]
}

const emptyForm = {
  name: '',
  modelNumber: '',
  categoryId: '',
  manufacturerId: '',
  depreciationId: '',
  eol: '',
  requireSerial: false,
  notes: '',
}

export default function AssetModelsTable({ models, categories, manufacturers, depreciations }: Props) {
  const { showCommandResult } = useToast()
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  function openCreate() {
    setEditId(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(m: AssetModel) {
    setEditId(m.id)
    setForm({
      name: m.name,
      modelNumber: m.modelNumber ?? '',
      categoryId: m.categoryId,
      manufacturerId: m.manufacturerId ?? '',
      depreciationId: m.depreciationId ?? '',
      eol: m.eol ? String(m.eol) : '',
      requireSerial: m.requireSerial,
      notes: m.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const url = editId ? `/api/settings/asset-models/${editId}` : '/api/settings/asset-models'
      const payload = { ...form, eol: form.eol ? parseInt(form.eol) : null }
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setShowModal(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/settings/asset-models/${id}`, { method: 'DELETE' })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setDeleteId(null)
        router.refresh()
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Danh sách model ({models.length})</h2>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition">
            <Plus size={16} />
            Thêm mới
          </button>
        </div>

        {models.length === 0 ? (
          <div className="p-12 text-center">
            <Box size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Chưa có model nào.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tên model</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mã</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Danh mục</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hãng</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">EOL (tháng)</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {models.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">{m.modelNumber || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.category?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.manufacturer?.name ?? '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.eol ?? '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(m)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setDeleteId(m.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Sửa model' : 'Thêm model'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên model <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: ThinkPad X1 Carbon Gen 11" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã model</label>
              <input type="text" value={form.modelNumber} onChange={e => setForm({ ...form, modelNumber: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">EOL (tháng)</label>
              <input type="number" min="0" value={form.eol} onChange={e => setForm({ ...form, eol: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục <span className="text-red-500">*</span></label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Chọn danh mục —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà sản xuất</label>
              <select value={form.manufacturerId} onChange={e => setForm({ ...form, manufacturerId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Không —</option>
                {manufacturers.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức khấu hao</label>
            <select value={form.depreciationId} onChange={e => setForm({ ...form, depreciationId: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Không —</option>
              {depreciations.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="requireSerial" checked={form.requireSerial}
              onChange={e => setForm({ ...form, requireSerial: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="requireSerial" className="text-sm text-gray-700">Yêu cầu nhập serial</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.categoryId} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa model" size="sm">
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa model này?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 disabled:opacity-50">
            {deleting && <Loader2 size={16} className="animate-spin" />}
            {deleting ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </Modal>
    </>
  )
}