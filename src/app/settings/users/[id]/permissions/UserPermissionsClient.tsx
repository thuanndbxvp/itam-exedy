'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Shield, ShieldCheck, ShieldOff, Loader2, Info, X } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface PermissionDef {
  key: string
  resource: string
  action: string
  label: string
  description?: string
  group: string
}

interface Override {
  id: string
  effect: 'GRANT' | 'DENY'
  reason: string | null
  expiresAt: string | null
  permission: { id: string; key: string; label: string; group: string }
}

interface UserData {
  id: string
  firstName: string
  lastName: string | null
  email: string | null
  role: string
  customRoleId: string | null
  customRole: { id: string; name: string; slug: string } | null
  basePermissions: string[]
  effectivePermissions: string[]
  userPermissions: Override[]
}

interface Props {
  userId: string
}

export default function UserPermissionsClient({ userId }: Props) {
  const { showCommandResult } = useToast()
  const [user, setUser] = useState<UserData | null>(null)
  const [catalog, setCatalog] = useState<PermissionDef[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/permissions/users/${userId}`).then((r) => r.json()),
      fetch('/api/permissions').then((r) => r.json()),
    ]).then(([u, p]) => {
      if (u.ok) setUser(u.data)
      if (p.ok) setCatalog(p.data)
      setLoading(false)
    })
  }, [userId])

  const overrideMap = useMemo(() => {
    const map = new Map<string, Override>()
    user?.userPermissions.forEach((ov) => map.set(ov.permission.key, ov))
    return map
  }, [user])

  async function setOverride(permId: string, key: string, effect: 'GRANT' | 'DENY') {
    setBusyKey(key)
    try {
      const res = await fetch(`/api/permissions/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_override', permissionId: permId, effect }),
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        const refreshed = await fetch(`/api/permissions/users/${userId}`).then((r) => r.json())
        if (refreshed.ok) setUser(refreshed.data)
      }
    } finally {
      setBusyKey(null)
    }
  }

  async function clearOverride(permId: string, key: string) {
    setBusyKey(key)
    try {
      const res = await fetch(`/api/permissions/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_override', permissionId: permId }),
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        const refreshed = await fetch(`/api/permissions/users/${userId}`).then((r) => r.json())
        if (refreshed.ok) setUser(refreshed.data)
      }
    } finally {
      setBusyKey(null)
    }
  }

  if (loading || !user) {
    return (
      <div className="p-12 text-center text-gray-500">
        <Loader2 size={24} className="mx-auto animate-spin mb-2" />
        Đang tải...
      </div>
    )
  }

  // Group permissions by `group`
  const grouped = catalog.reduce<Record<string, PermissionDef[]>>((acc, p) => {
    (acc[p.group] ??= []).push(p)
    return acc
  }, {})

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/settings/users/${userId}`} className="p-2 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân quyền chi tiết</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {fullName} — {user.email} — Vai trò: <span className="font-medium">{user.role}</span>
            {user.customRole && (
              <> · Custom Role: <span className="font-medium">{user.customRole.name}</span></>
            )}
          </p>
        </div>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-sm text-indigo-900">
          Quyền cuối cùng của user = <strong>Quyền của vai trò</strong> ⊕ <strong>Quyền của Custom Role</strong> ⊕ <strong>Override tại đây</strong>.
          <br />
          <strong>DENY</strong> luôn thắng: nếu override DENY một permission, user sẽ bị mặc kệ quyền đó dù custom role có cấp.
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([group, perms]) => (
          <section key={group} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{group}</h2>
            </div>
            <table className="w-full">
              <thead className="bg-white border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-6 py-2 text-left font-semibold">Quyền</th>
                  <th className="px-6 py-2 text-left font-semibold w-32">Mặc định</th>
                  <th className="px-6 py-2 text-left font-semibold w-44">Override</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {perms.map((p) => {
                  const inBase = user.basePermissions.includes(p.key)
                  const effective = user.effectivePermissions.includes(p.key)
                  const ov = overrideMap.get(p.key)
                  const busy = busyKey === p.key

                  return (
                    <tr key={p.key} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="flex items-start gap-2">
                          <code className="text-xs font-mono text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded">{p.key}</code>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{p.label}</p>
                            {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {inBase ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <ShieldCheck size={12} /> Có
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            <ShieldOff size={12} /> Không
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          {ov ? (
                            <>
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                                  ov.effect === 'GRANT'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {ov.effect === 'GRANT' ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                                {ov.effect}
                              </span>
                              <button
                                onClick={() => clearOverride(ov.permission.id, p.key)}
                                disabled={busy}
                                className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-50"
                                title="Xóa override"
                              >
                                {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                              </button>
                              <span
                                className={`ml-1 text-xs ${effective ? 'text-emerald-600' : 'text-red-600'}`}
                              >
                                → Hiện tại: <strong>{effective ? 'Có' : 'Không'}</strong>
                              </span>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setOverride(p.key, p.key, 'GRANT')}
                                disabled={busy}
                                className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded disabled:opacity-50"
                              >
                                + Grant
                              </button>
                              <button
                                onClick={() => setOverride(p.key, p.key, 'DENY')}
                                disabled={busy}
                                className="text-xs px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded disabled:opacity-50"
                              >
                                × Deny
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  )
}