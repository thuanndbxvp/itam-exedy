'use client'

import { useState } from 'react'
import { Camera, Save, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { updateProfileAction, uploadAvatarAction } from '@/app/actions/account'

interface ProfileUser {
  id: string
  firstName: string
  lastName: string | null
  username: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  zip: string | null
  avatar: string | null
}

export default function ProfileForm({ user }: { user: ProfileUser }) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName ?? '',
    phone: user.phone ?? '',
    address: user.address ?? '',
    city: user.city ?? '',
    country: user.country ?? '',
    zip: user.zip ?? '',
  })
  const [avatar, setAvatar] = useState(user.avatar)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { show, showCommandResult } = useToast()

  function handleChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  // ── Step 5: Avatar upload ──────────────────────────────────────────────
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      show({ type: 'error', message: 'Avatar tối đa 1MB.' })
      e.target.value = ''
      return
    }
    const ALLOWED = ['image/png', 'image/jpeg', 'image/webp']
    if (!ALLOWED.includes(file.type)) {
      show({ type: 'error', message: 'Chỉ chấp nhận PNG / JPG / WEBP.' })
      e.target.value = ''
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')
      formData.append('entityId', user.id)
      const result = await uploadAvatarAction(formData)
      if (result.ok && result.data) {
        setAvatar(result.data.url)
        show({ type: 'success', message: 'Đã upload avatar.' })
      } else {
        showCommandResult(result, 'Đã upload avatar')
      }
    } catch {
      show({ type: 'error', message: 'Upload thất bại.' })
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  // ── Step 4: Save profile ───────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const result = await updateProfileAction(form)
      if (result.ok) {
        show({ type: 'success', message: 'Đã lưu profile.' })
      } else {
        showCommandResult(result, 'Đã lưu profile')
      }
    } catch {
      show({ type: 'error', message: 'Lỗi khi lưu.' })
    } finally {
      setIsSaving(false)
    }
  }

  const initials = (user.firstName[0] ?? 'U').toUpperCase()

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6">
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {avatar ? (
            // data-URI (Phase 4.5 stub) — Next/Image cần remote pattern cho data URI; dùng <img> để đơn giản.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt="avatar"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-semibold">
              {initials}
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Loader2 className="animate-spin text-white" />
            </div>
          )}
        </div>
        <div>
          <label className="cursor-pointer px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-2 text-sm">
            <Camera size={16} />
            {avatar ? 'Đổi avatar' : 'Upload avatar'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">PNG / JPG / WEBP, tối đa 1MB.</p>
        </div>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Tên"
          value={form.firstName}
          onChange={(v) => handleChange('firstName', v)}
          required
        />
        <Field
          label="Họ"
          value={form.lastName}
          onChange={(v) => handleChange('lastName', v)}
        />
      </div>

      {/* Email + Username — read only */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
        <p>
          <strong>Email:</strong> {user.email ?? '—'}
        </p>
        <p>
          <strong>Username:</strong> {user.username ?? '—'}
        </p>
        <p className="text-xs text-gray-500 mt-1">Liên hệ admin để đổi email/username.</p>
      </div>

      {/* Contact info */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-700">Liên hệ</legend>
        <Field
          label="Số điện thoại"
          value={form.phone}
          onChange={(v) => handleChange('phone', v)}
          type="tel"
        />
        <Field
          label="Địa chỉ"
          value={form.address}
          onChange={(v) => handleChange('address', v)}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field
            label="Thành phố"
            value={form.city}
            onChange={(v) => handleChange('city', v)}
          />
          <Field
            label="Quốc gia"
            value={form.country}
            onChange={(v) => handleChange('country', v)}
          />
          <Field
            label="Zip"
            value={form.zip}
            onChange={(v) => handleChange('zip', v)}
          />
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isSaving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {isSaving ? 'Đang lưu...' : 'Lưu'}
      </button>
    </form>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  type?: 'text' | 'tel'
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}