'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { MapPin, Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Location {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  zip: string | null
  parentId: string | null
  managerId: string | null
  notes: string | null
}

interface Props {
  locations: Location[]
  users: { id: string; firstName: string; lastName: string | null }[]
}

const emptyForm = {
  name: '',
  address: '',
  city: '',
  state: '',
  country: 'Việt Nam',
  zip: '',
  parentId: '',
  managerId: '',
  notes: '',
}

export default function LocationsTable({ locations, users }: Props) {
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

  function openEdit(l: Location) {
    setEditId(l.id)
    setForm({
      name: l.name,
      address: l.address ?? '',
      city: l.city ?? '',
      state: l.state ?? '',
      country: l.country ?? 'Việt Nam',
      zip: l.zip ?? '',
      parentId: l.parentId ?? '',
      managerId: l.managerId ?? '',
      notes: l.notes ?? '',
    })
    setShowModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const url = editId ? `/api/settings/locations/${editId}` : '/api/settings/locations'
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
      const res = await fetch(`/api/settings/locations/${id}`, { method: 'DELETE' })
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

  function getLocationName(id: string | null) {
    if (!id) return null
    return locations.find(l => l.id === id)?.name ?? null
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Danh sách vị trí ({locations.length})</h2>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition">
            <Plus size={16} />
            Thêm mới
          </button>
        </div>

        {locations.length === 0 ? (
          <div className="p-12 text-center">
            <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Chưa có vị trí nào.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Địa chỉ</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Thành phố</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trực thuộc</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {locations.map(l => (
                <tr key={l.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{l.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{l.address || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{l.city || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{getLocationName(l.parentId) || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(l)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setDeleteId(l.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
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
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Sửa vị trí' : 'Thêm vị trí'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: Văn phòng Hà Nội, Kho tổng..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Bang</label>
              <input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã bưu chính</label>
              <input type="text" value={form.zip} onChange={e => setForm({ ...form, zip: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quốc gia</label>
            <input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trực thuộc</label>
              <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Không —</option>
                {locations.filter(l => l.id !== editId).map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quản lý</label>
              <select value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Không —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.firstName}{u.lastName ? ' ' + u.lastName : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa vị trí" size="sm">
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa vị trí này?</p>
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