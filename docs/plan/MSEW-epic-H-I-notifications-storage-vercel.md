# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC H+I — NOTIFICATIONS + FILE STORAGE (Vercel + Neon Stack)

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-27
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · B ✅ · C ✅ · C+1 ✅ · D ✅ · E ✅ · F ✅ · G ✅ · J ✅ · K ✅
**Triển khai:** Vercel (Next.js) + Neon (Postgres) + Vercel Blob (file storage) + Resend (email)

---

## 0. Stack decision cho Vercel + Neon

| Service | Vai trò | Lý do chọn |
|---------|---------|------------|
| **Vercel** | Hosting Next.js | Serverless functions, Edge runtime |
| **Neon** | Postgres | Branching, serverless, free tier 0.5GB |
| **Vercel Blob** | File storage | Native Vercel integration, không cần S3 credentials |
| **Resend** | Email | Vercel-native, DX tốt nhất |
| **React Email** | Email templates | Components-based, dễ preview |
| **Upstash Redis** | Rate limiting | Vercel-native, serverless |

---

## 1. Trade-offs vs self-hosted

| Concern | Vercel + Neon | Self-hosted (S3 + SMTP) |
|---------|---------------|-------------------------|
| Cold start | ~50-200ms (Neon) | 0ms |
| Cost | Pay-per-use | Fixed monthly |
| Setup time | 5 phút | 2 giờ |
| Vendor lock-in | Medium | Low |
| File storage limit | 500MB (free) | Unlimited |
| Email limit | 100/day (free) | Unlimited |

---

## 2. Phạm vi Epic H (Notifications) + Epic I (File Storage)

### Epic H — 3 deliverables

| # | Deliverable | Mục đích | Effort |
|---|-------------|----------|--------|
| **H-1** | Resend Email Service | Gửi email thật | 1 ngày |
| **H-2** | Email Templates | Templates cho checkout/checkin/reminder | 1 ngày |
| **H-3** | Notification Triggers | Auto-send emails từ domain commands | 0.5 ngày |

### Epic I — 4 deliverables

| # | Deliverable | Mục đích | Effort |
|---|-------------|----------|--------|
| **I-1** | Vercel Blob Client | Upload file | 0.5 ngày |
| **I-2** | Upload API | `/api/upload` endpoint | 0.5 ngày |
| **I-3** | Logo + Avatar + Asset Image Upload UI | UI cho 3 loại upload | 1.5 ngày |
| **I-4** | Image preview + delete | UX polish | 0.5 ngày |

**Tổng:** ~5.5 ngày

---

## 3. Vercel + Neon Setup (BƯỚC 0)

### 3.1 Neon Setup

```bash
# 1. Tạo Neon project
# https://console.neon.tech → New Project → "it-management"
# Region: Singapore (gần VN)

# 2. Copy connection string
# postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/itmanagement?sslmode=require

# 3. Set DATABASE_URL trong .env.local
DATABASE_URL="postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/itmanagement?sslmode=require"

# 4. Test connection
npx prisma db push
```

**Lưu ý Neon:**
- Connection pooling BẮT BUỘC cho serverless (Vercel)
- Neon cung cấp 2 connection strings:
  - **Pooled**: `?pgbouncer=true&connect_timeout=15` — dùng cho app runtime
  - **Direct**: không pgbouncer — dùng cho migrations

```bash
# .env.local
DATABASE_URL="postgresql://...?sslmode=require"           # Pooled (cho app)
DIRECT_URL="postgresql://...?sslmode=require"            # Direct (cho migrations)
```

### 3.2 Vercel Project Setup

```bash
# 1. Connect GitHub repo
# 2. Set Environment Variables:
DATABASE_URL=<from neon>
DIRECT_URL=<from neon>
NEXTAUTH_SECRET=<generated>
NEXTAUTH_URL=https://your-app.vercel.app
RESEND_API_KEY=<from resend>
BLOB_READ_WRITE_TOKEN=<auto-set by vercel blob>

# 3. Set Build Command
npm run build

# 4. Set Output Directory (nếu cần)
# Mặc định Next.js output

# 5. Deploy
vercel --prod
```

### 3.3 Neon Migration trên Vercel

```bash
# Vercel sẽ tự động chạy `npx prisma generate` nếu có postinstall script
# Nhưng migration cần chạy thủ công:

# Local: chạy migration → push lên Neon production
DATABASE_URL="<direct_url>" npx prisma migrate deploy

# Hoặc dùng Neon Console → SQL Editor để paste migration
```

### 3.4 Vercel Blob Setup

```bash
# Trong Vercel Dashboard:
# Storage → Create Database → Blob → "it-management-blob"

# Vercel tự động set env var:
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxx"

# Local dev: copy token từ Vercel dashboard
```

### 3.5 Resend Setup

```bash
# 1. Tạo account: https://resend.com
# 2. Verify domain (hoặc dùng onboarding@resend.com để test)
# 3. Copy API key

RESEND_API_KEY="re_xxx"
RESEND_FROM_EMAIL="IT Management <noreply@yourdomain.com>"
```

---

## 4. Prisma Schema Changes (cho Epic H + I)

### 4.1 File metadata fields (cho Epic I)

```prisma
// prisma/schema.prisma — thêm vào model Asset
model Asset {
  // ... existing fields ...

  image String?  // URL của file trên Vercel Blob

  // ... existing fields ...
}

// Thêm vào model User
model User {
  // ... existing fields ...
  avatar String?  // URL avatar
  // ... existing fields ...
}

// Thêm vào model Setting (hoặc tạo mới)
model SystemSetting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 4.2 Migration

```bash
npx prisma migrate dev --name add_image_avatar
# Review SQL → apply
npx prisma migrate deploy  # trên Neon production
```

---

## PHẦN 1: EPIC H — NOTIFICATIONS

### BƯỚC 1: Cài packages

```bash
npm install resend @react-email/components
npm install --save-dev react-email
```

### BƯỚC 2: Tạo `src/lib/notifications/email.ts`

```typescript
import { Resend } from 'resend'
import { render } from '@react-email/components'

// Singleton — Vercel serverless cần reuse instance
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export interface EmailPayload {
  to: string | string[]
  subject: string
  react: React.ReactElement
  from?: string
}

export interface EmailResult {
  ok: boolean
  id?: string
  error?: string
}

/**
 * Gửi email qua Resend.
 * Trả về { ok: true } nếu gửi thành công, ngược lại { ok: false, error }.
 *
 * Lưu ý Vercel: function này chạy trong serverless, timeout 10s (Hobby) / 60s (Pro).
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY chưa set — skip send')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const html = await render(payload.react)

    const { data, error } = await resend.emails.send({
      from: payload.from ?? process.env.RESEND_FROM_EMAIL ?? 'IT Management <onboarding@resend.dev>',
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html,
    })

    if (error) {
      console.error('[email] Resend error:', error)
      return { ok: false, error: error.message }
    }

    return { ok: true, id: data?.id }
  } catch (e) {
    console.error('[email] Unexpected error:', e)
    return { ok: false, error: (e as Error).message }
  }
}
```

---

### BƯỚC 3: Tạo Email Templates

#### `src/emails/CheckoutNotification.tsx`

```typescript
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Button,
  Hr,
} from '@react-email/components'

interface CheckoutNotificationProps {
  userName: string
  assetTag: string
  assetName: string
  checkoutDate: string
  expectedCheckin?: string
  notes?: string
  appUrl: string
}

export default function CheckoutNotification({
  userName,
  assetTag,
  assetName,
  checkoutDate,
  expectedCheckin,
  notes,
  appUrl,
}: CheckoutNotificationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f5f5f5' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <Heading style={{ color: '#1f2937' }}>Bạn vừa được cấp phát tài sản</Heading>

          <Text>Xin chào <strong>{userName}</strong>,</Text>

          <Text>
            Bạn vừa được cấp phát tài sản mới trong hệ thống IT Management.
          </Text>

          <Section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
            <Text><strong>Asset Tag:</strong> {assetTag}</Text>
            <Text><strong>Tên:</strong> {assetName}</Text>
            <Text><strong>Ngày cấp phát:</strong> {checkoutDate}</Text>
            {expectedCheckin && (
              <Text><strong>Ngày dự kiến thu hồi:</strong> {expectedCheckin}</Text>
            )}
            {notes && (
              <Text><strong>Ghi chú:</strong> {notes}</Text>
            )}
          </Section>

          <Button
            href={`${appUrl}/assets`}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Xem chi tiết
          </Button>

          <Hr style={{ margin: '20px 0' }} />

          <Text style={{ fontSize: '12px', color: '#6b7280' }}>
            Email này được gửi tự động bởi IT Management System. Vui lòng không reply.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

#### `src/emails/CheckinNotification.tsx`

```typescript
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Button,
  Hr,
} from '@react-email/components'

interface CheckinNotificationProps {
  adminName: string
  assetTag: string
  assetName: string
  previousAssignee: string
  checkinDate: string
  appUrl: string
}

export default function CheckinNotification({
  adminName,
  assetTag,
  assetName,
  previousAssignee,
  checkinDate,
  appUrl,
}: CheckinNotificationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f5f5f5' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <Heading style={{ color: '#1f2937' }}>Tài sản đã được thu hồi</Heading>

          <Text>Xin chào <strong>{adminName}</strong>,</Text>

          <Text>
            Tài sản sau đã được thu hồi về kho:
          </Text>

          <Section style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
            <Text><strong>Asset Tag:</strong> {assetTag}</Text>
            <Text><strong>Tên:</strong> {assetName}</Text>
            <Text><strong>Trước đó gán cho:</strong> {previousAssignee}</Text>
            <Text><strong>Ngày thu hồi:</strong> {checkinDate}</Text>
          </Section>

          <Button
            href={`${appUrl}/assets`}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Xem chi tiết
          </Button>

          <Hr style={{ margin: '20px 0' }} />

          <Text style={{ fontSize: '12px', color: '#6b7280' }}>
            Email này được gửi tự động bởi IT Management System.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

#### `src/emails/OverdueReminder.tsx`

```typescript
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Button,
  Hr,
} from '@react-email/components'

interface OverdueReminderProps {
  userName: string
  assets: { tag: string; name: string; expectedCheckin: string }[]
  appUrl: string
}

export default function OverdueReminder({
  userName,
  assets,
  appUrl,
}: OverdueReminderProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'system-ui, sans-serif', backgroundColor: '#f5f5f5' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <Heading style={{ color: '#dc2626' }}>⚠️ Nhắc nhở: Tài sản sắp đến hạn thu hồi</Heading>

          <Text>Xin chào <strong>{userName}</strong>,</Text>

          <Text>
            Bạn có <strong>{assets.length}</strong> tài sản sắp đến hạn thu hồi. Vui lòng chuẩn bị trả lại.
          </Text>

          {assets.map((asset) => (
            <Section key={asset.tag} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
              <Text><strong>{asset.tag}</strong> — {asset.name}</Text>
              <Text style={{ fontSize: '14px', color: '#6b7280' }}>
                Hạn thu hồi: {asset.expectedCheckin}
              </Text>
            </Section>
          ))}

          <Button
            href={`${appUrl}/assets`}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              textDecoration: 'none',
            }}
          >
            Xem tài sản của tôi
          </Button>

          <Hr style={{ margin: '20px 0' }} />

          <Text style={{ fontSize: '12px', color: '#6b7280' }}>
            Email này được gửi tự động. Liên hệ IT nếu cần gia hạn.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
```

---

### BƯỚC 4: Notification Service (orchestrator)

#### `src/lib/notifications/service.ts`

```typescript
import { sendEmail } from './email'
import CheckoutNotification from '@/emails/CheckoutNotification'
import CheckinNotification from '@/emails/CheckinNotification'
import type { ActionLog } from '@prisma/client'

const APP_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

/**
 * Gửi notification khi asset được checkout.
 * Fire-and-forget — KHÔNG throw error để không block domain command.
 *
 * @param params.userEmail - Email người nhận
 * @param params.userName - Tên người nhận
 * @param params.assetTag - Asset tag
 * @param params.assetName - Tên asset
 * @param params.expectedCheckin - Ngày dự kiến thu hồi (optional)
 * @param params.notes - Ghi chú (optional)
 */
export async function notifyCheckout(params: {
  userEmail: string
  userName: string
  assetTag: string
  assetName: string
  expectedCheckin?: Date | null
  notes?: string
}) {
  // Fire-and-forget — không await, để domain command không bị block
  sendEmail({
    to: params.userEmail,
    subject: `[IT] Bạn vừa được cấp phát ${params.assetTag}`,
    react: CheckoutNotification({
      userName: params.userName,
      assetTag: params.assetTag,
      assetName: params.assetName,
      checkoutDate: new Date().toLocaleDateString('vi-VN'),
      expectedCheckin: params.expectedCheckin?.toLocaleDateString('vi-VN'),
      notes: params.notes,
      appUrl: APP_URL,
    }),
  }).catch((err) => {
    console.error('[notifyCheckout] email send failed:', err)
  })
}

/**
 * Gửi notification khi asset được checkin (cho admin).
 */
export async function notifyCheckin(params: {
  adminEmail: string
  adminName: string
  assetTag: string
  assetName: string
  previousAssignee: string
}) {
  sendEmail({
    to: params.adminEmail,
    subject: `[IT] Tài sản ${params.assetTag} đã được thu hồi`,
    react: CheckinNotification({
      adminName: params.adminName,
      assetTag: params.assetTag,
      assetName: params.assetName,
      previousAssignee: params.previousAssignee,
      checkinDate: new Date().toLocaleDateString('vi-VN'),
      appUrl: APP_URL,
    }),
  }).catch((err) => {
    console.error('[notifyCheckin] email send failed:', err)
  })
}
```

---

### BƯỚC 5: Wire notifications vào domain commands

#### Sửa `src/lib/commands/asset.ts` — thêm notification

```typescript
// Thêm import
import { notifyCheckout, notifyCheckin } from '@/lib/notifications/service'

// Trong checkoutAssetToUser, sau khi update, thêm:
export async function checkoutAssetToUser(
  tx: Tx,
  params: { /* ... */ }
) {
  // ... existing code ...

  const updated = await tx.asset.update({ /* ... */ })

  // Existing ActionLog
  await tx.actionLog.create({ /* ... */ })

  // NEW: Gửi email notification (fire-and-forget, sau khi commit)
  // Lưu ý: phải query user.email sau khi đã có updated
  const userWithEmail = await tx.user.findUnique({
    where: { id: targetUserId },
    select: { email: true, firstName: true, lastName: true },
  })

  if (userWithEmail?.email) {
    notifyCheckout({
      userEmail: userWithEmail.email,
      userName: `${userWithEmail.firstName} ${userWithEmail.lastName ?? ''}`.trim(),
      assetTag: updated.assetTag,
      assetName: updated.name,
      expectedCheckin: updated.expectedCheckin,
      notes: notes,
    }).catch(console.error)
  }

  return updated
}
```

**Lưu ý quan trọng về Vercel serverless:**
- Email gửi sau khi transaction commit → an toàn (không rollback)
- Fire-and-forget → không block response
- Nếu email fail → không ảnh hưởng checkout
- Lý tưởng: dùng **Vercel Cron + queue** thay vì inline (Phase 2)

---

## PHẦN 2: EPIC I — FILE STORAGE

### BƯỚC 6: Cài packages

```bash
npm install @vercel/blob
```

### BƯỚC 7: Upload API endpoint

#### `src/app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { put, del } from '@vercel/blob'
import { requireRole } from '@/lib/auth-guard'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Vercel serverless function config
export const runtime = 'nodejs' // KHÔNG dùng edge — cần Node APIs
export const maxDuration = 30  // 30s timeout (Hobby max)

// File size limits
const LIMITS = {
  avatar: 1 * 1024 * 1024,    // 1MB
  logo: 2 * 1024 * 1024,      // 2MB
  asset: 5 * 1024 * 1024,     // 5MB
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']

interface UploadRequest {
  file: File
  type: 'avatar' | 'logo' | 'asset'
  entityId?: string  // userId, assetId, etc.
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN')
  } catch {
    return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const type = formData.get('type') as UploadRequest['type'] | null
  const entityId = formData.get('entityId') as string | null

  if (!file) {
    return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'File là bắt buộc.' }, { status: 400 })
  }

  if (!type || !['avatar', 'logo', 'asset'].includes(type)) {
    return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'Type không hợp lệ.' }, { status: 400 })
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: `Chỉ chấp nhận: ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  // Validate file size
  const limit = LIMITS[type]
  if (file.size > limit) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: `File quá lớn. Tối đa ${limit / 1024 / 1024}MB.` },
      { status: 400 }
    )
  }

  // Generate filename — tránh trùng + sanitize
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const filename = `${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  try {
    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false, // đã có Math.random() ở trên
    })

    // Save URL vào DB
    if (type === 'avatar' && entityId) {
      await prisma.user.update({
        where: { id: entityId },
        data: { avatar: blob.url },
      })
    } else if (type === 'asset' && entityId) {
      await prisma.asset.update({
        where: { id: entityId },
        data: { image: blob.url },
      })
    }
    // Logo lưu vào SystemSetting (xử lý riêng)

    revalidatePath('/')

    return NextResponse.json({
      ok: true,
      data: {
        url: blob.url,
        size: file.size,
        type: file.type,
      },
    })
  } catch (e) {
    console.error('[upload] error:', e)
    return NextResponse.json(
      { ok: false, code: 'UNKNOWN', message: 'Upload thất bại. Thử lại.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole('ADMIN')
  } catch {
    return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ ok: false, code: 'VALIDATION', message: 'URL là bắt buộc.' }, { status: 400 })
  }

  try {
    await del(url)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[delete blob] error:', e)
    return NextResponse.json(
      { ok: false, code: 'UNKNOWN', message: 'Xóa file thất bại.' },
      { status: 500 }
    )
  }
}
```

---

### BƯỚC 8: Upload Components

#### `src/components/upload/AvatarUpload.tsx`

```typescript
'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface AvatarUploadProps {
  userId: string
  currentAvatar?: string | null
  userName: string
}

export default function AvatarUpload({ userId, currentAvatar, userName }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'avatar')
      formData.append('entityId', userId)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.ok) {
        showToast('success', 'Đã cập nhật avatar')
      } else {
        showToast('error', data.message ?? 'Upload thất bại')
        setPreview(currentAvatar ?? null) // revert
      }
    } catch (err) {
      showToast('error', 'Lỗi upload')
      setPreview(currentAvatar ?? null)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemove() {
    if (!currentAvatar) return
    if (!confirm('Xóa avatar?')) return

    try {
      const res = await fetch(`/api/upload?url=${encodeURIComponent(currentAvatar)}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.ok) {
        setPreview(null)
        showToast('success', 'Đã xóa avatar')
      } else {
        showToast('error', data.message ?? 'Xóa thất bại')
      }
    } catch (err) {
      showToast('error', 'Lỗi xóa')
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar preview */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
          {preview ? (
            <img src={preview} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-slate-400">
              {userName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={20} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <Camera size={14} />
          {preview ? 'Đổi avatar' : 'Upload avatar'}
        </button>

        {preview && (
          <button
            onClick={handleRemove}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            <X size={14} />
            Xóa
          </button>
        )}
      </div>
    </div>
  )
}
```

#### `src/components/upload/AssetImageUpload.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Image as ImageIcon, Loader2, X, Upload } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface AssetImageUploadProps {
  assetId: string
  currentImage?: string | null
  assetTag: string
}

export default function AssetImageUpload({ assetId, currentImage, assetTag }: AssetImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const { showToast } = useToast()

  async function uploadFile(file: File) {
    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'asset')
      formData.append('entityId', assetId)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.ok) {
        showToast('success', 'Đã upload ảnh asset')
      } else {
        showToast('error', data.message ?? 'Upload thất bại')
        setPreview(currentImage ?? null)
      }
    } catch {
      showToast('error', 'Lỗi upload')
      setPreview(currentImage ?? null)
    } finally {
      setIsUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      uploadFile(file)
    } else {
      showToast('error', 'Chỉ chấp nhận file ảnh')
    }
  }

  async function handleRemove() {
    if (!currentImage) return
    if (!confirm('Xóa ảnh?')) return

    try {
      const res = await fetch(`/api/upload?url=${encodeURIComponent(currentImage)}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.ok) {
        setPreview(null)
        showToast('success', 'Đã xóa ảnh')
      }
    } catch {
      showToast('error', 'Lỗi xóa')
    }
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt={assetTag} className="max-h-64 mx-auto rounded-lg" />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <Loader2 className="animate-spin text-white" size={32} />
              </div>
            )}
          </div>
        ) : (
          <div className="py-8">
            <ImageIcon className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-sm text-gray-600 mb-2">Kéo thả ảnh hoặc click để chọn</p>
            <p className="text-xs text-gray-400">PNG, JPG, WebP (tối đa 5MB)</p>
          </div>
        )}

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) uploadFile(file)
          }}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>

      {/* Actions */}
      {preview && (
        <div className="flex gap-2">
          <button
            onClick={handleRemove}
            disabled={isUploading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
          >
            <X size={14} />
            Xóa ảnh
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## BƯỚC 9: Test trên Vercel Preview

### Local test trước

```bash
cd "D:\IT-management"

# 1. Verify env vars
cat .env.local
# DATABASE_URL=postgresql://...?sslmode=require
# RESEND_API_KEY=re_xxx
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx

# 2. Generate Prisma client
npx prisma generate

# 3. tsc
npx tsc --noEmit

# 4. Build
npm run build

# 5. Test upload locally
npm run dev
# → http://localhost:3000/settings/users/[id] → upload avatar
# → http://localhost:3000/assets/[id] → upload asset image
```

### Deploy lên Vercel Preview

```bash
# 1. Commit
git add .
git commit -m "Epic H+I: Notifications + File Storage"

# 2. Push (tự động tạo preview deployment)
git push origin feature/epic-H-I

# 3. Vercel tự động:
#    - npm install
#    - npm run build
#    - Deploy với BLOB_READ_WRITE_TOKEN auto-injected
#    - Migrations: cần chạy manual lần đầu

# 4. Migrate database
DATABASE_URL="<neon-direct-url>" npx prisma migrate deploy

# 5. Test trên Vercel preview URL
# → Upload avatar
# → Checkout asset → check email inbox
```

---

## BƯỚC 10: Final Verify

```bash
cd "D:\IT-management"

npx tsc --noEmit 2>&1 | tail -5
# Expected: 0 errors

npx jest --silent 2>&1 | tail -5
# Expected: PASS

npm run build 2>&1 | tail -5
# Expected: ✓ Compiled successfully
```

### Manual checklist trên Vercel Preview:

- [ ] Upload avatar → success + hiển thị
- [ ] Upload asset image → success + hiển thị
- [ ] Checkout asset → email nhận được
- [ ] Checkin asset → admin email nhận được
- [ ] Edge case: file quá lớn → error message
- [ ] Edge case: file không phải ảnh → error message

---

## Phụ lục A: Neon connection troubleshooting

| Issue | Solution |
|-------|----------|
| `Can't reach database server` | Check `?sslmode=require` |
| `Connection pool exhausted` | Dùng pooled URL, tăng pool size |
| `Too many connections` | Dùng Neon pooled connection |
| Migration fail | Dùng direct URL cho migrations |
| Cold start chậm | Neon auto-scales, có thể enable "Always On" (paid) |

---

## Phụ lục B: Vercel Blob pricing

| Plan | Storage | Bandwidth | Cost |
|------|---------|-----------|------|
| Hobby (free) | 500MB | 1GB/month | $0 |
| Pro | 100GB | 1TB/month | $0.15/GB extra |

---

## Phụ lục C: Resend pricing

| Plan | Emails/day | Cost |
|------|-----------|------|
| Free | 100/day | $0 |
| Pro | 50,000/month | $20/mo |

---

## Phụ lục D: Effort estimate

| Bước | Nội dung | Effort |
|------|---------|--------|
| 0 | Vercel + Neon setup | 1 giờ |
| 1 | Install packages | 5 phút |
| 2 | Email service | 1 giờ |
| 3 | Email templates (3) | 2 giờ |
| 4 | Notification orchestrator | 1 giờ |
| 5 | Wire to commands | 30 phút |
| 6 | Install Blob SDK | 5 phút |
| 7 | Upload API | 1.5 giờ |
| 8 | Upload components | 2 giờ |
| 9 | Test on Vercel | 1 giờ |
| 10 | Final verify | 30 phút |
| **Tổng** | | **~10 giờ = 1.5 ngày** |

---

## Phụ lục E: Migration từ local dev

Nếu đã có data trên local Postgres cần migrate sang Neon:

```bash
# 1. Dump local database
pg_dump -h localhost -U postgres -d itmanagement > backup.sql

# 2. Restore sang Neon
psql "postgresql://user:pass@ep-xxx.neon.tech/itmanagement?sslmode=require" < backup.sql

# 3. Update DATABASE_URL trên Vercel
# 4. Test app trên Vercel preview
```

---

**HẾT MSEW-epic-H-I-notifications-storage-vercel.md**

Tổng kết: 10 bước, ~10 file (8 mới + 2 sửa), ~1500 dòng code, effort ~1.5 ngày. Tích hợp Resend + Vercel Blob + Neon.