'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/Toast'
import {
  ArrowLeft, Save, Loader2, Network, Shield, User as UserIcon,
  Briefcase, MapPin, Building2, Contact, ToggleLeft, ToggleRight,
} from 'lucide-react'
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

interface CompanyOpt { id: string; name: string }
interface LocationOpt { id: string; name: string }
interface ManagerOpt { id: string; firstName: string; lastName: string | null }

interface Props {
  departments: DepartmentOpt[]
  customRoles: CustomRoleOpt[]
  companies: CompanyOpt[]
  locations: LocationOpt[]
  managers: ManagerOpt[]
}

const inputCls = 'w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'
const selectCls = `${inputCls} cursor-pointer`

export default function NewUserForm({
  departments, customRoles, companies, locations, managers,
}: Props) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [isPending, setIsPending] = useState(false)
  const [form, setForm] = useState({
    // Identity
    firstName: '', lastName: '', username: '', email: '', password: '',
    employeeNum: '', avatar: '',
    // Contact
    phone: '', mobile: '', address: '', city: '', state: '', country: '', zip: '',
    // Organization
    departmentId: '', companyId: '', locationId: '', managerId: '',
    // Permissions
    role: 'EMPLOYEE', customRoleId: '',
    // Flags
    activated: true, remote: false, vip: false, autoassignLicenses: false,
    locale: 'vi-VN',
    // Notes
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.firstName.trim() || !form.email.trim() || !form.password.trim()) {
      showCommandResult({ ok: false, code: 'VALIDATION', message: 'Vui lòng điền đầy đủ thông tin bắt buộc (Họ, Email, Mật khẩu).' })
      return
    }
    setIsPending(true)
    try {
      const hashed = await bcrypt.hash(form.password, 10)
      const payload = { ...form, password: hashed }
      const res = await fetch('/api/settings/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) router.push('/settings/users')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="max-w-4xl">
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
        {/* ============== IDENTITY ============== */}
        <fieldset className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <legend className="px-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <UserIcon size={14} /> Thông tin định danh
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Họ <span className="text-red-500">*</span></label>
              <input type="text" value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tên</label>
              <input type="text" value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Username</label>
              <input type="text" value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="vd: nguyenvana"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mã nhân viên</label>
              <input type="text" value={form.employeeNum}
                onChange={(e) => setForm((f) => ({ ...f, employeeNum: e.target.value }))}
                placeholder="vd: NV001"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email <span className="text-red-500">*</span></label>
              <input type="email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mật khẩu <span className="text-red-500">*</span></label>
              <input type="password" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>URL ảnh đại diện</label>
              <input type="text" value={form.avatar}
                onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
                placeholder="https://..."
                className={inputCls} />
            </div>
          </div>
        </fieldset>

        {/* ============== CONTACT ============== */}
        <fieldset className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <legend className="px-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Contact size={14} /> Liên hệ
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Điện thoại</label>
              <input type="text" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="024-xxxxxxx"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Di động</label>
              <input type="text" value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                placeholder="09xx xxx xxx"
                className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Địa chỉ</label>
              <input type="text" value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Số nhà, đường, phường/xã"
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Thành phố</label>
              <input type="text" value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Tỉnh / Bang</label>
              <input type="text" value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Quốc gia</label>
              <input type="text" value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Mã bưu điện (Zip)</label>
              <input type="text" value={form.zip}
                onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
        </fieldset>

        {/* ============== ORGANIZATION ============== */}
        <fieldset className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <legend className="px-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Building2 size={14} /> Tổ chức
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`${labelCls} flex items-center gap-2`}>
                <Network size={14} className="text-gray-400" /> Phòng ban
              </label>
              <select value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                className={selectCls}>
                <option value="">— Chưa gán phòng ban —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}{d.company ? ` (${d.company.name})` : ''}
                  </option>
                ))}
              </select>
              {departments.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Chưa có phòng ban. <Link href="/settings/departments" className="underline">Tạo phòng ban</Link> trước.
                </p>
              )}
            </div>
            <div>
              <label className={`${labelCls} flex items-center gap-2`}>
                <Building2 size={14} className="text-gray-400" /> Công ty
              </label>
              <select value={form.companyId}
                onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}
                className={selectCls}>
                <option value="">— Chưa gán công ty —</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${labelCls} flex items-center gap-2`}>
                <MapPin size={14} className="text-gray-400" /> Địa điểm
              </label>
              <select value={form.locationId}
                onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                className={selectCls}>
                <option value="">— Chưa gán địa điểm —</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`${labelCls} flex items-center gap-2`}>
                <Briefcase size={14} className="text-gray-400" /> Quản lý trực tiếp
              </label>
              <select value={form.managerId}
                onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))}
                className={selectCls}>
                <option value="">— Không có —</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {[m.firstName, m.lastName].filter(Boolean).join(' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ngôn ngữ</label>
              <select value={form.locale}
                onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}
                className={selectCls}>
                <option value="vi-VN">Tiếng Việt (vi-VN)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* ============== PERMISSIONS ============== */}
        <fieldset className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <legend className="px-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Shield size={14} /> Quyền & Trạng thái
          </legend>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`${labelCls} flex items-center gap-2`}>
                <Shield size={14} className="text-gray-400" /> Vai trò hệ thống <span className="text-red-500">*</span>
              </label>
              <select value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as typeof form.role }))}
                className={selectCls}>
                <option value="EMPLOYEE">EMPLOYEE — Nhân viên</option>
                <option value="IT_STAFF">IT_STAFF — Nhân viên IT</option>
                <option value="IT_MANAGER">IT_MANAGER — Quản lý IT</option>
                <option value="ADMIN">ADMIN — Quản trị viên</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Cấp quyền mặc định theo vai trò. Có thể gán thêm Custom Role bên dưới.
              </p>
            </div>
            <div>
              <label className={`${labelCls} flex items-center gap-2`}>
                <Shield size={14} className="text-indigo-500" /> Custom Role <span className="text-xs font-normal text-gray-500">(tùy chọn)</span>
              </label>
              <select value={form.customRoleId}
                onChange={(e) => setForm((f) => ({ ...f, customRoleId: e.target.value }))}
                className={selectCls}>
                <option value="">— Không dùng custom role —</option>
                {customRoles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} (gốc: {r.baseRole})</option>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-gray-100">
            <ToggleRow
              label="Hoạt động"
              desc="Cho phép đăng nhập"
              checked={form.activated}
              onChange={(v) => setForm((f) => ({ ...f, activated: v }))}
            />
            <ToggleRow
              label="Làm việc từ xa"
              desc="Remote worker"
              checked={form.remote}
              onChange={(v) => setForm((f) => ({ ...f, remote: v }))}
            />
            <ToggleRow
              label="VIP"
              desc="Ưu tiên xử lý"
              checked={form.vip}
              onChange={(v) => setForm((f) => ({ ...f, vip: v }))}
            />
            <ToggleRow
              label="Tự gán license"
              desc="Autoassign licenses"
              checked={form.autoassignLicenses}
              onChange={(v) => setForm((f) => ({ ...f, autoassignLicenses: v }))}
            />
          </div>
        </fieldset>

        {/* ============== NOTES ============== */}
        <fieldset className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <legend className="px-2 text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Contact size={14} /> Ghi chú
          </legend>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={4}
            placeholder="Ghi chú nội bộ về người dùng này (không hiển thị với user)"
            className={inputCls}
          />
        </fieldset>

        {/* ============== ACTIONS ============== */}
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
              <><Loader2 size={16} className="mr-2 animate-spin" /> Đang tạo...</>
            ) : (
              <><Save size={16} className="mr-2" /> Tạo mới</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function ToggleRow({
  label, desc, checked, onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded-xl text-left transition"
    >
      {checked ? (
        <ToggleRight size={22} className="text-blue-600 flex-shrink-0 mt-0.5" />
      ) : (
        <ToggleLeft size={22} className="text-gray-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
    </button>
  )
}
