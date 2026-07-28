# BÁO CÁO KIỂM TOÁN KỸ THUẬT & KẾ HOẠCH REFACTOR
## Hệ thống Quản lý Tài sản IT (ITAM)

---

**Ngày:** 28/07/2026  
**Phạm vi:** Toàn bộ mã nguồn `D:\IT-management\src`  
**Phương pháp:** Static Analysis, Database Audit, Business Logic Review, Performance Profiling  

---

## MỤC LỤC

1. [Tóm tắt Điều hành](#1-tóm-tắt-điều-hành)
2. [Phần 1: Nợ Kỹ thuật (Technical Debt)](#2-phần-1-nợ-kỹ-thuật-technical-debt)
3. [Phần 2: Logic & Nghiệp vụ (Business Rules)](#3-phần-2-logic--nghiệp-vụ-business-rules)
4. [Phần 3: Nút thắt Hiệu năng (Performance Bottlenecks)](#4-phần-3-nút-thắt-hiệu-năng-performance-bottlenecks)
5. [Kế hoạch Refactor Chi tiết](#5-kế-hoạch-refactor-chi-tiết)
6. [Ước tính Effort](#6-ước-tính-effort)

---

## 1. Tóm tắt Điều hành

| Chỉ số | Số lượng |
|--------|----------|
| **Tổng files** | 269 files (127 .ts + 141 .tsx) |
| **API Routes** | 81 routes |
| **Server Actions** | 8 files |
| **Vấn đề Critical** | 6 |
| **Vấn đề High** | 11 |
| **Vấn đề Medium** | 13 |
| **Vấn đề Low** | 7 |
| **Tổng Issues** | **37** |

### Điểm Đánh giá

| Khía cạnh | Điểm | Trạng thái |
|-----------|------|------------|
| Database Performance | 6.5/10 | Cần cải thiện (thiếu index) |
| Business Logic | 7.5/10 | Khá tốt (có 1 lỗ hổng CRITICAL) |
| Code Quality | 7.0/10 | Cần refactor (fat components) |
| Security | 7.0/10 | Có 2 lỗ hổng nghiêm trọng |
| Performance | 7.5/10 | Cần tối ưu hóa client |

---

## 2. Phần 1: Nợ Kỹ thuật (Technical Debt)

### 2.1 Fat Components (Files > 500 lines)

| # | File | Lines | Priority | Mô tả |
|---|------|-------|----------|-------|
| 1 | `src/app/settings/integrations/IntegrationsClient.tsx` | **881** | 🔴 CRITICAL | Quá lớn - cần split thành 3 tabs riêng |
| 2 | `src/components/assets/FilterPanel.tsx` | 627 | 🔴 CRITICAL | Logic filter phức tạp - cần tách utility |
| 3 | `src/components/helpdesk/HelpdeskTeamsClient.tsx` | 446 | 🟠 HIGH | Quản lý teams + members + tickets |
| 4 | `src/app/settings/permissions/RolesManager.tsx` | 430 | 🟠 HIGH | Role management phức tạp |
| 5 | `src/app/reports/costs/ItCostsClient.tsx` | 427 | 🟠 HIGH | Chart rendering + table |
| 6 | `src/app/settings/users/new/NewUserForm.tsx` | 427 | 🟠 HIGH | Form validation + API calls |
| 7 | `src/app/admin/helpdesk/page.tsx` | 421 | 🟠 HIGH | Rules + assignments management |
| 8 | `src/components/settings/EntityTable.tsx` | 407 | 🟡 MEDIUM | CRUD table component |

### 2.2 DRY Violations (Trùng lặp Code)

#### 2.2.1 Modal Confirmation Patterns
- **Status:** Có `components/ui/ConfirmModal.tsx` nhưng **không được sử dụng nhất quán**
- **Files cần cập nhật:**
  - `HelpdeskTeamsClient.tsx` - tự implement modal riêng
  - `TicketAttachments.tsx` - tự implement modal riêng
  - `DepreciationTable.tsx` - tự implement modal riêng
  - `IntegrationsClient.tsx` - tự implement modal riêng

#### 2.2.2 Date/Currency Formatting
- **Status:** Không có centralized utilities
- **Trùng lặp tại:**
  - `lib/notifications/email.ts`
  - `LicenseHistoryTimeline.tsx`
  - `AssetHistoryTimeline.tsx`
  - `ItCostsClient.tsx`
  - Nhiều API routes trả về Date/Decimal không serialize

#### 2.2.3 API Fetch Patterns
- **Pattern lặp lại:**
  ```typescript
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  ```
- **Files cần cập nhật:** Nhiều components tự implement thay vì dùng shared utility

### 2.3 Components với Quá nhiều useState

#### `IntegrationsClient.tsx` (21+ useState) - CRITICAL
```tsx
// Danh sách state không đầy đủ:
const [tab, setTab] = useState<Tab>('tokens')
const [tokens, setTokens] = useState<ApiToken[]>([])
const [loading, setLoading] = useState(true)
// ... 18+ more state variables
```

**Khuyến nghị:** Sử dụng `useReducer` hoặc tách thành 3 components con:
1. `ApiTokensTab.tsx`
2. `EmailTemplatesTab.tsx`
3. `NotificationChannelsTab.tsx`

#### `helpdesk/[id]/page.tsx` (11+ useState) - HIGH
```tsx
const [ticket, setTicket] = useState<Ticket | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [commentText, setCommentText] = useState('')
// ... more for actions, reassignment, confirmations
```

### 2.4 Cấu trúc Thư mục Chưa Tối ưu

```
src/
├── app/
│   ├── actions/                    # 8 server actions - OK
│   ├── api/                        # 81 routes - QUÁ NHIỀU
│   │   ├── admin/                  # Nên gộp vào settings/
│   │   ├── auth/
│   │   ├── assets/
│   │   ├── helpdesk/
│   │   ├── licenses/
│   │   ├── me/
│   │   ├── notifications/
│   │   ├── permissions/
│   │   ├── reports/
│   │   ├── saved-filters/
│   │   ├── settings/               # Nên gộp permissions/ vào đây
│   │   └── tickets/
│   └── ... (pages)
├── components/
│   ├── account/
│   ├── assets/
│   ├── audit/
│   ├── dashboard/
│   ├── helpdesk/
│   ├── licenses/
│   ├── reports/
│   ├── settings/
│   └── ui/                        # Shared components - CẦN MỞ RỘNG
└── lib/
    ├── commands/
    ├── notifications/
    ├── permissions/
    ├── print/
    └── tickets/
```

**Khuyến nghị:**
1. Gộp `admin/` vào `settings/`
2. Gộp `permissions/` vào `settings/`
3. Tạo thư mục `lib/utils/` cho formatting utilities

---

## 3. Phần 2: Logic & Nghiệp vụ (Business Rules)

### 3.1 Vấn đề Bảo mật CRITICAL

#### 🔴 3.1.1 SQL Injection trong `updateSettings()`
**File:** `src/lib/settings.ts:78-101`

```typescript
// VẤN ĐỀ: Key name không được validate
for (const [k, v] of entries) {
  // k (key name) có thể chứa SQL injection
  sets.push(`"${k}" = '${v.replace(/'/g, "''")}'`)
}
await prisma.$executeRawUnsafe(`UPDATE "setting" SET ${sets.join(', ')}...`)
```

**Mức độ:** 🔴 **CRITICAL**  
**Fix:** Sử dụng Prisma typed `update()` với allowlist các field được phép update.

#### 🔴 3.1.2 Permissions lưu trong SessionStorage (XSS Risk)
**File:** `src/components/Sidebar.tsx:38-48`

```typescript
// VẤN ĐỀ: Permissions plaintext trong sessionStorage
window.sessionStorage.setItem(PERM_CACHE_KEY, JSON.stringify({
  userId,
  permissions,  // ← Có thể bị XSS đọc
  fetchedAt: Date.now()
}))
```

**Mức độ:** 🔴 **CRITICAL**  
**Fix:** Server-side render navigation, không cache permissions ở client.

### 3.2 Validation Gaps

#### 🟠 3.2.1 Không kiểm tra số âm cho `purchaseCost`, `warrantyMonths`
**Files:**
- `src/app/actions/asset.ts:79` - `purchaseCost`
- `src/app/actions/asset.ts:81` - `warrantyMonths`
- `src/app/actions/license.ts:77,143` - `purchaseCost`

**Mức độ:** 🟠 HIGH  
**Fix:** Thêm guard:
```typescript
if (data.purchaseCost < 0) throw new DomainError('VALIDATION', 'purchaseCost không được âm')
```

#### 🟠 3.2.2 2FA Setup không verify password
**File:** `src/app/api/auth/2fa/setup/route.ts`

**Vấn đề:** Attacker có session đã authenticate có thể setup 2FA mà không cần password.

**Mức độ:** 🟠 HIGH  
**Fix:** Require password verification trước khi generate 2FA secret.

### 3.3 Missing Guards

#### 🟡 3.3.1 Soft-deleted Asset Checkout
**File:** `src/lib/commands/asset.ts:35-39`

```typescript
// VẤN ĐỀ: Không check deletedAt
const asset = await tx.asset.findUnique({
  where: { id: assetId },  // ← Thiếu deletedAt: null
  include: { status: true },
})
```

**Mức đề:** 🟡 MEDIUM  
**Fix:** Thêm `deletedAt: null` vào where clause.

#### 🟡 3.3.2 ActionLog Orphaned on User Delete
**File:** `src/app/api/settings/users/[id]/route.ts`

**Vấn đề:** Khi xóa user, ActionLog vẫn giữ `userId` của user bị xóa.

**Mức độ:** 🟡 MEDIUM  
**Fix:** Reassign ActionLog sang system user.

#### 🟡 3.3.3 License Commands - Missing `deletedAt` Guard
**File:** `src/lib/commands/license.ts:39-46`

```typescript
// VẤN ĐỀ: findUnique không filter deletedAt
const seat = await tx.licenseSeat.findUnique({
  where: { id: seatId },  // ← Thiếu deletedAt: null
})
```

**Mức độ:** 🟡 MEDIUM  
**Fix:** Thêm `deletedAt: null` vào where clause trong tất cả license commands.

### 3.4 Các Logic Đã Tốt ✅

| Module | Status | Ghi chú |
|--------|--------|---------|
| Duplicate License Assignment | ✅ | Có check trong `lib/commands/license.ts` |
| Race Condition Protection | ✅ | Dùng `withRowLock()` |
| Status Deployable Check | ✅ | Kiểm tra `deployable`, `archived`, `pending` |
| System User Protection | ✅ | Check `id === 'system'` |
| Self-Delete Protection | ✅ | Check `actor.id === id` |
| Token Expiry | ✅ | 1 hour TTL + `usedAt` check |
| 2FA Disable Password | ✅ | Require password before disable |
| Depreciation Months Validation | ✅ | Check `months > 0` |

---

## 4. Phần 3: Nút thắt Hiệu năng (Performance Bottlenecks)

### 4.1 Database Indexes Thiếu

#### 🔴 4.1.1 Thiếu Index trên `deletedAt` (Tất cả Models)

**Priority:** 🔴 **CRITICAL**

| Model | Impact |
|-------|--------|
| Asset | Hầu hết queries filter deletedAt |
| User | User listing + reports |
| License | License listing + expiry reports |
| LicenseSeat | Seat queries |
| Category | Category listing |
| StatusLabel | Asset filtering |
| Location | Location listing |
| Department | Department listing |
| AssetMaintenance | Maintenance reports |
| NotificationChannel | Channel listing |
| AssetModel | Model listing |

#### 🔴 4.1.2 Composite Indexes Cần thiết

| Composite Index | Query Pattern | Priority |
|-----------------|---------------|----------|
| `(assignedUserId, deletedAt)` | User's assets | CRITICAL |
| `(companyId, deletedAt)` | Company filter | CRITICAL |
| `(expirationDate, deletedAt)` | Expiring licenses | CRITICAL |
| `(userId, createdAt)` | User activity log | HIGH |
| `(statusId, deletedAt)` | Status filter | HIGH |
| `(categoryId, deletedAt)` | Category filter | HIGH |

#### 🟡 4.1.3 Enum Indexes

| Field | Query Pattern | Priority |
|-------|---------------|----------|
| `User.role` | Filter IT staff | HIGH |
| `Ticket.status` | Filter tickets | MEDIUM |

### 4.2 N+1 Query Issues

#### 🟡 4.2.1 Missing `_count` Include
**Files:**
- `src/app/api/reports/assets-by-category/route.ts:21`
- `src/app/api/reports/licenses-expiring/route.ts:26`
- `src/app/api/admin/ticket-rules/route.ts:21`

**Fix:**
```typescript
const categories = await prisma.category.findMany({
  include: {
    _count: { select: { assets: { where: { deletedAt: null } } } }
  },
})
```

#### 🟡 4.2.2 Missing Soft-delete Filter
**File:** `src/app/api/permissions/roles/[id]/route.ts:65`

```typescript
// TRƯỚC
const users = await prisma.user.findMany({ where: { customRoleId: id } })

// SAU
const users = await prisma.user.findMany({ 
  where: { customRoleId: id, deletedAt: null } 
})
```

### 4.3 Client Performance Issues

#### 🟠 4.3.1 Dashboard - 3 API Calls on Mount
**File:** `src/components/dashboard/DashboardClient.tsx:39-50`

```typescript
useEffect(() => {
  Promise.all([
    fetch('/api/reports/summary'),      // Call 1
    fetch('/api/reports/assets-by-status'), // Call 2
    fetch('/api/reports/assets-by-category'), // Call 3
  ]).then(...)
}, [])
```

**Impact:** 200ms+ initial load  
**Fix:** Server-side render với `revalidate: 60`

#### 🟠 4.3.2 FilterPanel - Không có Debounce
**File:** `src/components/assets/FilterPanel.tsx:306-312`

```tsx
<input
  value={localFilters.search}
  onChange={(e) => setField('search', e.target.value)} // ← Update liên tục
/>
```

**Impact:** Unnecessary re-renders  
**Fix:** Thêm debounce 300ms:
```typescript
const debouncedSetSearch = useMemo(
  () => debounce((value: string) => setField('search', value), 300),
  []
)
```

#### 🟡 4.3.3 Helpdesk useEffect - 6 Dependencies
**File:** `src/app/helpdesk/page.tsx:104-141`

```typescript
useEffect(() => {
  // ...
}, [tab, filterStatus, filterPriority, filterTeamId, filterAssigneeId, isIt, session?.user?.role])
//          ↑ 6 dependencies - quá nhiều
```

**Impact:** Frequent re-renders  
**Fix:** Tách thành 2 effects: 1 cho session, 1 cho filters

#### 🟡 4.3.4 Alert Widgets - Không Lazy Load
**File:** `src/components/dashboard/DashboardClient.tsx:92-96`

```tsx
<LicenseExpiryAlert />      {/* Fetch API immediately */}
<AssetEolAlert />           {/* Fetch API immediately */}
```

**Impact:** Tải data không cần thiết nếu user không scroll đến  
**Fix:** Dùng `React.lazy()` + `Suspense`

---

## 5. Kế hoạch Refactor Chi tiết

### Sprint R1: Security Hotfix (1 ngày)

#### Task R1.1: Fix SQL Injection in `updateSettings()`
**File:** `src/lib/settings.ts`  
**Effort:** 2 giờ

```typescript
// Thay thế $executeRawUnsafe bằng typed update
const allowedFields = [
  'companyName', 'currency', 'timezone', 'locale', 
  'primaryColor', 'passwordMinLength', 'emailFrom', 'supportEmail'
] as const

const updateData: Record<string, unknown> = {}
for (const [k, v] of entries) {
  if (allowedFields.includes(k as any)) {
    updateData[k] = v
  }
}
await prisma.setting.update({ 
  where: { id: 'system' }, 
  data: updateData 
})
```

#### Task R1.2: Remove Permissions from SessionStorage
**File:** `src/components/Sidebar.tsx`  
**Effort:** 3 giờ

**Approach:** Server-side render sidebar navigation
- Tạo Server Component wrapper cho Sidebar
- Fetch permissions server-side
- Pass permissions vào Client Component qua props

#### Task R1.3: Add 2FA Password Verification
**File:** `src/app/api/auth/2fa/setup/route.ts`  
**Effort:** 1 giờ

```typescript
// Require password in request body
const { password } = await req.json()
const valid = await bcrypt.compare(password, user.password)
if (!valid) return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
// Then generate 2FA secret
```

#### Task R1.4: Add deletedAt Guards
**Files:** 
- `src/lib/commands/asset.ts` (checkout commands)
- `src/lib/commands/license.ts` (all functions)
- `src/app/api/permissions/roles/[id]/route.ts`

**Effort:** 2 giờ

---

### Sprint R2: Database Optimization (2 ngày)

#### Task R2.1: Add All Missing Indexes
**File:** `prisma/schema.prisma`  
**Effort:** 3 giờ

```prisma
// === Asset ===
model Asset {
  // ... existing fields ...
  @@index([deletedAt])                    // CRITICAL
  @@index([categoryId, deletedAt])        // CRITICAL
  @@index([assignedUserId, deletedAt])    // CRITICAL
  @@index([statusId, deletedAt])          // HIGH
  @@index([companyId, deletedAt])         // HIGH
  @@index([manufacturerId])              // HIGH
  @@index([supplierId])                 // HIGH
}

// === User ===
model User {
  // ... existing fields ...
  @@index([deletedAt])                    // CRITICAL
  @@index([departmentId])               // HIGH
  @@index([role])                        // HIGH
  @@index([companyId, deletedAt])        // CRITICAL
}

// === License ===
model License {
  // ... existing fields ...
  @@index([deletedAt])                    // CRITICAL
  @@index([expirationDate])             // CRITICAL
  @@index([companyId, deletedAt])        // CRITICAL
  @@index([expirationDate, deletedAt])  // CRITICAL
}

// === LicenseSeat ===
model LicenseSeat {
  // ... existing fields ...
  @@index([deletedAt])                    // CRITICAL
  @@index([licenseId])                   // HIGH
  @@index([assignedUserId, deletedAt])   // HIGH
  @@index([assignedAssetId, deletedAt])  // HIGH
}

// === Add deletedAt index to all master data ===
model Category { @@index([deletedAt]) }
model Manufacturer { @@index([deletedAt]) }
model Supplier { @@index([deletedAt]) }
model Depreciation { @@index([deletedAt]) }
model AssetModel { @@index([deletedAt]) @@index([manufacturerId]) }
model Location { @@index([deletedAt]) @@index([managerId]) }
model Department { @@index([deletedAt]) @@index([managerId]) }
model StatusLabel { @@index([deletedAt]) }
model AssetMaintenance { @@index([deletedAt]) @@index([createdById]) }
model NotificationChannel { @@index([deletedAt]) }
model Team { @@index([isActive]) }
model Ticket {
  @@index([status, deletedAt])
  @@index([reporterId, deletedAt])
  @@index([assigneeId, deletedAt])
}

// === ActionLog ===
model ActionLog {
  // ... existing indexes ...
  @@index([userId, createdAt])            // HIGH
  @@index([actionType, createdAt])        // HIGH
  @@index([itemType, itemId, createdAt])  // HIGH
}
```

#### Task R2.2: Add Missing `_count` Includes
**Files:**
- `src/app/api/reports/assets-by-category/route.ts`
- `src/app/api/reports/licenses-expiring/route.ts`
- `src/app/api/admin/ticket-rules/route.ts`

**Effort:** 2 giờ

---

### Sprint R3: Component Refactor (3 ngày)

#### Task R3.1: Split IntegrationsClient.tsx
**File:** `src/app/settings/integrations/`  
**Effort:** 4 giờ

```
IntegrationsClient.tsx (881 lines)
    ↓ split thành
├── integrations/page.tsx (Server wrapper)
├── ApiTokensTab.tsx (300 lines)
├── EmailTemplatesTab.tsx (250 lines)
└── NotificationChannelsTab.tsx (280 lines)
```

#### Task R3.2: Create Shared Utilities
**Files:** `src/lib/utils/`  
**Effort:** 3 giờ

```typescript
// src/lib/utils/format.ts
export function formatCurrency(value: number | Decimal | null | undefined, locale = 'vi-VN'): string
export function formatDate(date: Date | string | null | undefined, format?: string): string
export function formatDateTime(date: Date | string | null | undefined): string
export function formatRelativeTime(date: Date | string): string

// src/lib/utils/api.ts
export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T>
export function createApiError(response: Response): Error

// src/lib/utils/validation.ts
export function validatePositiveNumber(value: number, field: string): void
export function validateRequired(value: unknown, field: string): void
export function validateMaxLength(value: string, max: number, field: string): void
```

#### Task R3.3: Create Domain Errors
**File:** `src/lib/errors.ts`  
**Effort:** 2 giờ

```typescript
export class DomainError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super('NOT_FOUND', `${entity} với ID "${id}" không tồn tại.`)
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super('VALIDATION', message)
  }
}

export class InvalidStateError extends DomainError {
  constructor(message: string) {
    super('INVALID_STATE', message)
  }
}
```

#### Task R3.4: Replace ConfirmModal Usage
**Files:** Multiple components  
**Effort:** 2 giờ

Chuẩn hóa tất cả confirmation dialogs sử dụng `components/ui/ConfirmModal.tsx`.

---

### Sprint R4: Performance Optimization (2 ngày)

#### Task R4.1: Server-side Dashboard Stats
**Files:**
- `src/app/page.tsx`
- `src/components/dashboard/DashboardClient.tsx`

**Effort:** 3 giờ

```typescript
// src/app/page.tsx (Server Component)
export default async function DashboardPage() {
  const [summary, statusChart, categoryChart] = await Promise.all([
    fetchSummaryStats(),     // Server-side Prisma query
    fetchAssetsByStatus(),
    fetchAssetsByCategory(),
  ])
  
  return (
    <DashboardClient 
      initialData={{ summary, statusChart, categoryChart }}
    />
  )
}
```

#### Task R4.2: Add Debounce to FilterPanel Search
**File:** `src/components/assets/FilterPanel.tsx`  
**Effort:** 1 giờ

#### Task R4.3: Lazy Load Dashboard Widgets
**File:** `src/components/dashboard/DashboardClient.tsx`  
**Effort:** 2 giờ

```typescript
import { lazy, Suspense } from 'react'

const LicenseExpiryAlert = lazy(() => import('./LicenseExpiryAlert'))
const AssetEolAlert = lazy(() => import('./AssetEolAlert'))

// Usage
<Suspense fallback={<WidgetSkeleton />}>
  <LicenseExpiryAlert />
</Suspense>
```

#### Task R4.4: Optimize Helpdesk useEffect
**File:** `src/app/helpdesk/page.tsx`  
**Effort:** 2 giờ

---

### Sprint R5: Input Validation (1 ngày)

#### Task R5.1: Add Zod Schemas
**Files:** `src/lib/schemas/`  
**Effort:** 3 giờ

```typescript
// src/lib/schemas/asset.ts
import { z } from 'zod'

export const createAssetSchema = z.object({
  name: z.string().min(1).max(255),
  assetTag: z.string().min(1).max(50),
  serial: z.string().max(100).optional(),
  modelId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  statusId: z.string().uuid(),
  purchaseCost: z.number().positive().optional().nullable(),
  warrantyMonths: z.number().int().positive().max(120).optional().nullable(),
  purchaseDate: z.date().optional(),
  // ... validation rules
})

export const updateAssetSchema = createAssetSchema.partial()
```

#### Task R5.2: Add Validation to Actions
**Files:**
- `src/app/actions/asset.ts`
- `src/app/actions/license.ts`

**Effort:** 2 giờ

---

### Sprint R6: ActionLog Fix (0.5 ngày)

#### Task R6.1: Reassign ActionLog on User Delete
**File:** `src/app/api/settings/users/[id]/route.ts`  
**Effort:** 1 giờ

```typescript
// Trong user delete flow, thêm:
await prisma.actionLog.updateMany({
  where: { userId: id },
  data: { userId: systemUserId },
})
```

---

## 6. Ước tính Effort

| Sprint | Tên | Effort | Issues Fixed |
|--------|-----|--------|--------------|
| R1 | Security Hotfix | 1 ngày | 4 |
| R2 | Database Optimization | 2 ngày | 15+ indexes |
| R3 | Component Refactor | 3 ngày | 5 fat components, DRY |
| R4 | Performance Optimization | 2 ngày | 5 issues |
| R5 | Input Validation | 1 ngày | 2 high, 3 medium |
| R6 | ActionLog Fix | 0.5 ngày | 1 medium |
| **Tổng** | | **9.5 ngày** | |

---

## 7. Files Cần Tạo Mới

| File | Mô tả |
|------|-------|
| `src/lib/utils/format.ts` | Centralized date/currency formatters |
| `src/lib/utils/api.ts` | Shared API fetch utilities |
| `src/lib/utils/validation.ts` | Validation helpers |
| `src/lib/errors.ts` | Domain error classes |
| `src/lib/schemas/asset.ts` | Zod schema for assets |
| `src/lib/schemas/license.ts` | Zod schema for licenses |
| `src/lib/schemas/user.ts` | Zod schema for users |
| `src/components/integrations/ApiTokensTab.tsx` | Split from IntegrationsClient |
| `src/components/integrations/EmailTemplatesTab.tsx` | Split from IntegrationsClient |
| `src/components/integrations/NotificationChannelsTab.tsx` | Split from IntegrationsClient |

---

## 8. Files Cần Sửa Đổi Lớn

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Thêm 30+ indexes |
| `src/lib/settings.ts` | Thay $executeRawUnsafe |
| `src/components/Sidebar.tsx` | Server-side permissions |
| `src/components/dashboard/DashboardClient.tsx` | Lazy load + server props |
| `src/components/assets/FilterPanel.tsx` | Debounce + useCallback |
| `src/app/settings/integrations/IntegrationsClient.tsx` | Split thành 3 files |
| `src/lib/commands/asset.ts` | Thêm deletedAt guard |
| `src/lib/commands/license.ts` | Thêm deletedAt guard |
| `src/app/api/auth/2fa/setup/route.ts` | Add password verify |
| `src/app/api/settings/users/[id]/route.ts` | Reassign ActionLog |
| `src/app/api/permissions/roles/[id]/route.ts` | Add deletedAt filter |

---

## 9. Kiểm tra Sau Refactor

Sau khi hoàn thành tất cả sprints, cần verify:

1. **Security:**
   - [ ] SQL injection không còn khả thi
   - [ ] Permissions không còn trong sessionStorage
   - [ ] 2FA setup require password

2. **Performance:**
   - [ ] Dashboard load < 500ms
   - [ ] Filter search có debounce
   - [ ] Database queries có indexes

3. **Code Quality:**
   - [ ] Không còn fat components > 400 lines
   - [ ] DRY violations được fix
   - [ ] Centralized utilities được sử dụng

4. **Business Logic:**
   - [ ] deletedAt guards đầy đủ
   - [ ] Validation cho tất cả inputs
   - [ ] ActionLog không orphaned

---

*Báo cáo được tạo bởi Software Architect Agent - 28/07/2026*
