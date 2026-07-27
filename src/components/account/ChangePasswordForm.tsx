'use client'

import { useState } from 'react'
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { changePasswordAction } from '@/app/actions/account'

function getStrength(pwd: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (pwd.length === 0) return { score: 0, label: '' }
  let s = 0
  if (pwd.length >= 8) s++
  if (/[A-Z]/.test(pwd)) s++
  if (/\d/.test(pwd)) s++
  if (/[^A-Za-z0-9]/.test(pwd)) s++
  const score = Math.min(3, s) as 0 | 1 | 2 | 3
  const labels = ['Yếu', 'Yếu', 'Trung bình', 'Mạnh']
  return { score, label: labels[score] }
}

export default function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const { show, showCommandResult } = useToast()

  function handleChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Client validation
    if (form.newPassword !== form.confirmPassword) {
      show({ type: 'error', message: 'Mật khẩu mới không khớp.' })
      return
    }
    if (form.newPassword.length < 8) {
      show({ type: 'error', message: 'Mật khẩu phải ≥8 ký tự.' })
      return
    }
    if (form.newPassword === form.currentPassword) {
      show({
        type: 'error',
        message: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
      })
      return
    }

    setIsSaving(true)
    try {
      const result = await changePasswordAction(form)
      if (result.ok) {
        show({ type: 'success', message: 'Đã đổi mật khẩu.' })
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        showCommandResult(result, 'Đã đổi mật khẩu')
      }
    } catch {
      show({ type: 'error', message: 'Lỗi khi đổi mật khẩu.' })
    } finally {
      setIsSaving(false)
    }
  }

  const strength = getStrength(form.newPassword)
  const strengthColors = ['bg-gray-200', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500']

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
    >
      <PwdField
        label="Mật khẩu hiện tại"
        value={form.currentPassword}
        onChange={(v) => handleChange('currentPassword', v)}
        show={showPwd}
        required
      />
      <PwdField
        label="Mật khẩu mới"
        value={form.newPassword}
        onChange={(v) => handleChange('newPassword', v)}
        show={showPwd}
        required
      />
      {form.newPassword.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded overflow-hidden flex">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`flex-1 ${i < strength.score ? strengthColors[strength.score] : 'bg-gray-200'} transition-colors`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500 w-16 text-right">{strength.label}</span>
        </div>
      )}
      <PwdField
        label="Xác nhận mật khẩu mới"
        value={form.confirmPassword}
        onChange={(v) => handleChange('confirmPassword', v)}
        show={showPwd}
        required
      />

      <div className="flex items-center pt-2">
        <button
          type="button"
          onClick={() => setShowPwd((s) => !s)}
          className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
        >
          {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
          {showPwd ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        </button>
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
        {isSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
      </button>
    </form>
  )
}

function PwdField({
  label,
  value,
  onChange,
  show,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  required?: boolean
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative mt-1">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  )
}