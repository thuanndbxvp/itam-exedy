'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, Settings, Save, X } from 'lucide-react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/ui/Modal'

interface Rule {
  id: string
  name: string
  category: string
  priority: string | null
  type: string | null
  teamId: string | null
  assignToUserId: string | null
  weight: number
  isActive: boolean
  notes: string | null
  team: { id: string; name: string; slug: string } | null
}

interface Team {
  id: string
  name: string
  slug: string
}

interface User {
  id: string
  firstName: string
  lastName: string | null
  role: string
}

const CATEGORY_OPTIONS = ['HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCOUNT', 'OTHER']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const TYPE_OPTIONS = ['INCIDENT', 'REQUEST']

const CATEGORY_LABELS: Record<string, string> = {
  HARDWARE: 'Phần cứng',
  SOFTWARE: 'Phần mềm',
  NETWORK: 'Mạng',
  ACCOUNT: 'Tài khoản',
  OTHER: 'Khác',
}

export default function AdminHelpdeskPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { show } = useToast()

  const emptyForm = {
    name: '',
    category: 'HARDWARE',
    priority: null as string | null,
    type: null as string | null,
    teamId: null as string | null,
    assignToUserId: null as string | null,
    weight: 100,
    isActive: true,
    notes: '',
  }
  const [form, setForm] = useState(emptyForm)

  async function load() {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/ticket-rules', { cache: 'no-store' })
      const json = await r.json()
      if (json.ok) {
        setRules(json.data.rules)
        setTeams(json.data.teams)
        setUsers(json.data.users)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(r: Rule) {
    setEditing(r.id)
    setForm({
      name: r.name,
      category: r.category,
      priority: r.priority,
      type: r.type,
      teamId: r.teamId,
      assignToUserId: r.assignToUserId,
      weight: r.weight,
      isActive: r.isActive,
      notes: r.notes ?? '',
    })
  }

  function startCreate() {
    setCreating(true)
    setEditing(null)
    setForm(emptyForm)
  }

  function cancel() {
    setEditing(null)
    setCreating(false)
    setForm(emptyForm)
  }

  async function save() {
    setSaving(true)
    try {
      const url = creating ? '/api/admin/ticket-rules' : '/api/admin/ticket-rules'
      const method = creating ? 'POST' : 'PATCH'
      const body = creating ? form : { id: editing, ...form }
      const r = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await r.json()
      if (json.ok) {
        await load()
        cancel()
      } else {
        show({ type: 'error', message: json.message ?? 'Lưu thất bại.' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleRequestDeleteRule(id: string) {
    setConfirmDeleteId(id)
  }

  async function handleConfirmDeleteRule() {
    const id = confirmDeleteId
    if (!id) return
    setConfirmDeleteId(null)
    const r = await fetch('/api/admin/ticket-rules', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const json = await r.json()
    if (json.ok) await load()
    else show({ type: 'error', message: json.message ?? 'Xóa thất bại.' })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="text-blue-600" /> Quản trị Helpdesk
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Cấu hình rule tự động gán team khi nhân viên tạo ticket mới.
          </p>
        </div>
        {!creating && !editing && (
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            <Plus size={16} /> Thêm rule
          </button>
        )}
      </div>

      {/* Form */}
      {(creating || editing) && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">{creating ? 'Tạo rule mới' : 'Chỉnh sửa rule'}</h3>
            <button onClick={cancel} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="text-xs text-gray-500">Tên rule</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c} — {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Priority (optional)</label>
              <select
                value={form.priority ?? ''}
                onChange={(e) => setForm({ ...form, priority: e.target.value || null })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">— Bất kỳ —</option>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Type (optional)</label>
              <select
                value={form.type ?? ''}
                onChange={(e) => setForm({ ...form, type: e.target.value || null })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">— Bất kỳ —</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Team phụ trách</label>
              <select
                value={form.teamId ?? ''}
                onChange={(e) => setForm({ ...form, teamId: e.target.value || null })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">— Không gán —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Assign to user (optional)</label>
              <select
                value={form.assignToUserId ?? ''}
                onChange={(e) => setForm({ ...form, assignToUserId: e.target.value || null })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">— Để team tự claim —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName ?? ''} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Weight</label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded text-blue-600"
                />
                Kích hoạt
              </label>
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="text-xs text-gray-500">Ghi chú</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={cancel}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Hủy
            </button>
            <button
              onClick={save}
              disabled={saving || !form.name.trim()}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Lưu
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 size={20} className="animate-spin mr-2" /> Đang tải...
          </div>
        ) : rules.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            Chưa có rule nào. Nhấn "Thêm rule" để bắt đầu.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Weight</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{r.name}</div>
                    {r.notes && <div className="text-xs text-gray-500 mt-0.5">{r.notes}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {r.category}
                    </span>
                    {r.priority && (
                      <span className="ml-1 inline-block px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">
                        {r.priority}
                      </span>
                    )}
                    {r.type && (
                      <span className="ml-1 inline-block px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                        {r.type}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {r.team ? <span className="text-blue-600 font-medium">{r.team.name}</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{r.weight}</td>
                  <td className="px-4 py-3">
                    {r.isActive ? (
                      <span className="text-xs text-green-600 font-medium">● Active</span>
                    ) : (
                      <span className="text-xs text-gray-400">○ Off</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(r)}
                      className="text-blue-600 hover:underline text-xs mr-3"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleRequestDeleteRule(r.id)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      <Trash2 size={12} className="inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm delete rule */}
      <Modal
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="Xóa rule"
      >
        <p className="text-gray-600 mb-4">Xóa rule này?</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setConfirmDeleteId(null)}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirmDeleteRule}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            Xóa
          </button>
        </div>
      </Modal>
    </div>
  )
}