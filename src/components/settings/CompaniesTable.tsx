'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { Building2, Pencil, Trash2, Loader2 } from 'lucide-react'
import type { Company } from '@prisma/client'

interface Props { companies: Company[] }

export default function CompaniesTable({ companies }: Props) {
  const { showCommandResult } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/settings/companies/${id}`, { method: 'DELETE' })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) { setDeleteId(null); window.location.reload() }
    } finally { setDeleting(false) }
  }

  if (companies.length === 0) return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
      <p className="text-gray-500">Chưa có công ty nào.</p>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tên công ty</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ghi chú</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {companies.map(c => (
            <tr key={c.id} className="hover:bg-gray-50 transition">
              <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{c.notes || '—'}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <a href={`/settings/companies/${c.id}`} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"><Pencil size={16} /></a>
                  <button onClick={() => setDeleteId(c.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Xóa công ty" size="sm">
        <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa công ty này?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">Hủy</button>
          <button onClick={() => deleteId && handleDelete(deleteId)} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 disabled:opacity-70">
            {deleting && <Loader2 size={16} className="animate-spin" />} Xóa
          </button>
        </div>
      </Modal>
    </div>
  )
}
