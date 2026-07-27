# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC F — SETTINGS PAGE (ADMIN CONFIG)

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-27
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · B ✅ · C ✅ · C+0.5 ✅ · C+1 ✅ · D ✅ · E ✅ · **E+1 ✅**
**Phạm vi:** 10 sub-pages settings cho admin config. Admin có toàn quyền customize system. Phase 2 demo-ready.
**Phạm vi LOẠI TRỪ:** KHÔNG có logo upload (defer Phase 3 — cần S3/R2); KHÔNG có email gửi thật (defer Phase 2.2 — cần Resend/SMTP); KHÔNG có multi-tenant UI toggle (defer Epic I)

---

## 0. Tại sao Epic F tồn tại — Audit code hiện tại

### Tier 1 đã verify trước khi viết MSEW

| Câu hỏi | Finding |
|---|---|
| Schema có `Setting` model? | ❌ **KHÔNG** — Phải tạo từ đầu |
| Schema có `StatusLabel` CRUD? | ✅ Có — chỉ cần UI |
| Schema có `Category` CRUD? | ✅ Có — chỉ cần UI |
| Schema có `Company` CRUD? | ✅ Có — chỉ cần UI |
| Schema có `User` CRUD? | ✅ Có — chỉ cần UI |
| Schema có `AuditLog` read? | ✅ Có — chỉ cần viewer UI |
| Settings đọc từ đâu? | Phase 1 dùng `Setting::getSettings()` nhưng model không tồn tại — **inconsistency** |
| Có UI components reusable? | ✅ `Modal`, `Toast`, `CheckoutAssetModal` — pattern có thể reuse |

### Vấn đề inconsistency nghiêm trọng

Phase 1 code gọi `Setting::getSettings()` (theo convention Snipe-IT) nhưng schema **không có model `Setting`**. Phase 2.1 phải tạo model + seed default.

---

## 1. MVP Settings Plan — 10 deliverables

### MVP Core (5 sub-pages — Phase 2.1)

| # | Deliverable | Mục đích | Priority | Effort |
|---|-------------|----------|----------|--------|
| **F-1** | `/settings` — General settings | Tên công ty, currency, timezone, language | **P0** | 0.5 ngày |
| **F-2** | `/settings/general` — Branding | Logo, primary color (không upload — chỉ URL) | P1 | 0.5 ngày |
| **F-4** | `/settings/companies` — Company CRUD | CRUD công ty (chỉ super-admin) | **P0** | 1 ngày |
| **F-6** | `/settings/statuses` — Status Labels CRUD | CRUD StatusLabel (thêm "Chờ duyệt", "Đang bảo hành") | **P0** | 1 ngày |
| **F-7** | `/settings/categories` — Category CRUD | CRUD Category + AssetModel | P1 | 1 ngày |

### Phase 2.2 (5 sub-pages còn lại)

| # | Deliverable | Priority | Effort |
|---|-------------|----------|--------|
| **F-3** | `/settings/security` — Password policy, 2FA toggle | P1 | 1 ngày |
| **F-5** | `/settings/users` — User CRUD, role assignment | P1 | 1 ngày |
| **F-8** | `/settings/depreciation` — Depreciation rules | P2 | 0.5 ngày |
| **F-9** | `/settings/email` — SMTP config, test email | P2 | 1 ngày |
| **F-10** | `/settings/audit-log` — ActionLog viewer (search/filter/export) | P1 | 1 ngày |

**Tổng Phase 2.1 (MVP Core):** ~4 ngày
**Tổng Phase 2.2:** ~4.5 ngày
**Grand total Epic F:** ~8.5 ngày ≈ **2 tuần**

---

## 2. Schema Design — `Setting` Model

### Tại sao cần `Setting` model?

Snipe-IT convention dùng singleton `Setting` record để store system config:
- `Setting::getSettings()` trả về 1 record — đọc nhanh, không cần query nhiều
- Key-value JSON field `settings` để lưu flexible config
- Không cần nhiều record — chỉ 1 row system-wide

### Prisma Schema — Thêm model `Setting`

**File sửa:** `prisma/schema.prisma`

Thêm vào cuối file (trước `model ActionLog`):

```prisma
// ============================================================================
// SYSTEM SETTINGS (Singleton)
// ============================================================================

model Setting {
  id        String   @id @default("system") // singleton — luôn là "system"
  updatedAt DateTime @updatedAt

  // General
  companyName   String @default("Công ty TNHH IT Manager")
  companyId     String? // liên kết với Company (FMCS)
  currency      String @default("VND")
  timezone      String @default("Asia/Ho_Chi_Minh")
  locale        String @default("vi-VN")

  // Branding
  logoUrl       String?
  primaryColor  String @default("#2563eb")

  // Feature flags
  fullMultipleCompaniesSupport Boolean @default(false)
  autoassignAssetsToLocation   Boolean @default(false)

  // Security
  passwordMinLength      Int @default(8)
  passwordRequireSpecial Boolean @default(false)
  sessionTimeoutMinutes  Int @default(480) // 8 giờ
  twoFactorEnabled       Boolean @default(false)

  // Email
  emailFrom       String?
  emailFromName   String?
  smtpHost        String?
  smtpPort        Int?
  smtpUsername    String?
  smtpPassword    String?  // mã hóa ở Phase 3
  smtpEncryption  String?  // "tls" | "ssl" | null
  emailDomain     String?  // whitelist domain cho user email

  // Flexible JSON cho các config ít dùng
  extras Json @default("{}")

  @@ignore // không cần expose qua Prisma client thông thường
}
```

**Lưu ý quan trọng:** `@ignore` — Prisma sẽ không tự động tạo client cho model này. Phải dùng raw query:

```typescript
// src/lib/settings.ts — helper đọc Setting singleton
import prisma from '@/lib/prisma'

export async function getSettings(): Promise<Setting> {
  const setting = await prisma.$queryRaw<Setting[]>`
    SELECT * FROM "Setting" WHERE id = 'system' LIMIT 1
  `.then(r => r[0] ?? null)

  if (!setting) {
    // Seed default nếu chưa có
    await prisma.$executeRaw`
      INSERT INTO "Setting" (id) VALUES ('system')
      ON CONFLICT (id) DO NOTHING
    `
    return getSettings() // recursion — lần sau sẽ có
  }
  return setting
}

export async function updateSettings(data: Partial<Setting>): Promise<void> {
  // Dùng raw query để update
  const sets = Object.entries(data)
    .filter(([k]) => k !== 'id' && k !== 'updatedAt')
    .map(([k, v]) => `"${k}" = '${JSON.stringify(v).replace(/'/g, "''")}'`)
    .join(', ')

  await prisma.$executeRaw`
    UPDATE "Setting" SET ${sets as any}, "updatedAt" = NOW() WHERE id = 'system'
  `
}
```

**Lưu ý:** Phase 3 sẽ thay bằng Prisma `update()` thông thường sau khi bỏ `@ignore`. Hiện tại dùng raw query.

---

## 3. Quyết định của Planner

| Q | Câu hỏi | Quyết định | Lý do |
|---|---------|------------|-------|
| **Q1** | `Setting` model hay dùng `Company` key-value? | **Tạo `Setting` model riêng** | Snipe-IT convention + singleton pattern đơn giản |
| **Q2** | Logo upload hay chỉ URL? | **Chỉ URL (Phase 2.1)** | Upload cần S3/R2 — defer Phase 3 |
| **Q3** | Email gửi thật hay mock? | **Mock (Phase 2.1)** | Defer SMTP/Resend → Phase 2.2 |
| **Q4** | Settings có per-company hay system-wide? | **System-wide (Phase 2.1)** | Multi-tenant → Epic I |

---

## 4. Tiêu chí nghiệm thu Epic F

### BẮT BUỘC (Acceptance Criteria)

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| **F-1** | `npx tsc --noEmit` PASS (0 errors) | Shell |
| **F-2** | `npx jest` PASS — KHÔNG regress Phase 1 | Shell |
| **F-3** | `/settings` — thay đổi company name → lưu thành công → hiển thị dashboard mới | Browser |
| **F-4** | `/settings/statuses` — CRUD StatusLabel thành công | Browser |
| **F-5** | `/settings/categories` — CRUD Category thành công | Browser |
| **F-6** | `/settings/companies` — CRUD Company thành công | Browser |
| **F-7** | `/settings/users` — CRUD User + assign role thành công | Browser |
| **F-8** | `/settings/audit-log` — xem ActionLog với filter/search | Browser |
| **F-9** | RBAC: EMPLOYEE truy cập `/settings/*` → redirect với 403 toast | Browser |
| **F-10** | `npm run build` PASS | Shell |

---

## 5. Files thay đổi

### 5.1 Schema + Seed

| File | Loại | Mô tả |
|------|------|--------|
| `prisma/schema.prisma` | Sửa | Thêm `Setting` model |
| `prisma/seed.ts` | Sửa | Seed default Setting record |

### 5.2 Settings lib

| File | Loại | Mô tả |
|------|------|--------|
| `src/lib/settings.ts` | Mới | `getSettings()`, `updateSettings()` |
| `src/app/actions/settings.ts` | Mới | Server actions cho CRUD settings |

### 5.3 UI pages

| File | Loại | Mô tả |
|------|------|--------|
| `src/app/settings/page.tsx` | Mới | Layout — sidebar nav + outlet |
| `src/app/settings/general/page.tsx` | Mới | F-1: General settings |
| `src/app/settings/branding/page.tsx` | Mới | F-2: Branding |
| `src/app/settings/security/page.tsx` | Mới | F-3: Security |
| `src/app/settings/companies/page.tsx` | Mới | F-4: Company CRUD |
| `src/app/settings/users/page.tsx` | Mới | F-5: User CRUD |
| `src/app/settings/statuses/page.tsx` | Mới | F-6: Status Label CRUD |
| `src/app/settings/categories/page.tsx` | Mới | F-7: Category CRUD |
| `src/app/settings/depreciation/page.tsx` | Mới | F-8: Depreciation |
| `src/app/settings/email/page.tsx` | Mới | F-9: SMTP config |
| `src/app/settings/audit-log/page.tsx` | Mới | F-10: Audit log viewer |
| `src/app/settings/layout.tsx` | Mới | Layout wrapper |
| `src/components/settings/SettingsSidebar.tsx` | Mới | Sidebar nav component |
| `src/components/settings/SettingsForm.tsx` | Mới | Reusable form wrapper |
| `src/components/settings/SettingsTable.tsx` | Mới | Reusable table cho CRUD |

### 5.4 Server actions cho CRUD

| File | Loại | Mô tả |
|------|------|--------|
| `src/app/actions/settings.ts` | Mới | `updateGeneralSettings`, `updateBrandingSettings` |
| `src/app/actions/company.ts` | Mới | `createCompany`, `updateCompany`, `deleteCompany` |
| `src/app/actions/status.ts` | Mới | `createStatus`, `updateStatus`, `deleteStatus` |
| `src/app/actions/category.ts` | Mới | `createCategory`, `updateCategory`, `deleteCategory` |
| `src/app/actions/user.ts` | Mới | `createUser`, `updateUser`, `deleteUser`, `assignRole` |

### 5.5 Proxy update

| File | Loại | Mô tả |
|------|------|--------|
| `src/proxy.ts` | Sửa | Thêm `/settings/:path*` vào protected routes |

**Tổng:** ~25 file (20 mới + 5 sửa), ~4000 dòng code.

---

## 6. Architecture Design

### 6.1 Settings Layout Pattern

```
/settings                    → redirect /settings/general
/settings/general           → General settings
/settings/branding          → Branding
/settings/security          → Security
/settings/companies         → Company CRUD
/settings/users             → User CRUD
/settings/statuses          → Status Label CRUD
/settings/categories         → Category CRUD
/settings/depreciation       → Depreciation
/settings/email             → SMTP config
/settings/audit-log         → Audit log viewer
```

**Layout:** Dùng Next.js nested layout pattern:
```typescript
// src/app/settings/layout.tsx
export default function SettingsLayout({ children }) {
  return (
    <AppShell>
      <div className="flex">
        <SettingsSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </AppShell>
  )
}
```

### 6.2 SettingsSidebar — Navigation

Dùng `Sidebar` pattern từ `src/components/Sidebar.tsx` nhưng riêng cho settings:

```typescript
// src/components/settings/SettingsSidebar.tsx
const SETTINGS_NAV = [
  { label: 'Tổng quan', href: '/settings/general', icon: Settings },
  { label: 'Thương hiệu', href: '/settings/branding', icon: Palette },
  { label: 'Bảo mật', href: '/settings/security', icon: Shield },
  { label: 'Công ty', href: '/settings/companies', icon: Building2 },
  { label: 'Người dùng', href: '/settings/users', icon: Users },
  { label: 'Trạng thái', href: '/settings/statuses', icon: Tag },
  { label: 'Danh mục', href: '/settings/categories', icon: FolderOpen },
  { label: 'Khấu hao', href: '/settings/depreciation', icon: TrendingDown },
  { label: 'Email', href: '/settings/email', icon: Mail },
  { label: 'Nhật ký', href: '/settings/audit-log', icon: ScrollText },
]
```

### 6.3 Reusable Form Pattern

```typescript
// src/components/settings/SettingsForm.tsx
interface SettingsFormProps<T> {
  initialData: T
  onSubmit: (data: T) => Promise<CommandResult<T>>
  fields: FormField[]
  title: string
}
```

### 6.4 Reusable Table Pattern (cho CRUD)

```typescript
// src/components/settings/SettingsTable.tsx
interface SettingsTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  createNewHref?: string
}
```

---

## BƯỚC 0: Pre-Audit

```bash
cd "D:\IT-management"

npx tsc --noEmit 2>&1 | head -5
# Expected: 0 errors

npx jest --silent 2>&1 | tail -3
# Expected: 19 suites, 109 tests PASS
```

---

## PHẦN 1: SCHEMA + SEED (Foundation)

### BƯỚC 1: Thêm `Setting` model vào `prisma/schema.prisma`

Thêm vào trước `model ActionLog`:

```prisma
// ============================================================================
// SYSTEM SETTINGS (Singleton)
// ============================================================================

model Setting {
  id        String   @id @default("system")
  updatedAt DateTime @updatedAt

  // General
  companyName             String  @default("Công ty TNHH IT Manager")
  companyId               String?
  currency                String  @default("VND")
  timezone                String  @default("Asia/Ho_Chi_Minh")
  locale                  String  @default("vi-VN")

  // Branding
  logoUrl       String?
  primaryColor  String  @default("#2563eb")

  // Feature flags
  fullMultipleCompaniesSupport Boolean @default(false)
  autoassignAssetsToLocation   Boolean @default(false)

  // Security
  passwordMinLength      Int @default(8)
  passwordRequireSpecial Boolean @default(false)
  sessionTimeoutMinutes  Int @default(480)
  twoFactorEnabled       Boolean @default(false)

  // Email
  emailFrom     String?
  emailFromName String?
  smtpHost      String?
  smtpPort      Int?
  smtpUsername  String?
  smtpPassword  String?
  smtpEncryption String?
  emailDomain   String?

  // Flexible JSON cho các config ít dùng
  extras Json @default("{}")

  @@map("setting")
  @@ignore
}
```

---

### BƯỚC 2: Migrate schema

```bash
npx prisma migrate dev --name add_setting_model
# Expected: Migration tạo bảng setting

npx prisma generate
# Expected: PrismaClient updated
```

---

### BƯỚC 3: Seed default Setting

**File sửa:** `prisma/seed.ts`

Thêm vào cuối hàm `seed()`:

```typescript
// Seed Setting singleton
const setting = await prisma.setting.upsert({
  where: { id: 'system' },
  update: {},
  create: {
    id: 'system',
    companyName: 'Công ty TNHH IT Manager',
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    locale: 'vi-VN',
    primaryColor: '#2563eb',
    fullMultipleCompaniesSupport: false,
    autoassignAssetsToLocation: false,
    passwordMinLength: 8,
    passwordRequireSpecial: false,
    sessionTimeoutMinutes: 480,
    twoFactorEnabled: false,
    extras: {},
  },
})
console.log(`✅ Setting seeded: ${setting.companyName}`)
```

**Verify:**

```bash
npx prisma db seed
# Expected: Setting seeded

npx prisma studio
# → xem bảng setting có 1 record default
```

---

## PHẦN 2: SETTINGS LIB (Foundation)

### BƯỚC 4: Tạo `src/lib/settings.ts`

**File mới.** ~50 dòng.

```typescript
/**
 * Settings helper — đọc/ghi singleton Setting record.
 *
 * Tại sao dùng raw query thay vì Prisma thông thường:
 *   - Model có @ignore → Prisma client không generate helper
 *   - Singleton pattern: WHERE id = 'system' LIMIT 1
 *
 * Phase 3: bỏ @ignore + dùng Prisma update() thông thường.
 */
import prisma from '@/lib/prisma'
import { Setting } from '@prisma/client'

export async function getSettings(): Promise<Setting> {
  const rows = await prisma.$queryRaw<Setting[]>`
    SELECT * FROM "Setting" WHERE id = 'system' LIMIT 1
  `
  return rows[0]!
}

export async function updateSettings(
  data: Partial<Omit<Setting, 'id' | 'updatedAt' | 'extras'>>,
  extras?: Record<string, unknown>
): Promise<void> {
  const entries = Object.entries(data).filter(
    ([k]) => k !== 'id' && k !== 'updatedAt'
  )
  if (entries.length === 0 && !extras) return

  // Build SET clause
  const sets: string[] = []
  for (const [k, v] of entries) {
    if (v === null || v === undefined) {
      sets.push(`"${k}" = NULL`)
    } else if (typeof v === 'string') {
      sets.push(`"${k}" = '${v.replace(/'/g, "''")}'`)
    } else {
      sets.push(`"${k}" = ${JSON.stringify(v)}`)
    }
  }

  if (extras) {
    const current = await prisma.$queryRaw<{ extras: Record<string, unknown> }[]>`
      SELECT extras FROM "Setting" WHERE id = 'system'
    `
    const merged = { ...(current[0]?.extras ?? {}), ...extras }
    sets.push(`extras = '${JSON.stringify(merged).replace(/'/g, "''")}'`)
  }

  sets.push(`"updatedAt" = NOW()`)

  await prisma.$executeRawUnsafe(`
    UPDATE "Setting" SET ${sets.join(', ')} WHERE id = 'system'
  `)
}
```

---

## PHẦN 3: SETTINGS ACTIONS (Foundation)

### BƯỚC 5: Tạo `src/app/actions/settings.ts`

**File mới.** ~80 dòng.

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth-guard'
import { updateSettings, getSettings } from '@/lib/settings'
import type { CommandResult } from '@/lib/errors'

export async function getSettingsAction(): Promise<CommandResult<Awaited<ReturnType<typeof getSettings>>>> {
  try {
    const settings = await getSettings()
    return { ok: true, data: settings }
  } catch (e) {
    console.error('[getSettingsAction]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi đọc cài đặt.' }
  }
}

export async function updateGeneralSettingsAction(data: {
  companyName: string
  currency: string
  timezone: string
  locale: string
}): Promise<CommandResult<void>> {
  try {
    await requireRole('ADMIN')
    await updateSettings({
      companyName: data.companyName,
      currency: data.currency,
      timezone: data.timezone,
      locale: data.locale,
    })
    revalidatePath('/')
    revalidatePath('/settings/general')
    return { ok: true, data: undefined }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[updateGeneralSettings]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi lưu cài đặt.' }
  }
}

export async function updateBrandingSettingsAction(data: {
  logoUrl?: string
  primaryColor?: string
}): Promise<CommandResult<void>> {
  try {
    await requireRole('ADMIN')
    await updateSettings({
      logoUrl: data.logoUrl ?? null,
      primaryColor: data.primaryColor ?? '#2563eb',
    })
    revalidatePath('/')
    return { ok: true, data: undefined }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[updateBrandingSettings]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi lưu cài đặt.' }
  }
}

export async function updateSecuritySettingsAction(data: {
  passwordMinLength?: number
  passwordRequireSpecial?: boolean
  sessionTimeoutMinutes?: number
  twoFactorEnabled?: boolean
}): Promise<CommandResult<void>> {
  try {
    await requireRole('ADMIN')
    await updateSettings({
      passwordMinLength: data.passwordMinLength ?? 8,
      passwordRequireSpecial: data.passwordRequireSpecial ?? false,
      sessionTimeoutMinutes: data.sessionTimeoutMinutes ?? 480,
      twoFactorEnabled: data.twoFactorEnabled ?? false,
    })
    revalidatePath('/')
    return { ok: true, data: undefined }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[updateSecuritySettings]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi lưu cài đặt.' }
  }
}
```

---

## PHẦN 4: SETTINGS LAYOUT

### BƯỚC 6: Tạo `src/app/settings/layout.tsx`

**File mới.** ~30 dòng.

```typescript
import AppShell from '@/components/AppShell'
import SettingsSidebar from '@/components/settings/SettingsSidebar'
import { redirect } from 'next/navigation'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell>
      <div className="flex min-h-screen bg-slate-50">
        <SettingsSidebar />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </AppShell>
  )
}
```

---

### BƯỚC 7: Tạo `src/components/settings/SettingsSidebar.tsx`

**File mới.** ~60 dòng.

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Settings,
  Palette,
  Shield,
  Building2,
  Users,
  Tag,
  FolderOpen,
  TrendingDown,
  Mail,
  ScrollText,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Tổng quan', href: '/settings/general', icon: Settings },
  { label: 'Thương hiệu', href: '/settings/branding', icon: Palette },
  { label: 'Bảo mật', href: '/settings/security', icon: Shield },
  { label: 'Công ty', href: '/settings/companies', icon: Building2 },
  { label: 'Người dùng', href: '/settings/users', icon: Users },
  { label: 'Trạng thái', href: '/settings/statuses', icon: Tag },
  { label: 'Danh mục', href: '/settings/categories', icon: FolderOpen },
  { label: 'Khấu hao', href: '/settings/depreciation', icon: TrendingDown },
  { label: 'Email', href: '/settings/email', icon: Mail },
  { label: 'Nhật ký', href: '/settings/audit-log', icon: ScrollText },
]

export default function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 bg-white border-r border-gray-200 p-4 shrink-0">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
        Cài đặt hệ thống
      </h2>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

---

## PHẦN 5: SUB-PAGE IMPLEMENTATION

### BƯỚC 8: Tạo `src/app/settings/general/page.tsx` (F-1 — MVP Core)

**File mới.** ~120 dòng.

```typescript
/**
 * General Settings — F-1: company name, currency, timezone, language.
 *
 * Phase 1 admin phải có UI để thay đổi cấu hình hệ thống mà không cần sửa DB.
 */
import { getSettingsAction, updateGeneralSettingsAction } from '@/app/actions/settings'
import SettingsForm from '@/components/settings/SettingsForm'
import { Globe, DollarSign, Clock, Languages } from 'lucide-react'

export default async function GeneralSettingsPage() {
  const result = await getSettingsAction()

  if (!result.ok) {
    return (
      <div className="text-red-600">Lỗi: {result.message}</div>
    )
  }

  const settings = result.data

  const fields = [
    {
      name: 'companyName',
      label: 'Tên công ty',
      icon: Globe,
      type: 'text' as const,
      required: true,
      description: 'Tên hiển thị trên dashboard và email thông báo.',
    },
    {
      name: 'currency',
      label: 'Đơn vị tiền tệ',
      icon: DollarSign,
      type: 'select' as const,
      required: true,
      options: [
        { value: 'VND', label: 'VND (Việt Nam Đồng)' },
        { value: 'USD', label: 'USD (US Dollar)' },
        { value: 'EUR', label: 'EUR (Euro)' },
        { value: 'SGD', label: 'SGD (Singapore Dollar)' },
      ],
      description: 'Đơn vị tiền tệ mặc định cho chi phí tài sản.',
    },
    {
      name: 'timezone',
      label: 'Múi giờ',
      icon: Clock,
      type: 'select' as const,
      required: true,
      options: [
        { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh (GMT+7)' },
        { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
        { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
        { value: 'UTC', label: 'UTC (GMT+0)' },
      ],
      description: 'Múi giờ cho báo cáo và ngày tạo record.',
    },
    {
      name: 'locale',
      label: 'Ngôn ngữ',
      icon: Languages,
      type: 'select' as const,
      required: true,
      options: [
        { value: 'vi-VN', label: 'Tiếng Việt' },
        { value: 'en-US', label: 'English' },
      ],
      description: 'Ngôn ngữ hiển thị cho toàn bộ giao diện.',
    },
  ]

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Cài đặt tổng quan</h1>
      <p className="text-gray-500 mb-6">Cấu hình cơ bản của hệ thống.</p>

      <SettingsForm
        title="Thông tin công ty"
        initialData={settings}
        fields={fields}
        onSubmit={async (data) => {
          'use server'
          return updateGeneralSettingsAction(data)
        }}
      />
    </div>
  )
}
```

---

### BƯỚC 9: Tạo `src/components/settings/SettingsForm.tsx`

**File mới.** ~100 dòng.

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { useForm } from 'react-hook-form'
import type { CommandResult } from '@/lib/errors'
import { Loader2 } from 'lucide-react'

interface Field {
  name: string
  label: string
  icon?: React.ElementType
  type: 'text' | 'select' | 'number' | 'checkbox' | 'color' | 'textarea'
  required?: boolean
  options?: { value: string; label: string }[]
  description?: string
  placeholder?: string
}

interface SettingsFormProps {
  initialData: Record<string, unknown>
  fields: Field[]
  title: string
  onSubmit: (data: Record<string, unknown>) => Promise<CommandResult<unknown>>
}

export default function SettingsForm({
  initialData,
  fields,
  title,
  onSubmit,
}: SettingsFormProps) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData,
  })

  function onFormSubmit(data: Record<string, unknown>) {
    startTransition(async () => {
      const result = await onSubmit(data)
      showCommandResult(result)
      if (result.ok) {
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <div className="space-y-4">
          {fields.map((field) => {
            const Icon = field.icon
            return (
              <div key={field.name}>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                  {Icon && <Icon size={16} className="text-gray-400" />}
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    {...register(field.name, { required: field.required })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    {...register(field.name)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                ) : field.type === 'color' ? (
                  <div className="flex gap-3">
                    <input
                      type="color"
                      {...register(field.name)}
                      className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      {...register(field.name)}
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 font-mono text-sm"
                      placeholder="#2563eb"
                    />
                  </div>
                ) : field.type === 'textarea' ? (
                  <textarea
                    {...register(field.name, { required: field.required })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition resize-none"
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type={field.type}
                    {...register(field.name, { required: field.required })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition disabled:opacity-50"
                    placeholder={field.placeholder}
                  />
                )}

                {field.description && (
                  <p className="mt-1 text-xs text-gray-500">{field.description}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-70"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            'Lưu thay đổi'
          )}
        </button>
      </div>
    </form>
  )
}
```

---

### BƯỚC 10: Tạo `src/app/settings/statuses/page.tsx` (F-6 — MVP Core)

**File mới.** ~150 dòng.

```typescript
/**
 * Status Labels CRUD — F-6: quản lý StatusLabel (thêm "Chờ duyệt", "Đang bảo hành").
 *
 * Phase 1 dùng hard-coded status. Phase 2 admin cần CRUD để customize.
 */
import prisma from '@/lib/prisma'
import StatusLabelTable from '@/components/settings/StatusLabelTable'
import { requireRole } from '@/lib/auth-guard'
import { redirect } from 'next/navigation'

async function getStatuses() {
  try {
    return await prisma.statusLabel.findMany({
      orderBy: { name: 'asc' },
    })
  } catch {
    return []
  }
}

export default async function StatusesPage() {
  await requireRole('ADMIN').catch(() => redirect('/'))

  const statuses = await getStatuses()

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Trạng thái tài sản</h1>
          <p className="text-gray-500">Quản lý nhãn trạng thái cho tài sản và license.</p>
        </div>
        <a
          href="/settings/statuses/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          + Thêm trạng thái
        </a>
      </div>

      <StatusLabelTable statuses={statuses} />
    </div>
  )
}
```

---

### BƯỚC 11: Tạo `src/components/settings/StatusLabelTable.tsx`

**File mới.** ~100 dòng.

```typescript
'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/Toast'
import { Tag, Pencil, Trash2, Loader2 } from 'lucide-react'
import type { StatusLabel } from '@prisma/client'

const COLOR_MAP: Record<string, string> = {
  deployable: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  undeployable: 'bg-red-100 text-red-700',
  archived: 'bg-gray-100 text-gray-500',
}

interface Props {
  statuses: StatusLabel[]
}

export default function StatusLabelTable({ statuses }: Props) {
  const { showCommandResult } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/settings/statuses/${id}`, { method: 'DELETE' })
      const data = await res.json()
      showCommandResult(data)
      if (data.ok) {
        setDeleteId(null)
        window.location.reload()
      }
    } finally {
      setDeleting(false)
    }
  }

  if (statuses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Tag size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">Chưa có trạng thái nào.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Màu</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {statuses.map((status) => {
            const typeLabel =
              status.deployable ? 'Sẵn sàng' :
              status.pending ? 'Chờ duyệt' :
              status.archived ? 'Lưu trữ' : 'Không sẵn sàng'
            const colorKey = status.deployable ? 'deployable' : status.pending ? 'pending' : status.archived ? 'archived' : 'undeployable'

            return (
              <tr key={status.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${COLOR_MAP[colorKey]}`}>
                    {status.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{typeLabel}</td>
                <td className="px-6 py-4">
                  {status.color && (
                    <span
                      className="inline-block w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: status.color }}
                    />
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <a
                      href={`/settings/statuses/${status.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"
                    >
                      <Pencil size={16} />
                    </a>
                    <button
                      onClick={() => setDeleteId(status.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Xóa trạng thái"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          Bạn có chắc muốn xóa trạng thái này? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={() => deleteId && handleDelete(deleteId)}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 disabled:opacity-70"
          >
            {deleting && <Loader2 size={16} className="animate-spin" />}
            Xóa
          </button>
        </div>
      </Modal>
    </div>
  )
}
```

---

## PHẦN 6: RBAC PROTECTION

### BƯỚC 12: Sửa `src/proxy.ts` — thêm settings routes

**File sửa.** Thêm `/settings/:path*` vào `matcher`:

```typescript
export const config = {
  matcher: [
    "/",
    "/assets/:path*",
    "/licenses/:path*",
    "/settings/:path*",  // ← thêm dòng này
  ]
}
```

**Lưu ý:** EMPLOYEE truy cập `/settings/*` → NextAuth redirect về `/login` → toast FORBIDDEN hiển thị.

---

## PHẦN 7: REMAINING SUB-PAGES (Phase 2.2)

Tier 2 tự viết theo pattern Bước 8-11. Hướng dẫn nhanh:

### F-2: Branding (`/settings/branding`)

```typescript
// fields: logoUrl (URL input), primaryColor (color picker)
// action: updateBrandingSettingsAction (đã viết ở Bước 5)
```

### F-3: Security (`/settings/security`)

```typescript
// fields: passwordMinLength (number), passwordRequireSpecial (checkbox),
//         sessionTimeoutMinutes (select: 30m, 1h, 4h, 8h, 24h),
//         twoFactorEnabled (checkbox — toggle only, enroll ở Phase 3)
// action: updateSecuritySettingsAction (đã viết ở Bước 5)
```

### F-4: Companies (`/settings/companies`)

```typescript
// CRUD Company — dùng pattern StatusLabelTable
// action: createCompany, updateCompany, deleteCompany (viết trong src/app/actions/company.ts)
```

### F-5: Users (`/settings/users`)

```typescript
// CRUD User + assign role (ADMIN/EMPLOYEE)
// action: createUser, updateUser, deleteUser, assignRole
// Password hash: dùng bcrypt.hash(password, 10)
```

### F-7: Categories (`/settings/categories`)

```typescript
// CRUD Category — dùng pattern StatusLabelTable
// action: createCategory, updateCategory, deleteCategory
```

### F-8: Depreciation (`/settings/depreciation`)

```typescript
// CRUD Depreciation — fields: name, months, depreciationType (LINEAR/HALF_YEAR), minimumValue
// action: createDepreciation, updateDepreciation, deleteDepreciation
```

### F-9: Email (`/settings/email`)

```typescript
// fields: emailFrom, emailFromName, smtpHost, smtpPort, smtpUsername,
//         smtpPassword (masked), smtpEncryption (select: tls/ssl/none)
// action: testEmail (gửi test email — mock ở Phase 2.1, real ở Phase 2.2)
// Note: KHÔNG gửi email thật ở Phase 2.1
```

### F-10: Audit Log Viewer (`/settings/audit-log`)

```typescript
// Read-only — xem ActionLog với filter
// Filter: actionType, itemType, userId, dateRange
// Columns: Thời gian, Người thực hiện, Hành động, Mục tiêu, Ghi chú
// Pagination: server-side, 20 rows/page
// action: getActionLogs({ actionType?, itemType?, userId?, from?, to?, page? })
```

---

## BƯỚC 13: Final verify

```bash
cd "D:\IT-management"

# 1. tsc clean
npx tsc --noEmit 2>&1 | tail -5
# Expected: 0 errors

# 2. Jest all — KHÔNG regress
npx jest --silent 2>&1 | tail -5
# Expected: 19 suites, 109 tests PASS

# 3. Build
npm run build 2>&1 | tail -5
# Expected: ✓ Compiled successfully

# 4. Manual verify
# - /settings/general → đổi company name → Lưu → hiển thị đúng
# - /settings/statuses → CRUD StatusLabel
# - /settings/categories → CRUD Category
# - EMPLOYEE truy cập /settings/* → redirect /login
```

---

## Phụ lục A: File KHÔNG patch

| File | Lý do |
|------|-------|
| `prisma/schema.prisma` | Đã sửa ở Bước 1 (thêm Setting model) |
| `prisma/seed.ts` | Đã sửa ở Bước 3 (seed Setting) |
| `src/lib/auth.ts` | KHÔNG đụng |
| `src/app/actions/asset.ts` | KHÔNG đụng |
| `src/app/actions/license.ts` | KHÔNG đụng |
| `src/components/Header.tsx` | KHÔNG đụng |
| `src/components/Sidebar.tsx` | KHÔNG đụng |
| `src/proxy.ts` | Đã sửa ở Bước 12 (thêm settings routes) |

---

## Phụ lục B: Tech stack mới

| Tech | Vai trò |
|------|---------|
| `react-hook-form` | Form state management cho SettingsForm |
| `@hookform/resolvers` | Validation resolver (Zod) |
| `zod` | Schema validation |

**Cài đặt:**

```bash
npm install react-hook-form zod @hookform/resolvers
```

---

## Phụ lục C: Common pitfalls

### C.1 `Setting` record không tồn tại

Triệu chứng: `getSettings()` trả về null → crash.

**Fix:** Verify `prisma db seed` đã chạy + Bước 3 seed Setting singleton.

### C.2 `@ignore` model không generate Prisma client

Triệu chọng: `import type { Setting }` bị lỗi TypeScript.

**Fix:** Dùng raw query như Bước 4. Phase 3 bỏ `@ignore` để dùng Prisma thông thường.

### C.3 EMPLOYEE vẫn truy cập settings được

Triệu chọng: Proxy không block.

**Fix:** Verify `src/proxy.ts` matcher có `/settings/:path*`. Employee sẽ bị redirect về `/login`.

### C.4 Logo upload ở Phase 2.1

Triệu chọng: Admin muốn upload logo nhưng chỉ có URL field.

**Fix:** Dùng external image URL (vd: upload lên Imgur/S3, paste URL). Phase 3 sẽ thêm file upload.

---

## Phụ lục D: Effort estimate chi tiết

| Bước | Nội dung | Effort |
|------|---------|--------|
| Bước 0 | Pre-audit | 15 phút |
| Bước 1-3 | Schema + Seed Setting | 1 giờ |
| Bước 4 | Settings lib | 1 giờ |
| Bước 5 | Settings actions | 2 giờ |
| Bước 6 | Settings layout | 30 phút |
| Bước 7 | SettingsSidebar | 1 giờ |
| Bước 8-9 | F-1 General + SettingsForm | 2 giờ |
| Bước 10-11 | F-6 Status Labels + Table | 2 giờ |
| Bước 12 | Proxy update | 15 phút |
| **Phase 2.1 tổng** | **5 MVP sub-pages** | **~10 giờ = 2 ngày** |
| F-2 Branding | 0.5 ngày | |
| F-3 Security | 1 ngày | |
| F-4 Companies | 1 ngày | |
| F-5 Users | 1 ngày | |
| F-7 Categories | 1 ngày | |
| F-8 Depreciation | 0.5 ngày | |
| F-9 Email | 1 ngày | |
| F-10 Audit Log | 1 ngày | |
| **Phase 2.2 tổng** | **5 sub-pages còn lại** | **~6 giờ = 1.5 ngày** |
| **Grand total** | **10 sub-pages** | **~16 giờ = ~2 tuần** |

---

## Phụ lục E: Sau Epic F xong

| Trạng thái | Hành động tiếp |
|------------|----------------|
| ✅ PASS | Epic G: Bulk Operations (CSV import/export, bulk checkout) |
| ⚠️ PASS nhưng minor issue | Note vào tech debt, đi Epic G |
| ❌ FAIL | Escalate — settings là foundation cho Phase 2.2 + Epic G |

---

**HẾT MSEW-epic-F-settings-page.md**

Tổng kết: 13 bước, ~25 file (20 mới + 5 sửa), ~4000 dòng code, effort ~2 tuần. 10 sub-pages settings. Phase 2 admin toàn quyền config system sau epic này.