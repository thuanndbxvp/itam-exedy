'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import { ArrowLeft, Save, Loader2, Network, Shield } from 'lucide-react'
import bcrypt from 'bcryptjs'

interface DepartmentOpt {
  id: string
  name: string
  company?: { id: string; name: string } | null
}

interface CustomRoleOpt {
  id: string
  name: string
  slug: string
  baseRole: string
}

interface Props {
  departments: DepartmentOpt[]
  customRoles: CustomRoleOpt[]
}

export default function NewUserForm({ departments, customRoles }: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [isPending, setIsPending] = useState(false)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    jobTitle: '',
    departmentId: '',
    customRoleId: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.email.trim() || !form.password.trim()) {
      showCommandResult({ ok: false, code: 'VALIDATION', message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' })
      return
    }
    setIsPending(true)
    try {
      const hashed = await bcrypt.hash(form.password, 10)
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, password: hashed }),
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) router.push('/settings/users')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/settings/users" className="p-2 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-gray-900 hover:shadow-sm transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thêm người dùng</h1>
          <p className="text-gray-500 text-sm mt-1">Tạo tài khoản mới cho nhân viên.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Họ <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chức danh</label>
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              placeholder="VD: Kỹ sư phần mềm"
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Network size={14} className="text-gray-400" />
              Phòng ban
            </label>
            <select
              value={form.departmentId}
              onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition cursor-pointer"
            >
              <option value="">— Chưa gán phòng ban —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.company ? ` (${d.company.name})` : ''}
                </option>
              ))}
            </select>
            {departments.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Chưa có phòng ban nào. <Link href="/settings/departments" className="underline">Tạo phòng ban</Link> trước.
              </p>
            )}
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Shield size={14} className="text-gray-400" />
              Vai trò hệ thống <span className="text-red-500">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition cursor-pointer"
            >
              <option value="EMPLOYEE">EMPLOYEE — Nhân viên</option>
              <option value="IT_STAFF">IT_STAFF — Nhân viên IT</option>
              <option value="IT_MANAGER">IT_MANAGER — Quản lý IT</option>
              <option value="ADMIN">ADMIN — Quản trị viên</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Cấp quyền mặc định theo vai trò. Có thể gán thêm Custom Role bên dưới để bổ sung.
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
              <Shield size={14} className="text-indigo-500" />
              Custom Role <span className="text-xs font-normal text-gray-500">(tùy chọn)</span>
            </label>
            <select
              value={form.customRoleId}
              onChange={(e) => setForm((f) => ({ ...f, customRoleId: e.target.value }))}
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition cursor-pointer"
            >
              <option value="">— Không dùng custom role —</option>
              {customRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (gốc: {r.baseRole})
                </option>
              ))}
            </select>
            {customRoles.length === 0 ? (
              <p className="mt-1 text-xs text-gray-500">
                Chưa có custom role. <Link href="/settings/permissions" className="underline">Tạo custom role</Link> trước.
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Quyền của custom role sẽ <strong>cộng</strong> vào quyền của vai trò hệ thống.
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Link href="/settings/users" className="px-6 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition shadow-sm">
            Hủy
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" /> Đang tạo...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" /> Tạo mới
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}