'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import type { StatusLabel } from '@prisma/client'

export default function EditStatusForm({ status }: { status: StatusLabel }) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [isPending, setIsPending] = useState(false)
  const [form, setForm] = useState({
    name: status.name,
    deployable: status.deployable,
    pending: status.pending,
    archived: status.archived,
    undeployable: !status.deployable && !status.pending && !status.archived,
    color: status.color ?? '#3B82F6',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      showCommandResult({ ok: false, code: 'VALIDATION', message: 'Tên không được trống.' })
      return
    }
    setIsPending(true)
    try {
      const res = await fetch(`/api/settings/statuses/${status.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) router.push('/settings/statuses')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings/statuses" className="p-2 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 hover:shadow-sm transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sửa trạng thái</h1>
          <p className="text-gray-500 text-sm mt-1">Cập nhật nhãn trạng thái.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên trạng thái <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Loại trạng thái</label>
            <div className="space-y-3">
              {[
                { key: 'deployable', label: 'Sẵn sàng cấp phát', color: 'bg-green-500', hint: 'Có thể cấp phát cho nhân sự' },
                { key: 'pending', label: 'Chờ duyệt', color: 'bg-yellow-500', hint: 'Đang trong quy trình xử lý' },
                { key: 'undeployable', label: 'Không khả dụng', color: 'bg-red-500', hint: 'Không thể cấp phát (đang sửa chữa, mất…)' },
                { key: 'archived', label: 'Lưu trữ', color: 'bg-gray-500', hint: 'Ngừng sử dụng, chỉ lưu hồ sơ' },
              ].map((opt) => (
                <label key={opt.key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    checked={form[opt.key as keyof typeof form] === true}
                    onChange={() => setForm((f) => ({
                      ...f,
                      deployable: false,
                      pending: false,
                      archived: false,
                      [opt.key]: true,
                    }))}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`mt-1 w-3 h-3 rounded-full ${opt.color}`} />
                  <div>
                    <p className="text-sm text-gray-700 font-medium">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Màu sắc</label>
            <div className="flex gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
              />
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/settings/statuses" className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition shadow-sm">
            Hủy
          </Link>
          <button type="submit" disabled={isPending} className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-70">
            {isPending ? <><Loader2 size={16} className="mr-2 animate-spin" /> Đang lưu...</> : <><Save size={16} className="mr-2" /> Lưu thay đổi</>}
          </button>
        </div>
      </form>
    </div>
  )
}
