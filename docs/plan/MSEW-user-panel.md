# MSEW: USER PANEL — Self-service profile/password/avatar (Phase mới)

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27
**Trả lời câu hỏi:** User Panel sẽ thực hiện ở **Phase riêng** (đề xuất: **Phase 4.5** hoặc gộp vào **Phase 5**)
**Lý do:** Hiện tại Master Roadmap chỉ có Epic H (Notifications) + Epic I (File Storage) cho Phase 4 — KHÔNG có User Panel.

---

## 1. Phân tích hiện trạng

### Master Roadmap hiện tại

| Phase | Epics | Status |
|-------|-------|--------|
| Phase 1 | Schema (Epic A1, A2) | ✅ Done |
| Phase 2 | UI Core (B, C, D, E, F, G) | ✅ Done |
| Phase 3 | Reports + Advanced (J, K) | ✅ Done |
| **Phase 4** | **H (Notifications) + I (File Storage)** | ⏳ In progress |
| Phase 5 | L (SSO) + M + N | Planning |
| Phase 6 | O (AI/ML) | Planning |

→ **User Panel CHƯA có trong roadmap** — cần bổ sung.

### User Panel là gì?

Self-service UI cho user thường (không phải admin) tự quản lý:
- **Profile** (firstName, lastName, phone, address, department, ...)
- **Avatar** (upload ảnh đại diện)
- **Password** (đổi password, password history)
- **Email/Phone update** (cần verify OTP)
- **Notification preferences** (email per event, Slack per event, mute)
- **Active sessions** (xem + revoke other devices)
- **2FA enrollment** (TOTP QR code)
- **API tokens** (personal access tokens)

### Tại sao phải làm?

| Vấn đề | Impact |
|--------|--------|
| User phải nhờ admin đổi password | Tốn thời gian admin, support ticket |
| Avatar mặc định cho tất cả user | UX kém |
| Không có notification opt-out | User spam email |
| Không có session management | Bảo mật yếu |
| Không có 2FA | Bảo mật yếu cho admin accounts |

---

## 2. Đề xuất Phase

### Option A: **Phase 4.5** (recommend)

Chèn vào giữa Phase 4 và Phase 5. Lý do:
- Tận dụng **Epic I File Storage** (đã có upload API) → làm avatar ngay
- Tận dụng **Epic H Notifications** (đã có email service) → password reset qua email
- Tận dụng **Epic F Settings** → thêm 2 sub-pages `/account/*`

| Phase | Mục tiêu | Effort | Status |
|-------|----------|--------|--------|
| Phase 4 | Notifications + File Storage | 6 ngày | ⏳ |
| **Phase 4.5** | **User Panel** | **3-4 ngày** | **🆕 Đề xuất** |
| Phase 5 | SSO + Ecosystem | 12 ngày | Planning |

### Option B: Gộp vào **Phase 5** (L = SSO)

User Panel đi kèm SSO vì:
- Cùng liên quan đến authentication
- SSO có "linked accounts" UI tương tự

| Phase | Mục tiêu | Effort |
|-------|----------|--------|
| Phase 4 | Notifications + File Storage | 6 ngày |
| Phase 5 | SSO + User Panel + M + N | 14 ngày (+2) |

### Option C: Phase riêng **Phase 7** (sau Phase 6)

Làm sau AI/ML. **Không recommend** — security gap quá lâu.

### **Khuyến nghị: Option A — Phase 4.5** ✅

Lý do:
1. Security gap (password change) → không nên đợi 6+ tháng
2. Tận dụng Epic H+I vừa xong
3. Effort nhỏ (3-4 ngày) vì infrastructure đã sẵn
4. User experience cải thiện ngay lập tức

---

## 3. Phạm vi User Panel

### 3.1 MVP (Core — bắt buộc)

| # | Feature | Effort | Priority |
|---|---------|--------|----------|
| **UP-1** | Profile page — sửa firstName, lastName, phone, address, department | 0.5 ngày | P0 |
| **UP-2** | Avatar upload — dùng Epic I upload API | 0.25 ngày | P0 |
| **UP-3** | Change password (cần password cũ) | 0.5 ngày | P0 |
| **UP-4** | Forgot password qua email — dùng Epic H email | 1 ngày | P0 |
| **UP-5** | Notification preferences — bật/tắt email per event | 0.5 ngày | P1 |

### 3.2 Nice to have

| # | Feature | Effort | Priority |
|---|---------|--------|----------|
| **UP-6** | Active sessions list + revoke | 0.5 ngày | P1 |
| **UP-7** | 2FA enrollment (TOTP) | 1 ngày | P1 |
| **UP-8** | API tokens (personal access tokens) | 1 ngày | P2 |
| **UP-9** | Email change with OTP verify | 1 ngày | P2 |
| **UP-10** | Account deletion (GDPR) | 0.5 ngày | P2 |

**Tổng MVP:** ~3 ngày
**Tổng MVP + nice-to-have:** ~7 ngày

---

## 4. Implementation

### BƯỚC 1: Prisma schema changes

#### `prisma/schema.prisma` — thêm fields

```prisma
model User {
  // ... existing fields ...

  // === Profile (UP-1) ===
  phone        String?
  address      String?
  city         String?
  state        String?
  country      String?  @default("VN")
  zipCode      String?

  // === Notification preferences (UP-5) ===
  emailNotifyCheckout     Boolean @default(true)
  emailNotifyCheckin      Boolean @default(false)
  emailNotifyOverdue      Boolean @default(true)
  emailNotifyReminder     Boolean @default(true)
  emailNotifyAuditDue     Boolean @default(false)
  emailNotifyLicenseExpire Boolean @default(false)

  // === Security (UP-3, UP-4) ===
  passwordChangedAt        DateTime?
  passwordResetTokens      PasswordResetToken[]
  emailVerifyTokens        EmailVerifyToken[]

  // === Sessions (UP-6) — dùng NextAuth Account thay ===
  // (NextAuth JWT có timestamp built-in)

  // === 2FA (UP-7) ===
  twoFactorSecret          String?  // encrypted
  twoFactorEnabled         Boolean  @default(false)
  twoFactorBackupCodes     String[] // hashed

  // === API tokens (UP-8) ===
  apiTokens                ApiToken[]
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([expiresAt])
}

model EmailVerifyToken {
  id        String   @id @default(cuid())
  userId    String
  newEmail  String
  tokenHash String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ApiToken {
  id          String   @id @default(cuid())
  userId      String
  name        String
  tokenHash   String   @unique  // SHA-256 của token
  prefix      String              // 8 ký tự đầu (để hiển thị)
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  revokedAt   DateTime?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenHash])
  @@index([userId])
}
```

### BƯỚC 2: Layout + Navigation

#### `src/app/account/layout.tsx`

```typescript
/**
 * User Panel layout — sidebar nav cho self-service.
 */
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import UserPanelNav from '@/components/account/UserPanelNav'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UserPanelNav user={session.user} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
```

#### `src/components/account/UserPanelNav.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Lock, Bell, Shield, Key } from 'lucide-react'

export default function UserPanelNav({ user }: { user: { firstName?: string | null; lastName?: string | null; avatar?: string | null } }) {
  const pathname = usePathname()

  const items = [
    { href: '/account/profile', label: 'Profile', icon: User },
    { href: '/account/password', label: 'Mật khẩu', icon: Lock },
    { href: '/account/notifications', label: 'Thông báo', icon: Bell },
    { href: '/account/security', label: 'Bảo mật', icon: Shield },
    { href: '/account/tokens', label: 'API tokens', icon: Key },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="mb-6 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-semibold text-gray-900">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-gray-500">User Panel</p>
      </div>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

### BƯỚC 3: Profile page

#### `src/app/account/profile/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import ProfileForm from '@/components/account/ProfileForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
  })

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Profile</h1>
      <p className="text-gray-500 mb-6">Quản lý thông tin cá nhân.</p>
      <ProfileForm user={user!} />
    </div>
  )
}
```

#### `src/components/account/ProfileForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Save, Camera, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { updateProfileAction, uploadAvatarAction } from '@/app/actions/account'

export default function ProfileForm({
  user,
}: {
  user: {
    id: string
    firstName: string
    lastName: string | null
    username: string
    email: string
    phone: string | null
    address: string | null
    city: string | null
    country: string | null
    zipCode: string | null
    avatar: string | null
  }
}) {
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName ?? '',
    phone: user.phone ?? '',
    address: user.address ?? '',
    city: user.city ?? '',
    country: user.country ?? '',
    zipCode: user.zipCode ?? '',
  })
  const [avatar, setAvatar] = useState(user.avatar)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const { showToast } = useToast()

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024) {
      showToast('error', 'Avatar tối đa 1MB')
      return
    }
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'avatar')
    formData.append('entityId', user.id)
    try {
      const result = await uploadAvatarAction(formData)
      if (result.ok) {
        setAvatar(result.data!.url)
        showToast('success', 'Đã upload avatar')
      } else {
        showToast('error', result.message ?? 'Lỗi upload')
      }
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const result = await updateProfileAction(form)
      if (result.ok) showToast('success', 'Đã lưu')
      else showToast('error', result.message ?? 'Lỗi')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6">
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div className="relative">
          {avatar ? (
            <Image src={avatar} alt="avatar" width={96} height={96} className="rounded-full object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-500">
              {user.firstName[0]}
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
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
          <p className="text-xs text-gray-500 mt-2">PNG/JPG/WEBP, tối đa 1MB.</p>
        </div>
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tên" value={form.firstName} onChange={(v) => setForm({ ...form, firstName: v })} required />
        <Field label="Họ" value={form.lastName} onChange={(v) => setForm({ ...form, lastName: v })} />
      </div>

      {/* Email + Username — read only */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Username:</strong> {user.username}</p>
        <p className="text-xs text-gray-500 mt-1">Liên hệ admin để đổi email/username.</p>
      </div>

      {/* Contact info */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-gray-700">Liên hệ</legend>
        <Field label="Số điện thoại" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Địa chỉ" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <div className="grid grid-cols-3 gap-3">
          <Field label="Thành phố" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
          <Field label="Quốc gia" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
          <Field label="Zip" value={form.zipCode} onChange={(v) => setForm({ ...form, zipCode: v })} />
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

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
      />
    </div>
  )
}
```

### BƯỚC 4: Change password

#### `src/app/account/password/page.tsx`

```typescript
import ChangePasswordForm from '@/components/account/ChangePasswordForm'

export default function PasswordPage() {
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Đổi mật khẩu</h1>
      <p className="text-gray-500 mb-6">Đổi mật khẩu định kỳ để bảo vệ tài khoản.</p>
      <ChangePasswordForm />
    </div>
  )
}
```

#### `src/components/account/ChangePasswordForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { changePasswordAction } from '@/app/actions/account'

export default function ChangePasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      showToast('error', 'Mật khẩu mới không khớp')
      return
    }
    if (form.newPassword.length < 8) {
      showToast('error', 'Mật khẩu phải ≥8 ký tự')
      return
    }
    setIsSaving(true)
    try {
      const result = await changePasswordAction(form)
      if (result.ok) {
        showToast('success', 'Đã đổi mật khẩu')
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        showToast('error', result.message ?? 'Lỗi')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <Field
        label="Mật khẩu hiện tại"
        value={form.currentPassword}
        onChange={(v) => setForm({ ...form, currentPassword: v })}
        type="password"
        required
      />
      <Field
        label="Mật khẩu mới"
        value={form.newPassword}
        onChange={(v) => setForm({ ...form, newPassword: v })}
        type="password"
        required
      />
      <Field
        label="Xác nhận mật khẩu mới"
        value={form.confirmPassword}
        onChange={(v) => setForm({ ...form, confirmPassword: v })}
        type="password"
        required
      />
      <button
        type="submit"
        disabled={isSaving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
        {isSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
      </button>
    </form>
  )
}

function Field({ label, value, onChange, type, required }: any) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
      />
    </div>
  )
}
```

### BƯỚC 5: Server actions

#### `src/app/actions/account.ts`

```typescript
'use server'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/notifications/email'
import PasswordResetEmail from '@/emails/PasswordResetEmail'
import { rateLimit } from '@/lib/rate-limit'
import { getSettings } from '@/lib/settings'
import type { CommandResult } from '@/lib/errors'

// === Auth guard ===
async function requireUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('UNAUTHORIZED')
  return session.user
}

// === UP-1: Update profile ===
export async function updateProfileAction(data: {
  firstName: string
  lastName: string
  phone?: string
  address?: string
  city?: string
  country?: string
  zipCode?: string
}): Promise<CommandResult<void>> {
  try {
    const user = await requireUser()

    if (!data.firstName || data.firstName.length < 1) {
      return { ok: false, code: 'VALIDATION', message: 'Tên không được để trống.' }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        country: data.country || null,
        zipCode: data.zipCode || null,
      },
    })

    revalidatePath('/account/profile')
    return { ok: true, data: undefined }
  } catch (e) {
    if (e instanceof Error && e.message === 'UNAUTHORIZED') {
      return { ok: false, code: 'FORBIDDEN', message: 'Chưa đăng nhập.' }
    }
    console.error('[updateProfile]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi lưu profile.' }
  }
}

// === UP-3: Change password ===
export async function changePasswordAction(data: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<CommandResult<void>> {
  try {
    const user = await requireUser()
    const limit = await rateLimit(`password-change:${user.id}`, { limit: 3, window: 60_000 })
    if (!limit.ok) return { ok: false, code: 'RATE_LIMIT', message: 'Thử lại sau ít phút.' }

    if (data.newPassword !== data.confirmPassword) {
      return { ok: false, code: 'VALIDATION', message: 'Mật khẩu mới không khớp.' }
    }
    if (data.newPassword.length < 8) {
      return { ok: false, code: 'VALIDATION', message: 'Mật khẩu phải ≥8 ký tự.' }
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser?.password) {
      return { ok: false, code: 'AUTH', message: 'Tài khoản dùng SSO, không thể đổi mật khẩu local.' }
    }

    const match = await bcrypt.compare(data.currentPassword, dbUser.password)
    if (!match) {
      return { ok: false, code: 'AUTH', message: 'Mật khẩu hiện tại không đúng.' }
    }

    // TODO Phase 4.5+ : check password history (không cho reuse last 5)
    const hashed = await bcrypt.hash(data.newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        passwordChangedAt: new Date(),
      },
    })

    return { ok: true, data: undefined }
  } catch (e) {
    console.error('[changePassword]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi đổi mật khẩu.' }
  }
}

// === UP-4: Forgot password — request reset ===
export async function requestPasswordResetAction(email: string): Promise<CommandResult<void>> {
  try {
    // Rate limit by email (không require login)
    const limit = await rateLimit(`password-reset:${email}`, { limit: 3, window: 60_000 * 15 }) // 3 attempts / 15 min
    if (!limit.ok) return { ok: false, code: 'RATE_LIMIT', message: 'Quá nhiều yêu cầu. Thử lại sau.' }

    const dbUser = await prisma.user.findUnique({ where: { email } })
    // SECURITY: luôn trả ok (tránh email enumeration)
    if (!dbUser) {
      console.log('[password-reset] Email không tồn tại:', email)
      return { ok: true, data: undefined }
    }

    // Generate token
    const raw = crypto.randomBytes(32).toString('base64url')
    const tokenHash = crypto.createHash('sha256').update(raw).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 giờ

    await prisma.passwordResetToken.create({
      data: {
        userId: dbUser.id,
        tokenHash,
        expiresAt,
      },
    })

    // Send email
    const s = await getSettings()
    const appUrl = s.emailDomain
      ? `https://it-management.${s.emailDomain}`
      : process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

    const resetUrl = `${appUrl}/account/reset-password?token=${raw}`

    await sendEmail({
      to: dbUser.email!,
      subject: '[IT Management] Đặt lại mật khẩu',
      react: PasswordResetEmail({
        userName: `${dbUser.firstName} ${dbUser.lastName ?? ''}`.trim(),
        resetUrl,
        expiresInMinutes: 60,
      }),
    })

    return { ok: true, data: undefined }
  } catch (e) {
    console.error('[requestPasswordReset]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi gửi email đặt lại.' }
  }
}

// === UP-4: Reset password (with token) ===
export async function resetPasswordAction(data: {
  token: string
  newPassword: string
}): Promise<CommandResult<void>> {
  try {
    const tokenHash = crypto.createHash('sha256').update(data.token).digest('hex')

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })

    if (!record) {
      return { ok: false, code: 'VALIDATION', message: 'Token không hợp lệ.' }
    }
    if (record.usedAt) {
      return { ok: false, code: 'VALIDATION', message: 'Token đã được sử dụng.' }
    }
    if (record.expiresAt < new Date()) {
      return { ok: false, code: 'VALIDATION', message: 'Token đã hết hạn.' }
    }

    if (data.newPassword.length < 8) {
      return { ok: false, code: 'VALIDATION', message: 'Mật khẩu phải ≥8 ký tự.' }
    }

    const hashed = await bcrypt.hash(data.newPassword, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed, passwordChangedAt: new Date() },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return { ok: true, data: undefined }
  } catch (e) {
    console.error('[resetPassword]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi đặt lại mật khẩu.' }
  }
}

// === UP-2: Upload avatar — dùng Epic I API ===
export async function uploadAvatarAction(formData: FormData): Promise<CommandResult<{ url: string }>> {
  try {
    const user = await requireUser()

    // Tái sử dụng /api/upload endpoint
    const file = formData.get('file') as File | null
    if (!file) return { ok: false, code: 'VALIDATION', message: 'Chưa chọn file.' }
    if (file.size > 1024 * 1024) {
      return { ok: false, code: 'VALIDATION', message: 'Avatar tối đa 1MB.' }
    }

    // Forward tới /api/upload (gọi internal)
    const forwarded = new FormData()
    forwarded.append('file', file)
    forwarded.append('type', 'avatar')
    forwarded.append('entityId', user.id)

    // Direct call (nội bộ Next.js) — không qua HTTP
    const uploadModule = await import('@/lib/upload')
    const result = await uploadModule.uploadFile({
      file,
      type: 'avatar',
      entityId: user.id,
    })

    if (!result.ok) {
      return { ok: false, code: 'UNKNOWN', message: result.error ?? 'Upload thất bại.' }
    }

    // Update avatar URL
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: result.url },
    })

    revalidatePath('/account/profile')
    return { ok: true, data: { url: result.url } }
  } catch (e) {
    console.error('[uploadAvatar]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi upload avatar.' }
  }
}

// === UP-5: Notification preferences ===
export async function updateNotificationPrefsAction(prefs: {
  emailNotifyCheckout: boolean
  emailNotifyCheckin: boolean
  emailNotifyOverdue: boolean
  emailNotifyReminder: boolean
  emailNotifyAuditDue: boolean
  emailNotifyLicenseExpire: boolean
}): Promise<CommandResult<void>> {
  try {
    const user = await requireUser()
    await prisma.user.update({
      where: { id: user.id },
      data: prefs,
    })
    revalidatePath('/account/notifications')
    return { ok: true, data: undefined }
  } catch (e) {
    console.error('[updateNotificationPrefs]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi lưu preferences.' }
  }
}
```

### BƯỚC 6: Reset password page

#### `src/app/account/reset-password/page.tsx`

```typescript
import { Suspense } from 'react'
import ResetPasswordForm from '@/components/account/ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
```

#### `src/components/account/ResetPasswordForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { resetPasswordAction } from '@/app/actions/account'

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

  if (!token) {
    return <div className="text-red-600">Token không hợp lệ.</div>
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      showToast('error', 'Mật khẩu không khớp')
      return
    }
    setIsSaving(true)
    try {
      const result = await resetPasswordAction({ token: token!, newPassword: password })
      if (result.ok) {
        showToast('success', 'Đã đặt lại mật khẩu. Đăng nhập lại...')
        router.push('/login')
      } else {
        showToast('error', result.message ?? 'Lỗi')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-20 bg-white p-6 rounded-xl border">
      <div className="flex items-center gap-2 mb-4">
        <Lock size={20} className="text-blue-600" />
        <h1 className="text-xl font-bold">Đặt lại mật khẩu</h1>
      </div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mật khẩu mới (≥8 ký tự)"
        required
        className="w-full mb-3 rounded border px-3 py-2"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Xác nhận"
        required
        className="w-full mb-4 rounded border px-3 py-2"
      />
      <button type="submit" disabled={isSaving} className="w-full bg-blue-600 text-white py-2 rounded">
        {isSaving ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
      </button>
    </form>
  )
}
```

### BƯỚC 7: Notification preferences page

#### `src/app/account/notifications/page.tsx`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import NotificationPrefsForm from '@/components/account/NotificationPrefsForm'

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } })

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Thông báo</h1>
      <p className="text-gray-500 mb-6">Bật/tắt email cho từng sự kiện.</p>
      <NotificationPrefsForm prefs={{
        emailNotifyCheckout: user!.emailNotifyCheckout,
        emailNotifyCheckin: user!.emailNotifyCheckin,
        emailNotifyOverdue: user!.emailNotifyOverdue,
        emailNotifyReminder: user!.emailNotifyReminder,
        emailNotifyAuditDue: user!.emailNotifyAuditDue,
        emailNotifyLicenseExpire: user!.emailNotifyLicenseExpire,
      }} />
    </div>
  )
}
```

#### `src/components/account/NotificationPrefsForm.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { updateNotificationPrefsAction } from '@/app/actions/account'

interface Prefs {
  emailNotifyCheckout: boolean
  emailNotifyCheckin: boolean
  emailNotifyOverdue: boolean
  emailNotifyReminder: boolean
  emailNotifyAuditDue: boolean
  emailNotifyLicenseExpire: boolean
}

const PREF_LABELS: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: 'emailNotifyCheckout', label: 'Asset giao cho tôi', desc: 'Email khi nhận được tài sản mới.' },
  { key: 'emailNotifyOverdue', label: 'Asset quá hạn', desc: 'Email khi không thu hồi đúng hạn.' },
  { key: 'emailNotifyReminder', label: 'Asset sắp đến hạn', desc: 'Nhắc nhở 3 ngày trước due date.' },
  { key: 'emailNotifyCheckin', label: 'Asset được thu hồi', desc: '(Admin only) Khi có người checkin asset của tôi.' },
  { key: 'emailNotifyAuditDue', label: 'Audit due', desc: 'Email khi đến hạn kiểm kê.' },
  { key: 'emailNotifyLicenseExpire', label: 'License sắp hết hạn', desc: 'Email khi license sắp expire.' },
]

export default function NotificationPrefsForm({ prefs }: { prefs: Prefs }) {
  const [form, setForm] = useState(prefs)
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)
    try {
      const result = await updateNotificationPrefsAction(form)
      if (result.ok) showToast('success', 'Đã lưu preferences')
      else showToast('error', result.message ?? 'Lỗi')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
      {PREF_LABELS.map((pref) => (
        <label key={pref.key} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            checked={form[pref.key]}
            onChange={(e) => setForm({ ...form, [pref.key]: e.target.checked })}
            className="mt-1 w-4 h-4 rounded"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{pref.label}</p>
            <p className="text-xs text-gray-500">{pref.desc}</p>
          </div>
        </label>
      ))}
      <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        {isSaving ? 'Đang lưu...' : 'Lưu'}
      </button>
    </form>
  )
}
```

### BƯỚC 8: Email template cho password reset

#### `src/emails/PasswordResetEmail.tsx`

```typescript
import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from '@react-email/components'

interface Props {
  userName: string
  resetUrl: string
  expiresInMinutes: number
}

export default function PasswordResetEmail({ userName, resetUrl, expiresInMinutes }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Đặt lại mật khẩu IT Management</Preview>
      <Body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f6f9fc', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '8px', maxWidth: '600px' }}>
          <Heading style={{ fontSize: '20px' }}>Đặt lại mật khẩu</Heading>
          <Text>Xin chào {userName},</Text>
          <Text>
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để đặt lại:
          </Text>
          <Section style={{ textAlign: 'center', margin: '24px 0' }}>
            <Link
              href={resetUrl}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '12px 24px',
                textDecoration: 'none',
                borderRadius: '6px',
                display: 'inline-block',
              }}
            >
              Đặt lại mật khẩu
            </Link>
          </Section>
          <Text style={{ fontSize: '12px', color: '#666' }}>
            Link có hiệu lực trong {expiresInMinutes} phút. Nếu bạn không yêu cầu đặt lại, có thể bỏ qua email này.
          </Text>
          <Text style={{ fontSize: '12px', color: '#999', marginTop: '24px', wordBreak: 'break-all' }}>
            Hoặc paste link này vào trình duyệt:<br />
            {resetUrl}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

---

## 5. Cập nhật Notification Service (Epic H) — tôn trọng prefs

#### `src/lib/notifications/email.ts` — wrap sendEmail

```typescript
import prisma from '@/lib/prisma'
import { sendEmail as sendRaw, type EmailPayload } from './email'

export type NotificationEvent =
  | 'CHECKOUT'
  | 'CHECKIN'
  | 'OVERDUE'
  | 'REMINDER'
  | 'AUDIT_DUE'
  | 'LICENSE_EXPIRE'

const EVENT_PREF_MAP: Record<NotificationEvent, keyof NotificationPrefs> = {
  CHECKOUT: 'emailNotifyCheckout',
  CHECKIN: 'emailNotifyCheckin',
  OVERDUE: 'emailNotifyOverdue',
  REMINDER: 'emailNotifyReminder',
  AUDIT_DUE: 'emailNotifyAuditDue',
  LICENSE_EXPIRE: 'emailNotifyLicenseExpire',
}

interface NotificationPrefs {
  emailNotifyCheckout: boolean
  emailNotifyCheckin: boolean
  emailNotifyOverdue: boolean
  emailNotifyReminder: boolean
  emailNotifyAuditDue: boolean
  emailNotifyLicenseExpire: boolean
}

/**
 * Gửi email tôn trọng user preferences.
 * Return true nếu đã gửi, false nếu user opt-out.
 */
export async function sendNotificationEmail(
  userId: string,
  event: NotificationEvent,
  payload: Omit<EmailPayload, 'to'> & { to: string }
): Promise<{ sent: boolean; reason?: string }> {
  // Load user + prefs
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailNotifyCheckout: true,
      emailNotifyCheckin: true,
      emailNotifyOverdue: true,
      emailNotifyReminder: true,
      emailNotifyAuditDue: true,
      emailNotifyLicenseExpire: true,
    },
  })
  if (!user?.email) return { sent: false, reason: 'no-email' }

  // Check preference
  const prefKey = EVENT_PREF_MAP[event]
  if (!user[prefKey]) return { sent: false, reason: 'opted-out' }

  const result = await sendRaw(payload)
  return { sent: result.ok, reason: result.error }
}
```

Update Epic H trigger:

```typescript
// Epic H trigger — checkoutAsset
import { sendNotificationEmail } from '@/lib/notifications/email'

// BEFORE:
// await sendEmail({ to: user.email, subject: '...', react: CheckoutEmail({...}) })

// AFTER:
await sendNotificationEmail(user.id, 'CHECKOUT', {
  to: user.email,
  subject: '[IT] Bạn nhận được tài sản',
  react: CheckoutEmail({...}),
})
```

---

## 6. Effort estimate

### MVP (P0 + P1 essentials)

| # | Task | Effort | Status |
|---|------|--------|--------|
| 1 | Schema update (10 fields + 3 models) | 0.5 giờ | ⏳ |
| 2 | Layout + nav | 1 giờ | ⏳ |
| 3 | Profile page | 2 giờ | ⏳ |
| 4 | Avatar upload | 1 giờ | ⏳ |
| 5 | Change password | 2 giờ | ⏳ |
| 6 | Forgot password + reset page | 3 giờ | ⏳ |
| 7 | Notification prefs | 2 giờ | ⏳ |
| 8 | Update notification service | 1 giờ | ⏳ |
| 9 | Email template | 0.5 giờ | ⏳ |
| 10 | Tests (password reset flow, prefs, upload) | 2 giờ | ⏳ |
| **Tổng** | | **~15 giờ ≈ 2 ngày** | |

### Full (có nice-to-have)

| Task | Effort |
|------|--------|
| Active sessions | 3 giờ |
| 2FA TOTP | 6 giờ |
| API tokens | 4 giờ |
| Email change OTP | 4 giờ |
| Account deletion | 2 giờ |
| **Tổng extra** | **~19 giờ** |

---

## 7. Tests

### Unit tests

```typescript
// tests/unit/account/change-password.test.ts

import { changePasswordAction } from '@/app/actions/account'

// Mock session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise({ user: { id: 'user_1' } })),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  passwordResetToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn((arr) => Promise.all(arr)),
}))

describe('changePasswordAction', () => {
  it('rejects too short password', async () => {
    const result = await changePasswordAction({
      currentPassword: 'old12345',
      newPassword: 'short',
      confirmPassword: 'short',
    })
    expect(result.ok).toBe(false)
  })

  it('rejects mismatched password', async () => {
    const result = await changePasswordAction({
      currentPassword: 'old12345',
      newPassword: 'newPassword1',
      confirmPassword: 'different',
    })
    expect(result.ok).toBe(false)
  })

  it('updates password when current matches', async () => {
    const prisma = require('@/lib/prisma')
    prisma.user.findUnique.mockResolvedValue({
      id: 'user_1',
      password: '$2a$12$...hashed...',
    })
    // Mock bcrypt compare
    jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true)
    prisma.user.update.mockResolvedValue({})

    const result = await changePasswordAction({
      currentPassword: 'old12345',
      newPassword: 'newPassword1',
      confirmPassword: 'newPassword1',
    })
    expect(result.ok).toBe(true)
  })
})
```

### E2E test

```typescript
// tests/e2e/account-password-reset.spec.ts (Playwright)

test('forgot password flow', async ({ page }) => {
  await page.goto('/login')
  await page.click('text=Quên mật khẩu?')
  await page.fill('input[type=email]', 'admin@test.com')
  await page.click('button[type=submit]')
  await expect(page.locator('text=Email đã được gửi')).toBeVisible()

  // Open email (mailhog/gmail mock)
  // ... extract reset URL
  await page.goto(resetUrl)
  await page.fill('input[type=password]:nth(0)', 'newPassword123')
  await page.fill('input[type=password]:nth(1)', 'newPassword123')
  await page.click('button[type=submit]')

  // Should redirect to login
  await expect(page).toHaveURL(/\/login/)

  // Login with new password
  await page.fill('input[name=username]', 'admin')
  await page.fill('input[name=password]', 'newPassword123')
  await page.click('button[type=submit]')
  await expect(page).toHaveURL(/\/dashboard/)
})
```

---

## 8. Security checklist

```
- [ ] Password hash bằng bcrypt cost ≥12
- [ ] Reset token SHA-256 hash (không lưu plain text)
- [ ] Reset token expires ≤1 giờ
- [ ] Reset token 1 lần (mark usedAt)
- [ ] Rate limit change password (3/phút)
- [ ] Rate limit forgot password (3/15 phút)
- [ ] Email enumeration protection (luôn trả OK)
- [ ] CSRF protection (Next.js built-in)
- [ ] Avatar upload validate type (PNG/JPG/WEBP) + size ≤1MB
- [ ] 2FA secret encrypted (AES-256-GCM)
- [ ] 2FA backup codes hashed + show 1 lần
- [ ] API tokens random 32 bytes + SHA-256 hash
- [ ] API tokens prefix để identify (e.g. sk_live_abc...)
- [ ] Sessions: revoke invalidates all next-auth tokens for user
- [ ] Account deletion: anonymize PII (GDPR compliance)
```

---

## 9. Checklist triển khai

```
Phase A: Schema + Core
- [ ] prisma schema update
- [ ] npx prisma migrate dev --name user_panel_schema
- [ ] npx prisma generate
- [ ] /account/layout.tsx + nav
- [ ] /account/profile/page.tsx
- [ ] ProfileForm + updateProfileAction
- [ ] Avatar upload (reuse Epic I)
- [ ] /account/password + ChangePasswordForm
- [ ] changePasswordAction

Phase B: Reset password (UP-4)
- [ ] PasswordResetToken model
- [ ] requestPasswordResetAction
- [ ] /account/reset-password page
- [ ] resetPasswordAction
- [ ] PasswordResetEmail template
- [ ] Rate limit

Phase C: Notification prefs (UP-5)
- [ ] 6 fields trên User schema
- [ ] /account/notifications page
- [ ] NotificationPrefsForm + action
- [ ] Update sendEmail → sendNotificationEmail
- [ ] Update Epic H triggers

Phase D: Tests
- [ ] Unit tests cho actions
- [ ] E2E password reset
- [ ] Manual test upload avatar

Phase E: Polish (optional)
- [ ] Active sessions
- [ ] 2FA TOTP
- [ ] API tokens
- [ ] Email change OTP
```

---

## 10. Effort comparison

| Option | Effort | When |
|--------|--------|------|
| Defer tới Phase 5 | Free (0 ngày) | Sau SSO, ~4-6 tháng |
| Insert Phase 4.5 | ~3 ngày | Ngay sau Phase 4 |
| Insert Phase 4 | +1 ngày | Sau Epic H+I |

→ **Recommend: Phase 4.5**, sau khi Epic H+I done, **~3 ngày đầu tư**.

---

## 11. Blocker Resolution (2026-07-28 update)

Tier 2 đã từ chối code khi chưa có scaffolding files. Tier 1 tạo 4 file scaffold + giải quyết 2 blockers sau:

### Blocker #2: Scope creep (chưa rõ MVP vs full)

**Triệu chứng:** MSEW đề xuất 3-7 ngày, có 10 features. Tier 2 không biết nên code feature nào trước.

**Giải pháp:** Tạo `ACCEPTANCE-user-panel.md` định nghĩa MVP scope chỉ 1 ngày (P0 only):
- ✅ IN: UP-1 Profile (7 fields edit), UP-2 Avatar upload, UP-3 Change password, UP-4 Security info (read-only)
- ❌ OUT (defer Phase 5+): Forgot password, 2FA, Notification prefs, API tokens, Email change, Sessions

**Effort MVP:** ~10.75h ≈ 1.4 ngày (verify trong WORKFLOW-STATUS section 9).

### Blocker #4: Thiếu SKILL ROUTING + WORKFLOW 8-step

**Triệu chứng:** Tier 2 không biết:
- Dùng agent nào cho phần nào
- Thứ tự step là gì
- Khi nào escalate

**Giải pháp:** Tạo 2 file:
- `SKILL-ROUTING-user-panel.md` — matrix 10 bước × agent/skill (xem file)
- `docs/exec/WORKFLOW-STATUS-user-panel.md` — 8-step loop + status checklist

### Điều kiện giải quyết hoàn toàn

```
✅ File 1: docs/plan/CONTEXT-user-panel.md (background + impact)
✅ File 2: docs/plan/SKILL-ROUTING-user-panel.md (agent × task matrix)
✅ File 3: docs/plan/ACCEPTANCE-user-panel.md (Definition of Done)
✅ File 4: docs/exec/WORKFLOW-STATUS-user-panel.md (8-step status)
✅ MSEW updated với Blocker Resolution section (this)
```

→ **Tier 2 có thể bắt đầu code.**

---

## 12. Updated MVP scope (2026-07-28 slice)

So với MSEW gốc đề xuất 10 features (3-7 ngày), MVP hiện tại scope xuống còn **4 features (1.4 ngày)**:

| Feature | Trong MVP | Lý do | Phase sau |
|---------|-----------|-------|-----------|
| Profile (7 fields) | ✅ P0 | Core self-service | — |
| Avatar upload | ✅ P0 | Reuse Epic I | — |
| Change password | ✅ P0 | Security cơ bản | — |
| Security info card | ✅ P0 | Read-only, effort nhỏ | Expand sessions ở Phase 5 |
| Forgot password | ❌ Defer | Cần email service production | Phase 5 |
| Notification prefs | ❌ Defer | Cần wire Epic H triggers | Phase 5 |
| 2FA TOTP | ❌ Defer | Effort lớn (3-4 ngày) | Phase 5 |
| Active sessions | ❌ Defer | Cần NextAuth event tracking | Phase 5 |
| API tokens | ❌ Defer | API chưa có auth flow | Phase 6 |
| Email change OTP | ❌ Defer | Cần SMS/email gateway | Phase 5 |

→ Nếu sau MVP user request thêm features → tạo MSEW mới, không scope creep.

---

**HẾT MSEW-user-panel.md** (rev. 2026-07-28)