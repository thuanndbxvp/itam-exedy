'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { Tag, Pencil, Trash2, Loader2 } from 'lucide-react'
import type { StatusLabel } from '@prisma/client'

const COLOR_MAP: Record<string, string> = {
  deployable: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  undeployable: 'bg-red-100 text-red-700',
  archived: 'bg-gray-100 text-gray-500',
}

interface Props {
  statuses: StatusLabel[]
}

export default function StatusLabelTable({ statuses }: Props) {
  const { showCommandResult } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/settings/statuses/${id}`, { method: 'DELETE' })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setDeleteId(null)
        window.location.reload()
      }
    } finally {
      setDeleting(false)
    }
  }

  if (statuses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Tag size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Chưa có trạng thái nào.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Màu</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {statuses.map((status) => {
            const typeLabel =
              status.deployable ? 'Sẵn sàng' :
              status.pending ? 'Chờ duyệt' :
              status.archived ? 'Lưu trữ' : 'Không sẵn sàng'
            const colorKey = status.deployable ? 'deployable' : status.pending ? 'pending' : status.archived ? 'archived' : 'undeployable'

            return (
              <tr key={status.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLOR_MAP[colorKey]}`}>
                    {status.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{typeLabel}</td>
                <td className="px-6 py-4">
                  {status.color && (
                    <span
                      className="inline-block w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: status.color }}
                    />
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <a
                      href={`/settings/statuses/${status.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                    >
                      <Pencil size={16} />
                    </a>
                    <button
                      onClick={() => setDeleteId(status.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xóa trạng thái"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Bạn có chắc muốn xóa trạng thái này? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={() => deleteId && handleDelete(deleteId)}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 disabled:opacity-70"
          >
            {deleting && <Loader2 size={16} className="animate-spin" />}
            Xóa
          </button>
        </div>
      </Modal>
    </div>
  )
}
