'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Users, ChevronDown, X, Loader2, UserCheck } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'

interface Team {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
  leadId: string | null
  isActive: boolean
  memberIds: string[]
  memberCount: number
  ticketCount: number
  lead: { id: string; firstName: string; lastName: string | null; role: string } | null
}

interface UserLite {
  id: string
  firstName: string
  lastName: string | null
  role: string
}

interface Props {
  initialTeams: Team[]
  users: UserLite[]
  canEdit: boolean
}

const CATEGORY_OPTIONS = [
  { value: 'HARDWARE', label: 'Phần cứng' },
  { value: 'SOFTWARE', label: 'Phần mềm' },
  { value: 'NETWORK', label: 'Mạng' },
  { value: 'ACCOUNT', label: 'Tài khoản' },
  { value: 'OTHER', label: 'Khác' },
]

function userName(u: UserLite): string {
  return `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`
}

function roleBadge(role: string): string {
  switch (role) {
    case 'ADMIN': return 'bg-red-100 text-red-700'
    case 'IT_MANAGER': return 'bg-purple-100 text-purple-700'
    case 'IT_STAFF': return 'bg-blue-100 text-blue-700'
    case 'EMPLOYEE': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

export default function HelpdeskTeamsClient({ initialTeams, users, canEdit }: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '' as string,
    leadId: '' as string,
    memberIds: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMemberDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function openCreate() {
    setEditingId(null)
    setForm({ name: '', description: '', category: '', leadId: '', memberIds: [] })
    setShowForm(true)
  }

  function openEdit(t: Team) {
    setEditingId(t.id)
    setForm({
      name: t.name,
      description: t.description ?? '',
      category: t.category ?? '',
      leadId: t.leadId ?? '',
      memberIds: t.memberIds,
    })
    setShowForm(true)
  }

  function toggleMember(uid: string) {
    setForm((f) => {
      const has = f.memberIds.includes(uid)
      return {
        ...f,
        memberIds: has ? f.memberIds.filter((x) => x !== uid) : [...f.memberIds, uid],
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      showCommandResult({ ok: false, code: 'VALIDATION', message: 'Tên team là bắt buộc.' })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/helpdesk-teams/${editingId}` : '/api/helpdesk-teams'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          category: form.category || null,
          leadId: form.leadId || null,
          userIds: form.memberIds,
        }),
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setShowForm(false)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(t: Team) {
    if (!confirm(`Xóa (soft-delete) team "${t.name}"?`)) return
    setDeletingId(t.id)
    try {
      const res = await fetch(`/api/helpdesk-teams/${t.id}`, { method: 'DELETE' })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setTeams((prev) => prev.map((x) => (x.id === t.id ? { ...x, isActive: false } : x)))
        router.refresh()
      }
    } finally {
      setDeletingId(null)
    }
  }

  const selectedMembers = users.filter((u) => form.memberIds.includes(u.id))

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex items-center justify-end">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
          >
            <Plus size={16} />
            Tạo Team
          </button>
        </div>
      )}

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Chưa có Helpdesk Team nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tên</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phân loại</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trưởng nhóm</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Thành viên</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Tickets</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                {canEdit && <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teams.map((t) => (
                <tr key={t.id} className={`hover:bg-gray-50 transition ${!t.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">/{t.slug}</div>
                    {t.description && <div className="text-xs text-gray-500 mt-1 line-clamp-1">{t.description}</div>}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {t.category ? (
                      <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                        {CATEGORY_OPTIONS.find((c) => c.value === t.category)?.label ?? t.category}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-sm">
                    {t.lead ? (
                      <span className="inline-flex items-center gap-1 text-purple-700">
                        <UserCheck size={12} />
                        {userName(t.lead)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-full bg-slate-100 font-bold text-slate-700 text-sm">
                      {t.memberCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-gray-600">{t.ticketCount}</td>
                  <td className="px-6 py-4 text-center">
                    {t.isActive ? (
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        Đã ẩn
                      </span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(t)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Sửa"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={deletingId === t.id}
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

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'Sửa Helpdesk Team' : 'Tạo Helpdesk Team'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên Team <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="VD: Helpdesk L1, Network Team..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phân loại chính</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">— Không giới hạn —</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trưởng nhóm</label>
              <select
                value={form.leadId}
                onChange={(e) => setForm({ ...form, leadId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">— Không chỉ định —</option>
                {users.filter((u) => u.role === 'IT_MANAGER' || u.role === 'ADMIN').map((u) => (
                  <option key={u.id} value={u.id}>
                    {userName(u)} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thành viên ({form.memberIds.length})</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-gray-400"
              >
                <span className="text-sm text-gray-700">
                  {selectedMembers.length > 0
                    ? `${selectedMembers.length} người đã chọn`
                    : 'Chọn thành viên...'}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              {memberDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {users.map((u) => (
                    <label
                      key={u.id}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.memberIds.includes(u.id)}
                        onChange={() => toggleMember(u.id)}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm text-gray-900 flex-1">{userName(u)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedMembers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                  >
                    {userName(u)}
                    <button
                      type="button"
                      onClick={() => toggleMember(u.id)}
                      className="hover:text-blue-900"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editingId ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}