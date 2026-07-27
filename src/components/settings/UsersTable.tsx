'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { Users, Pencil, Trash2, Loader2, Shield, User as UserIcon } from 'lucide-react'
import type { User } from '@prisma/client'

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  EMPLOYEE: 'bg-blue-100 text-blue-700',
}

interface Props {
  users: (User & { department?: { name: string } | null; company?: { name: string } | null })[]
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
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phòng ban</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Vai trò</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <UserIcon size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{[user.firstName, user.lastName].filter(Boolean).join(' ')}</p>
                    <p className="text-xs text-gray-500">{user.jobTitle || '—'}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{user.email || '—'}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{user.department?.name || '—'}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                  <Shield size={12} className="mr-1" />
                  {user.role}
                </span>
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
          ))}
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
