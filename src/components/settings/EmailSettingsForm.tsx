'use client'

import { useState } from 'react'
import { Save, Send, Loader2 } from 'lucide-react'
import {
  updateEmailSettingsAction,
  testEmailAction,
  type EmailSettingsResponse,
} from '@/app/actions/email-settings'
import { useToast } from '@/components/Toast'

interface EmailSettingsFormProps {
  initialData: EmailSettingsResponse
}

const ENCRYPTION_OPTIONS = [
  { value: 'tls', label: 'TLS (STARTTLS, port 587) — Khuyến nghị' },
  { value: 'ssl', label: 'SSL (port 465)' },
  { value: 'none', label: 'Không mã hóa (port 25, internal only)' },
]

export default function EmailSettingsForm({ initialData }: EmailSettingsFormProps) {
  const [form, setForm] = useState({
    emailFrom: initialData.emailFrom,
    emailFromName: initialData.emailFromName,
    smtpHost: initialData.smtpHost,
    smtpPort: initialData.smtpPort,
    smtpUsername: initialData.smtpUsername,
    smtpPassword: '',                // KHÔNG hiển thị password cũ
    smtpEncryption: initialData.smtpEncryption,
    emailDomain: initialData.emailDomain,
  })
  const [passwordSet, setPasswordSet] = useState(initialData.smtpPasswordSet)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testEmailAddr, setTestEmailAddr] = useState('')
  const { show, showCommandResult } = useToast()

  function handleChange<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      // Nếu password rỗng và password cũ đã set → gửi empty → action giữ nguyên
      const result = await updateEmailSettingsAction(form)
      if (result.ok) {
        show({ type: 'success', message: 'Đã lưu cấu hình email' })
        // Clear password field sau khi save (an toàn)
        setForm((prev) => ({ ...prev, smtpPassword: '' }))
        if (form.smtpPassword) setPasswordSet(true)
      } else {
        showCommandResult(result, 'Đã lưu cấu hình email')
      }
    } catch {
      show({ type: 'error', message: 'Lỗi khi lưu' })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTest() {
    if (!testEmailAddr) {
      show({ type: 'error', message: 'Nhập email test' })
      return
    }
    setIsTesting(true)
    try {
      const result = await testEmailAction(testEmailAddr)
      if (result.ok) {
        show({ type: 'success', message: `Email test đã gửi đến ${testEmailAddr}. Kiểm tra inbox.` })
      } else {
        showCommandResult(result, 'Test gửi thành công')
      }
    } catch {
      show({ type: 'error', message: 'Lỗi test' })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6">
      {/* Sender info */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-700">Người gửi</legend>
        <Field
          label="Email gửi"
          description="Địa chỉ email người gửi (phải là email thật trên domain SMTP)."
          value={form.emailFrom}
          onChange={(v) => handleChange('emailFrom', v)}
          placeholder="noreply@congty.com"
          required
        />
        <Field
          label="Tên người gửi"
          description="Tên hiển thị khi nhận email."
          value={form.emailFromName}
          onChange={(v) => handleChange('emailFromName', v)}
          placeholder="IT Management"
        />
      </fieldset>

      {/* SMTP config */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-700">SMTP Server</legend>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Field
              label="SMTP Host"
              value={form.smtpHost}
              onChange={(v) => handleChange('smtpHost', v)}
              placeholder="smtp.gmail.com"
              required
            />
          </div>
          <Field
            label="Port"
            value={String(form.smtpPort)}
            onChange={(v) => handleChange('smtpPort', parseInt(v) || 587)}
            placeholder="587"
            type="number"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Mã hóa</label>
          <select
            value={form.smtpEncryption}
            onChange={(e) => handleChange('smtpEncryption', e.target.value as 'tls' | 'ssl' | 'none')}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            {ENCRYPTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <Field
          label="Username"
          value={form.smtpUsername}
          onChange={(v) => handleChange('smtpUsername', v)}
          placeholder="user@congty.com"
          autoComplete="off"
        />
        <Field
          label="Password"
          description={
            passwordSet
              ? '✅ Đã cấu hình. Để trống nếu không muốn đổi.'
              : 'Chưa cấu hình.'
          }
          value={form.smtpPassword}
          onChange={(v) => handleChange('smtpPassword', v)}
          type="password"
          placeholder={passwordSet ? '•••••••• (giữ nguyên)' : 'Nhập password'}
          autoComplete="new-password"
        />
      </fieldset>

      {/* Email domain (cho internal email matching) */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-700">Nâng cao</legend>
        <Field
          label="Email Domain"
          description="Domain công ty — dùng để match user email khi login (optional)."
          value={form.emailDomain}
          onChange={(v) => handleChange('emailDomain', v)}
          placeholder="congty.com"
        />
      </fieldset>

      {/* Action buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </button>

        <button
          type="button"
          onClick={handleTest}
          disabled={isTesting || !form.smtpHost}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {isTesting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {isTesting ? 'Đang gửi...' : 'Test gửi'}
        </button>
      </div>

      {/* Test email input (hiện khi đã có host) */}
      {!isTesting && form.smtpHost && (
        <div className="flex gap-2 items-center bg-gray-50 rounded-lg p-3">
          <label className="text-sm text-gray-600">Gửi test đến:</label>
          <input
            type="email"
            value={testEmailAddr}
            onChange={(e) => setTestEmailAddr(e.target.value)}
            placeholder="admin@congty.com"
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </div>
      )}
    </form>
  )
}

function Field({
  label,
  description,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  autoComplete,
}: {
  label: string
  description?: string
  value: string | undefined
  onChange: (v: string) => void
  placeholder?: string
  type?: 'text' | 'number' | 'password'
  required?: boolean
  autoComplete?: string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}