'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import type { Category } from '@prisma/client'

const COLOR_SWATCHES = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']

export default function EditCategoryForm({ category }: { category: Category }) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [isPending, setIsPending] = useState(false)
  const [form, setForm] = useState({
    name: category.name,
    categoryType: category.categoryType,
    color: category.color ?? '#3B82F6',
    eulaText: category.eulaText ?? '',
    requireAcceptance: category.requireAcceptance ?? false,
    checkinEmail: category.checkinEmail ?? '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { showCommandResult({ ok: false, code: 'VALIDATION', message: 'Tên không được trống.' }); return }
    setIsPending(true)
    try {
      const res = await fetch(`/api/settings/categories/${category.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) router.push('/settings/categories')
    } finally { setIsPending(false) }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings/categories" className="p-2 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 transition"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-gray-900">Sửa danh mục</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại</label>
            <select value={form.categoryType} onChange={e => setForm(f => ({ ...f, categoryType: e.target.value }))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition cursor-pointer">
              <option value="ASSET">ASSET - Tài sản</option>
              <option value="LICENSE">LICENSE - License</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Màu</label>
            <div className="flex gap-3">
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                className="h-10 w-20 rounded border border-gray-200 cursor-pointer" />
              <div className="flex gap-2 items-center">
                {COLOR_SWATCHES.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full border-2 border-gray-200 hover:scale-110 transition"
                    style={{ backgroundColor: c, outline: form.color === c ? '2px solid #3B82F6' : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </div>
          </div>

          {/* B1: EULA / acceptance / check-in email */}
          <div className="pt-2 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">EULA & xác nhận</h3>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requireAcceptance}
                  onChange={(e) => setForm((f) => ({ ...f, requireAcceptance: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm text-gray-700 font-medium">Yêu cầu người dùng chấp nhận EULA</p>
                  <p className="text-xs text-gray-500">Nhân sự khi nhận tài sản/license sẽ phải xác nhận đồng ý.</p>
                </div>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in email (tùy chọn)</label>
                <input
                  type="email"
                  value={form.checkinEmail}
                  onChange={(e) => setForm((f) => ({ ...f, checkinEmail: e.target.value }))}
                  placeholder="VD: it-support@congty.com"
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">Email nhận thông báo khi tài sản/license được thu hồi.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">EULA / Nội dung thỏa thuận</label>
                <textarea
                  rows={6}
                  value={form.eulaText}
                  onChange={(e) => setForm((f) => ({ ...f, eulaText: e.target.value }))}
                  placeholder="Dán văn bản thỏa thuận sử dụng (EULA) vào đây..."
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition resize-y"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Link href="/settings/categories" className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition shadow-sm">Hủy</Link>
          <button type="submit" disabled={isPending} className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-70">
            {isPending ? <><Loader2 size={16} className="mr-2 animate-spin" /> Đang lưu...</> : <><Save size={16} className="mr-2" /> Lưu thay đổi</>}
          </button>
        </div>
      </form>
    </div>
  )
}
