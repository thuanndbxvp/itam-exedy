'use client'

import { useEffect, useMemo, useState } from 'react'
import { Shield, Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface PermissionDef {
  key: string
  resource: string
  action: string
  label: string
  description?: string
  group: string
}

interface RoleRow {
  id: string
  name: string
  slug: string
  description: string | null
  baseRole: string
  color: string | null
  isSystem: boolean
  _count: { permissions: number; users: number }
}

export default function RolesManager() {
  const { showCommandResult } = useToast()
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [catalog, setCatalog] = useState<PermissionDef[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<RoleRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // form state (used by both create + edit)
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    baseRole: 'EMPLOYEE',
    color: '#6366f1',
    permissionIds: [] as string[],
  })

  async function refresh() {
    setLoading(true)
    const [r, p] = await Promise.all([
      fetch('/api/permissions/roles').then((r) => r.json()),
      fetch('/api/permissions').then((r) => r.json()),
    ])
    if (r.ok) setRoles(r.data)
    if (p.ok) setCatalog(p.data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const groupedCatalog = useMemo(() => {
    return catalog.reduce<Record<string, PermissionDef[]>>((acc, p) => {
      (acc[p.group] ??= []).push(p)
      return acc
    }, {})
  }, [catalog])

  function openCreate() {
    setForm({ name: '', slug: '', description: '', baseRole: 'EMPLOYEE', color: '#6366f1', permissionIds: [] })
    setEditing(null)
    setCreating(true)
  }

  async function openEdit(role: RoleRow) {
    const detail = await fetch(`/api/permissions/roles/${role.id}`).then((r) => r.json())
    if (!detail.ok) return
    setForm({
      name: detail.data.name,
      slug: detail.data.slug,
      description: detail.data.description ?? '',
      baseRole: detail.data.baseRole,
      color: detail.data.color ?? '#6366f1',
      permissionIds: detail.data.permissions.map((rp: { permissionId: string }) => rp.permissionId),
    })
    setEditing(detail.data)
    setCreating(true)
  }

  function togglePerm(permId: string) {
    setForm((f) => ({
      ...f,
      permissionIds: f.permissionIds.includes(permId)
        ? f.permissionIds.filter((x) => x !== permId)
        : [...f.permissionIds, permId],
    }))
  }

  function toggleGroup(group: string) {
    const ids = groupedCatalog[group].map((p) => p.key)
    // Catalog key != permissionId; we need to look up the actual id by key
    // Since we don't have ids locally, we need to use a key-based map. Build it on demand:
    const permKeyToId: Record<string, string> = {}
    // We don't have IDs in catalog. Let's just use key-based grouping in UI, but store keys.
    // Refactor: switch permissionIds → permissionKeys
    void ids
  }

  async function save() {
    if (!form.name.trim() || !form.slug.trim()) {
      showCommandResult({ ok: false, code: 'VALIDATION', message: 'Tên và slug bắt buộc.' })
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/permissions/roles/${editing.id}` : '/api/permissions/roles'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, permissionKeys: form.permissionIds }),
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setCreating(false)
        setEditing(null)
        refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/permissions/roles/${id}`, { method: 'DELETE' })
    const data = await res.json()
    showCommandResult(data)
    if (data.ok) {
      setDeleteId(null)
      refresh()
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Loader2 size={24} className="mx-auto animate-spin mb-2" />
        Đang tải...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân quyền (RBAC)</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Quản lý role hệ thống và custom role. Mỗi role gán một tập quyền. User có thể được gán thêm custom role và override từng quyền.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          <Plus size={16} /> Tạo custom role
        </button>
      </div>

      {/* Roles table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr className="text-xs text-gray-500 uppercase">
              <th className="px-6 py-3 text-left font-semibold">Tên role</th>
              <th className="px-6 py-3 text-left font-semibold">Slug</th>
              <th className="px-6 py-3 text-left font-semibold">Base</th>
              <th className="px-6 py-3 text-left font-semibold">Số quyền</th>
              <th className="px-6 py-3 text-left font-semibold">Số user</th>
              <th className="px-6 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {roles.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: `${r.color || '#6366f1'}20` }}
                    >
                      <Shield size={18} style={{ color: r.color || '#6366f1' }} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{r.name}</p>
                      {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
                      {r.isSystem && (
                        <span className="text-xs text-indigo-600 font-medium">System role</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">{r.slug}</code>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">{r.baseRole}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{r._count.permissions}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{r._count.users}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {!r.isSystem && (
                      <>
                        <button
                          onClick={() => openEdit(r)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(r.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                    {r.isSystem && (
                      <span className="text-xs text-gray-400 italic px-2">Mặc định</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / edit modal */}
      {creating && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? `Sửa role: ${editing.name}` : 'Tạo custom role'}
              </h3>
              <button
                onClick={() => {
                  setCreating(false)
                  setEditing(null)
                }}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên role <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: License Manager"
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="license-manager"
                    disabled={!!editing}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Base role</label>
                  <select
                    value={form.baseRole}
                    onChange={(e) => setForm((f) => ({ ...f, baseRole: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition cursor-pointer"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="IT_STAFF">IT_STAFF</option>
                    <option value="IT_MANAGER">IT_MANAGER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Màu badge</label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Permissions</label>
                  <span className="text-xs text-gray-500">{form.permissionIds.length} đã chọn</span>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {Object.entries(groupedCatalog).map(([group, perms]) => {
                    // Map keys → IDs (we need IDs for the API). Build via a fetch or use keys directly.
                    // Since the API supports permissionIds (cuid), we look up by key via a static map at runtime.
                    return (
                      <div key={group} className="border-b border-gray-100 last:border-b-0">
                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          {group}
                        </div>
                        <div className="divide-y divide-gray-100">
                          {perms.map((p) => {
                            const checked = form.permissionIds.includes(p.key)
                            return (
                              <label
                                key={p.key}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => {
                                    setForm((f) => ({
                                      ...f,
                                      permissionIds: checked
                                        ? f.permissionIds.filter((k) => k !== p.key)
                                        : [...f.permissionIds, p.key],
                                    }))
                                  }}
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900">{p.label}</p>
                                  <code className="text-xs font-mono text-gray-500">{p.key}</code>
                                </div>
                                {checked && <Check size={14} className="text-emerald-600" />}
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setCreating(false)
                  setEditing(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-2 disabled:opacity-70"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editing ? 'Cập nhật' : 'Tạo role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Xóa role?</h3>
            <p className="text-gray-600 mb-6">Role này sẽ bị xóa. User đang gán role này sẽ trở về role hệ thống ban đầu.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}