'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { Users, Pencil, Trash2, Loader2, Shield } from 'lucide-react'
import type { User } from '@prisma/client'

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  IT_MANAGER: 'bg-purple-100 text-purple-700',
  IT_STAFF: 'bg-amber-100 text-amber-700',
  EMPLOYEE: 'bg-blue-100 text-blue-700',
}

interface Props {
  users: (User & { department?: { name: string } | null; company?: { name: string } | null })[]
}

/** Lấy chữ cái đầu của firstName + lastName làm avatar fallback */
function getInitials(u: User): string {
  const first = (u.firstName ?? '').trim()
  const last = (u.lastName ?? '').trim()
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || '?'
}

export default function UsersTable({ users }: Props) {
  const { showCommandResult } = useToast()
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/settings/users/${id}`, { method: 'DELETE' })
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

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Users size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Chưa có người dùng nào.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Người dùng</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Liên hệ</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phòng ban</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vai trò</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => {
            const initials = getInitials(user)
            return (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatar}
                        alt={user.firstName}
                        className="w-9 h-9 rounded-full object-cover bg-slate-100"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                        {initials}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                        </p>
                        {user.vip && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase">
                            VIP
                          </span>
                        )}
                        {user.remote && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 uppercase">
                            Remote
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{user.jobTitle || user.username || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <p className="text-gray-700">{user.email || '—'}</p>
                  <p className="text-xs text-gray-500">
                    {user.employeeNum && <span className="font-mono">{user.employeeNum}</span>}
                    {user.employeeNum && user.phone && ' · '}
                    {user.phone && <span>{user.phone}</span>}
                    {!user.employeeNum && !user.phone && '—'}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.department?.name || '—'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                    <Shield size={12} className="mr-1" />
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.activated ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Hoạt động
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      Vô hiệu
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <a href={`/settings/users/${user.id}`} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition">
                      <Pencil size={16} />
                    </a>
                    <button onClick={() => setDeleteId(user.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa người dùng" size="sm">
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa người dùng này?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Hủy</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 disabled:opacity-70">
            {deleting && <Loader2 size={16} className="animate-spin" />}
            Xóa
          </button>
        </div>
      </Modal>
    </div>
  )
}
