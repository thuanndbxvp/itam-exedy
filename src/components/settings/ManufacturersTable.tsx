'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { Factory, Pencil, Trash2, Plus, Loader2, Globe, Phone, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Manufacturer {
  id: string
  name: string
  url: string | null
  supportUrl: string | null
  supportPhone: string | null
  supportEmail: string | null
  notes: string | null
}

interface Props {
  manufacturers: Manufacturer[]
}

const emptyForm = {
  name: '',
  url: '',
  supportUrl: '',
  supportPhone: '',
  supportEmail: '',
  notes: '',
}

export default function ManufacturersTable({ manufacturers }: Props) {
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

  function openEdit(m: Manufacturer) {
    setEditId(m.id)
    setForm({
      name: m.name,
      url: m.url ?? '',
      supportUrl: m.supportUrl ?? '',
      supportPhone: m.supportPhone ?? '',
      supportEmail: m.supportEmail ?? '',
      notes: m.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const url = editId ? `/api/settings/manufacturers/${editId}` : '/api/settings/manufacturers'
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      const res = await fetch(`/api/settings/manufacturers/${id}`, { method: 'DELETE' })
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
          <h2 className="font-semibold text-gray-800">Danh sách nhà sản xuất</h2>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
          >
            <Plus size={16} />
            Thêm mới
          </button>
        </div>

        {manufacturers.length === 0 ? (
          <div className="p-12 text-center">
            <Factory size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Chưa có nhà sản xuất nào.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Website</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hỗ trợ</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {manufacturers.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {m.url ? (
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Globe size={14} /> Website
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 space-y-1">
                    {m.supportPhone && <div className="flex items-center gap-1"><Phone size={12} /> {m.supportPhone}</div>}
                    {m.supportEmail && <div className="flex items-center gap-1"><Mail size={12} /> {m.supportEmail}</div>}
                    {!m.supportPhone && !m.supportEmail && '—'}
                  </td>
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
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Sửa nhà sản xuất' : 'Thêm nhà sản xuất'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: Dell, HP, Lenovo..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={form.url}
                onChange={e => setForm({ ...form, url: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Hỗ trợ</label>
              <input
                type="url"
                value={form.supportUrl}
                onChange={e => setForm({ ...form, supportUrl: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại hỗ trợ</label>
              <input
                type="tel"
                value={form.supportPhone}
                onChange={e => setForm({ ...form, supportPhone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email hỗ trợ</label>
              <input
                type="email"
                value={form.supportEmail}
                onChange={e => setForm({ ...form, supportEmail: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="support@..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Hủy</button>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa nhà sản xuất" size="sm">
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa nhà sản xuất này?</p>
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
