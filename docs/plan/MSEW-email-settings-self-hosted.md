# MSEW: REFACTOR EMAIL SETTINGS — UI-DEFINED SMTP (Self-hosted Email)

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27
**Mục đích:** Wire UI Email Settings (`/settings/email`) vào notification service. Cho phép admin cấu hình SMTP + POP3 ngay trong app, không phụ thuộc Vercel/Resend.

---

## 1. Phân tích UI hiện tại

UI tại `src/app/settings/email/page.tsx` đã có sẵn các fields:

| Field | DB column | Status |
|-------|-----------|--------|
| `emailFrom` | `emailFrom` | ✅ Có |
| `emailFromName` | `emailFromName` | ✅ Có |
| `smtpHost` | `smtpHost` | ✅ Có |
| `smtpPort` | `smtpPort` | ✅ Có |
| `smtpUsername` | `smtpUsername` | ✅ Có |
| `smtpPassword` | `smtpPassword` | ✅ Có (đã có sẵn, sẽ encrypt Phase 3) |
| `smtpEncryption` | `smtpEncryption` | ✅ Có trong DB (TLS/SSL/none) |
| `emailDomain` | `emailDomain` | ✅ Có trong DB |

**Vấn đề:**
- Form chỉ là placeholder, không có `onSubmit` action
- DB columns có sẵn (`smtpEncryption`, `emailDomain`)
- Setting helper không trả `smtpEncryption` và `emailDomain`

**Mục tiêu refactor:**
1. Thêm action `updateEmailSettingsAction`
2. Encrypt SMTP password
3. Refactor `email.ts` đọc SMTP từ DB (không hard-code env)
4. Wire vào notification service
5. (Optional) POP3 cho inbox polling
6. (Optional) Test email button

---

## 2. Effort estimate

| Task | Effort |
|------|--------|
| Update Setting helper (thêm fields) | 0.5 giờ |
| Encrypt password | 0.5 giờ |
| `updateEmailSettingsAction` | 0.5 giờ |
| Wire UI form với action | 0.5 giờ |
| Refactor `email.ts` | 1 giờ |
| Test email endpoint | 1 giờ |
| POP3 polling (optional) | 2 giờ |
| **Tổng (core)** | **~3 giờ** |
| **Tổng (with POP3)** | **~5 giờ** |

---

## 3. Implementation

### BƯỚC 1: Cài package

```bash
cd "D:\IT-management"
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### BƯỚC 2: Tạo crypto helper cho SMTP password

#### `src/lib/crypto.ts`

```typescript
/**
 * Mã hóa/giải mã SMTP password bằng AES-256-GCM.
 * Key lấy từ NEXTAUTH_SECRET (đã có sẵn).
 *
 * Phase 3 sẽ chuyển sang key riêng (ENCRYPTION_KEY).
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SALT = 'snipeit-smtp-password-v1' // salt cố định cho key derivation

/**
 * Derive 32-byte key từ secret + salt bằng scrypt.
 */
function deriveKey(secret: string): Buffer {
  return scryptSync(secret, SALT, 32)
}

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET chưa được set — không thể mã hóa SMTP password.')
  }
  return deriveKey(secret)
}

/**
 * Encrypt plain text → base64 string (iv:tag:ciphertext).
 */
export function encrypt(plain: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // Format: base64(iv).base64(tag).base64(ciphertext)
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`
}

/**
 * Decrypt base64 string → plain text.
 * Trả về null nếu input không hợp lệ (không throw).
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null

  const key = getKey()
  const parts = ciphertext.split('.')
  if (parts.length !== 3) return null

  try {
    const [ivB64, tagB64, encB64] = parts
    const iv = Buffer.from(ivB64, 'base64')
    const tag = Buffer.from(tagB64, 'base64')
    const enc = Buffer.from(encB64, 'base64')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([decipher.update(enc), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}
```

### BƯỚC 3: Cập nhật `src/lib/settings.ts` — thêm `smtpEncryption` + `emailDomain`

```typescript
// File: src/lib/settings.ts — sửa interface Setting

export interface Setting {
  id: string
  updatedAt: Date
  companyName: string
  companyId: string | null
  currency: string
  timezone: string
  locale: string
  logoUrl: string | null
  primaryColor: string
  fullMultipleCompaniesSupport: boolean
  autoassignAssetsToLocation: boolean
  passwordMinLength: number
  passwordRequireSpecial: boolean
  sessionTimeoutMinutes: number
  twoFactorEnabled: boolean
  emailFrom: string | null
  emailFromName: string | null
  smtpHost: string | null
  smtpPort: number | null
  smtpUsername: string | null
  smtpPassword: string | null     // encrypted (base64)
  smtpEncryption: string | null    // 'tls' | 'ssl' | 'none'
  emailDomain: string | null
  extras: Record<string, unknown>
}

// getSettings() và updateSettings() giữ nguyên — đã support dynamic columns.
```

### BƯỚC 4: Action `updateEmailSettingsAction`

#### `src/app/actions/email-settings.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth-guard'
import { updateSettings, getSettings } from '@/lib/settings'
import { encrypt, decrypt } from '@/lib/crypto'
import type { CommandResult } from '@/lib/errors'

export interface EmailSettingsInput {
  emailFrom: string
  emailFromName: string
  smtpHost: string
  smtpPort: number
  smtpUsername: string
  smtpPassword?: string          // optional — nếu rỗng thì giữ nguyên password cũ
  smtpEncryption: 'tls' | 'ssl' | 'none'
  emailDomain?: string
}

export interface EmailSettingsResponse extends EmailSettingsInput {
  smtpPasswordSet: boolean        // KHÔNG trả plain password về client
}

export async function getEmailSettingsAction(): Promise<CommandResult<EmailSettingsResponse>> {
  try {
    const s = await getSettings()
    return {
      ok: true,
      data: {
        emailFrom: s.emailFrom ?? '',
        emailFromName: s.emailFromName ?? '',
        smtpHost: s.smtpHost ?? '',
        smtpPort: s.smtpPort ?? 587,
        smtpUsername: s.smtpUsername ?? '',
        smtpPassword: '',           // KHÔNG trả plain text
        smtpPasswordSet: !!s.smtpPassword,
        smtpEncryption: (s.smtpEncryption as 'tls' | 'ssl' | 'none' | null) ?? 'tls',
        emailDomain: s.emailDomain ?? '',
      },
    }
  } catch (e) {
    console.error('[getEmailSettings]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi đọc cấu hình email.' }
  }
}

export async function updateEmailSettingsAction(
  data: EmailSettingsInput
): Promise<CommandResult<void>> {
  try {
    await requireRole('ADMIN')

    // Validate
    if (!data.emailFrom || !data.emailFrom.includes('@')) {
      return { ok: false, code: 'VALIDATION', message: 'Email gửi không hợp lệ.' }
    }
    if (!data.smtpHost) {
      return { ok: false, code: 'VALIDATION', message: 'SMTP Host là bắt buộc.' }
    }
    if (!data.smtpPort || data.smtpPort < 1 || data.smtpPort > 65535) {
      return { ok: false, code: 'VALIDATION', message: 'SMTP Port không hợp lệ.' }
    }

    // Encrypt password nếu có thay đổi
    let passwordToStore: string | null = null
    if (data.smtpPassword && data.smtpPassword.length > 0) {
      passwordToStore = encrypt(data.smtpPassword)
    } else {
      // Giữ nguyên password cũ
      const current = await getSettings()
      passwordToStore = current.smtpPassword // đã là encrypted
    }

    await updateSettings({
      emailFrom: data.emailFrom,
      emailFromName: data.emailFromName || 'IT Management',
      smtpHost: data.smtpHost,
      smtpPort: data.smtpPort,
      smtpUsername: data.smtpUsername || null,
      smtpPassword: passwordToStore,
      smtpEncryption: data.smtpEncryption,
      emailDomain: data.emailDomain || null,
    })

    revalidatePath('/settings/email')
    return { ok: true, data: undefined }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[updateEmailSettings]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi lưu cấu hình email.' }
  }
}

/**
 * Test gửi email — verify SMTP config hoạt động.
 * Admin gửi 1 email test đến chính email của mình.
 */
export async function testEmailAction(testEmail: string): Promise<CommandResult<void>> {
  try {
    await requireRole('ADMIN')

    if (!testEmail || !testEmail.includes('@')) {
      return { ok: false, code: 'VALIDATION', message: 'Email không hợp lệ.' }
    }

    const { sendEmail } = await import('@/lib/notifications/email')
    const React = (await import('react')).default
    const { render } = await import('@react-email/components')

    const TestEmail = () =>
      React.createElement('html', null,
        React.createElement('body', { style: { fontFamily: 'system-ui' } },
          React.createElement('h1', null, 'IT Management — Test Email'),
          React.createElement('p', null, 'Email này xác nhận cấu hình SMTP hoạt động bình thường.'),
          React.createElement('p', { style: { color: '#666' } },
            `Gửi lúc: ${new Date().toLocaleString('vi-VN')}`)
        )
      )

    const html = await render(TestEmail())

    const result = await sendEmail({
      to: testEmail,
      subject: '[IT Management] Test Email — SMTP Configuration OK',
      react: TestEmail(),
    })

    if (!result.ok) {
      return {
        ok: false,
        code: 'EMAIL_SEND_FAILED',
        message: `Gửi email thất bại: ${result.error}`,
      }
    }

    return { ok: true, data: undefined }
  } catch (e) {
    console.error('[testEmail]', e)
    return {
      ok: false,
      code: 'UNKNOWN',
      message: 'Lỗi khi test email.',
    }
  }
}
```

### BƯỚC 5: Refactor `src/lib/notifications/email.ts`

```typescript
import nodemailer, { Transporter } from 'nodemailer'
import { render } from '@react-email/components'
import { getSettings } from '@/lib/settings'
import { decrypt } from '@/lib/crypto'

export interface EmailPayload {
  to: string | string[]
  subject: string
  react: React.ReactElement
  from?: string
}

export interface EmailResult {
  ok: boolean
  messageId?: string
  error?: string
}

/**
 * Cache transporter — tránh reconnect mỗi lần gửi.
 * Key cache = smtp host + port + user (nếu config đổi → reconnect).
 */
let transporterCache: {
  key: string
  transporter: Transporter
} | null = null

async function getTransporter(): Promise<Transporter | null> {
  const s = await getSettings()

  if (!s.smtpHost || !s.smtpPort) {
    console.warn('[email] SMTP chưa được cấu hình trong Settings')
    return null
  }

  const cacheKey = `${s.smtpHost}:${s.smtpPort}:${s.smtpUsername ?? ''}:${s.smtpEncryption ?? 'tls'}`

  // Reuse nếu config không đổi
  if (transporterCache?.key === cacheKey) {
    return transporterCache.transporter
  }

  const password = decrypt(s.smtpPassword)
  const encryption = s.smtpEncryption ?? 'tls'

  const transporter = nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort,
    secure: encryption === 'ssl', // SSL = port 465
    requireTLS: encryption === 'tls',
    auth: s.smtpUsername
      ? {
          user: s.smtpUsername,
          pass: password ?? '',
        }
      : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      // Không verify self-signed cert cho internal SMTP
      rejectUnauthorized: encryption !== 'none',
    },
  })

  transporterCache = { key: cacheKey, transporter }
  return transporter
}

/**
 * Gửi email qua SMTP (đọc từ Settings).
 * Trả về { ok: true } nếu gửi thành công.
 *
 * @param payload - Email payload
 * @returns { ok: true, messageId } hoặc { ok: false, error }
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const transporter = await getTransporter()
  if (!transporter) {
    return {
      ok: false,
      error: 'SMTP chưa được cấu hình. Vào /settings/email để thiết lập.',
    }
  }

  const s = await getSettings()
  const fromAddress = payload.from ?? s.emailFrom ?? 'noreply@localhost'
  const fromName = s.emailFromName ?? 'IT Management'
  const fromHeader = `"${fromName}" <${fromAddress}>`

  try {
    const html = await render(payload.react)

    const info = await transporter.sendMail({
      from: fromHeader,
      to: Array.isArray(payload.to) ? payload.to.join(', ') : payload.to,
      subject: payload.subject,
      html,
    })

    console.log(`[email] Sent: ${info.messageId} → ${payload.to}`)
    return { ok: true, messageId: info.messageId }
  } catch (e) {
    const err = e as Error
    console.error(`[email] Send failed: ${err.message}`)
    return { ok: false, error: err.message }
  }
}
```

### BƯỚC 6: Wire UI form với action

#### Refactor `src/app/settings/email/page.tsx`

```typescript
/**
 * Email Settings — F-9: SMTP config (Phase 2.2 wired).
 */
import { getEmailSettingsAction } from '@/app/actions/email-settings'
import EmailSettingsForm from '@/components/settings/EmailSettingsForm'

export default async function EmailPage() {
  const result = await getEmailSettingsAction()
  if (!result.ok) return <div className="text-red-600">Lỗi: {result.message}</div>

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Email</h1>
      <p className="text-gray-500 mb-6">Cấu hình SMTP để gửi email thông báo.</p>

      <EmailSettingsForm initialData={result.data!} />
    </div>
  )
}
```

#### `src/components/settings/EmailSettingsForm.tsx`

```typescript
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
  const { showToast } = useToast()

  function handleChange<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      // Nếu password rỗng và password cũ đã set → gửi empty → action giữ nguyên
      // Nếu password rỗng và password cũ chưa set → vẫn gửi empty
      const result = await updateEmailSettingsAction(form)
      if (result.ok) {
        showToast('success', 'Đã lưu cấu hình email')
        // Clear password field sau khi save (an toàn)
        setForm((prev) => ({ ...prev, smtpPassword: '' }))
        setPasswordSet(!!form.smtpPassword || passwordSet)
      } else {
        showToast('error', result.message ?? 'Lỗi')
      }
    } catch {
      showToast('error', 'Lỗi khi lưu')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTest() {
    if (!testEmailAddr) {
      showToast('error', 'Nhập email test')
      return
    }
    setIsTesting(true)
    try {
      const result = await testEmailAction(testEmailAddr)
      if (result.ok) {
        showToast('success', `Email test đã gửi đến ${testEmailAddr}. Kiểm tra inbox.`)
      } else {
        showToast('error', result.message ?? 'Gửi test thất bại')
      }
    } catch {
      showToast('error', 'Lỗi test')
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

      {/* Test email input (ẩn cho đến khi click Test) */}
      {isTesting === false && form.smtpHost && (
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
  value: string
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  )
}
```

### BƯỚC 7: Sửa SettingsForm cũ (nếu không dùng thì xóa)

`src/components/settings/SettingsForm.tsx` hiện đang được dùng cho các settings pages khác. GIỮ NGUYÊN, chỉ thay thế cho Email.

---

## 4. Verification

### Local test

```bash
cd "D:\IT-management"

# 1. Verify env
cat .env.local | grep NEXTAUTH_SECRET  # PHẢI có

# 2. Generate Prisma client
npx prisma generate

# 3. Type check
npx tsc --noEmit
# Expected: 0 errors

# 4. Test action (manual)
# Vào http://localhost:3000/settings/email
# Điền SMTP config
# Click "Test gửi" → check inbox
```

### Manual test scenarios

| # | Test | Expected |
|---|------|----------|
| 1 | Mở `/settings/email` | Form hiển thị với current settings |
| 2 | Click Save | Toast "Đã lưu", DB có record mới |
| 3 | Click Test gửi → check inbox | Email nhận được |
| 4 | Đổi password mới | Saved encrypted, test lại OK |
| 5 | Để trống password khi update | Password cũ giữ nguyên |
| 6 | SMTP Host rỗng → Save | Error "SMTP Host là bắt buộc" |
| 7 | Sau khi save, refresh page | Settings hiển thị đúng (password masked) |

---

## 5. So sánh với setup cũ (Resend/Vercel)

| Aspect | Trước (Resend) | Sau (UI SMTP) |
|--------|---------------|---------------|
| **Setup location** | Vercel env vars | `/settings/email` UI |
| **Configurable runtime** | ❌ Phải redeploy | ✅ Đổi trong UI |
| **Multiple SMTP** | ❌ Chỉ 1 env | ✅ Có thể config |
| **Password security** | env var | AES-256-GCM encrypted |
| **Test button** | ❌ | ✅ Built-in |
| **Vendor lock-in** | Resend | Không |
| **SMTP providers** | Resend only | Gmail, Outlook, Postfix, Mailgun, SES... |
| **POP3 support** | ❌ | ✅ Có thể thêm |

---

## 6. POP3/IMAP polling (optional)

Nếu sếp cần **đọc email từ mailbox** (ví dụ: auto-create tickets từ email support), thêm:

#### Cài package

```bash
npm install imap-simple mailparser
npm install --save-dev @types/imap-simple @types/mailparser
```

#### `src/lib/notifications/inbox-poller.ts`

```typescript
import Imap from 'imap-simple'
import { simpleParser } from 'mailparser'
import { getSettings } from '@/lib/settings'
import { decrypt } from '@/lib/crypto'

export interface InboxMessage {
  from: string
  subject: string
  text: string
  html: string
  date: Date
  messageId: string
}

export async function pollInbox(maxResults = 10): Promise<InboxMessage[]> {
  const s = await getSettings()

  if (!s.emailDomain) {
    console.warn('[inbox] Email domain chưa cấu hình')
    return []
  }

  // POP3/IMAP config từ env (để tránh user đổi runtime)
  const host = process.env.INBOX_HOST
  const port = parseInt(process.env.INBOX_PORT ?? '993')
  const user = process.env.INBOX_USER
  const password = process.env.INBOX_PASSWORD

  if (!host || !user || !password) {
    console.warn('[inbox] INBOX_HOST/USER/PASSWORD chưa set trong env')
    return []
  }

  const config = {
    imap: {
      user,
      password,
      host,
      port,
      tls: true,
      authTimeout: 10000,
    },
  }

  const connection = await Imap.connect(config)
  await connection.openBox('INBOX')

  const searchCriteria = ['UNSEEN']
  const fetchOptions = { bodies: ['HEADER', 'TEXT'], markSeen: true }

  const messages = await connection.search(searchCriteria, fetchOptions)
  const limit = messages.slice(-maxResults)

  const parsed: InboxMessage[] = []
  for (const msg of limit) {
    const all = Imap.parseParts(msg.attributes.parts)
    const text = (all.find((p) => p.which === 'TEXT')?.body as string) ?? ''
    const header = msg.attributes.header as { from?: string[]; subject?: string[]; date?: string[]; 'message-id'?: string[] }

    parsed.push({
      from: header.from?.[0] ?? '',
      subject: header.subject?.[0] ?? '',
      text,
      html: '',
      date: new Date(header.date?.[0] ?? Date.now()),
      messageId: header['message-id']?.[0] ?? '',
    })
  }

  await connection.end()
  return parsed
}
```

> **Lưu ý:** POP3/IMAP credentials nên đặt trong env (không cho user đổi runtime qua UI — security risk).

---

## 7. Migration từ setup cũ

Nếu trước đó dùng Resend:

```bash
# 1. Bỏ Resend
npm uninstall resend

# 2. Code đã refactor — KHÔNG cần sửa notification service
# (chỉ cần wire SMTP qua UI)

# 3. Deploy
git add .
git commit -m "Email: SMTP config via UI (no Resend)"
git push

# 4. Sau khi deploy, admin vào /settings/email → điền SMTP
```

---

## 8. Effort breakdown

| Step | Effort | Status |
|------|--------|--------|
| 1. Cài package | 5 phút | ⏳ |
| 2. `src/lib/crypto.ts` | 30 phút | ⏳ |
| 3. Update `settings.ts` | 5 phút | ⏳ |
| 4. `email-settings.ts` action | 1 giờ | ⏳ |
| 5. Refactor `email.ts` | 1 giờ | ⏳ |
| 6. UI Form component | 1.5 giờ | ⏳ |
| 7. Verification | 30 phút | ⏳ |
| **Tổng core** | **~5 giờ** | |
| 8. POP3 polling (optional) | 2 giờ | ⏳ |

---

## 9. Checklist

```
Phase 1: Code
- [ ] src/lib/crypto.ts tạo
- [ ] src/lib/settings.ts cập nhật interface
- [ ] src/app/actions/email-settings.ts tạo (3 actions)
- [ ] src/lib/notifications/email.ts refactor
- [ ] src/components/settings/EmailSettingsForm.tsx tạo
- [ ] src/app/settings/email/page.tsx refactor

Phase 2: Verify
- [ ] tsc --noEmit pass
- [ ] Local test Save → DB updated
- [ ] Local test Test gửi → email nhận được
- [ ] Test password encrypt/decrypt roundtrip
- [ ] Test giữ password cũ khi update không đổi

Phase 3: Deploy
- [ ] Commit + push
- [ ] Vercel build success
- [ ] Vào /settings/email trên production
- [ ] Test với SMTP thật (Gmail, Postfix, Mailgun...)
```

---

**HẾT MSEW-email-settings-self-hosted.md**

Tổng kết: Refactor UI `/settings/email` thành SMTP config hoàn chỉnh. Admin đổi SMTP runtime không cần redeploy. Password encrypted AES-256-GCM. Tích hợp built-in test button. POP3 polling optional cho inbox automation. Effort core ~5 giờ.