# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC D — UI POLISH + CHECKOUT FLOW + SECURITY

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-26
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · B ✅ · C ✅ · **C+1 RBAC ✅**
**Phạm vi MVP:** 6 mục tiêu UI polish + 2 bonus bảo mật = 8 deliverables
**Phạm vi LOẠI TRỪ:** KHÔNG tạo Role mới; KHÔNG làm approval workflow; KHÔNG export CSV/PDF; KHÔNG làm bulk action

---

## 0. Tại sao Epic D tồn tại — Audit code hiện tại

### Tier 1 đã verify trước khi viết MSEW

| Câu hỏi | Finding |
|---|---|
| Có nút Checkout trên `/assets`? | ❌ Không — chỉ có nút "Thêm Tài Sản" |
| Có modal chọn target User khi checkout? | ❌ Không — chưa có flow |
| EMPLOYEE thấy gì trên `/assets`? | Thấy tất cả (full list) + nút "Thêm Tài Sản" → bị block ở server (UX kém) |
| UI có render error từ CommandResult? | ❌ Không — nếu server action fail → silent (redirect thẳng về list) |
| Password field enabled? | ❌ Không — `disabled` ở Epic C |
| Header hiển thị role badge? | ✅ Có (Epic C) |
| Sidebar nav có check role? | ❌ Không — Settings link hiển thị cho cả ADMIN + EMPLOYEE |
| `/licenses` có list seats? | Tier 1 chưa verify — để Tier 2 check |

### Tech debt bảo mật Tier 2 nêu

> 1. Tài khoản KHÔNG cần password để login (MVP design Epic C)
> 2. /api/auth/signin không rate-limit

→ Epic D sẽ giải quyết cả 2 luôn (bonus).

---

## 1. MVP Polish — 6 deliverables chính

| # | Deliverable | Mục đích | Effort |
|---|-------------|----------|--------|
| **D-1** | `<RoleGate>` component | Ẩn children với role không được phép (UI defensive) | 1h |
| **D-2** | `<Toast>` component | Render success/error từ `CommandResult<T>` | 1h |
| **D-3** | Nút "Cấp phát" / "Thu hồi" trên `/assets` | Wire Epic B commands | 2h |
| **D-4** | `<CheckoutAssetModal>` | Modal chọn target User/Location + notes | 2h |
| **D-5** | Nút "Cấp Seat" trên `/licenses/[id]` | Wire seat checkout commands | 2h |
| **D-6** | Sidebar `<RoleGate>` cho `/settings` | Ẩn Settings với EMPLOYEE | 30m |

**Tổng MVP polish: ~8 giờ**

### Security Bonus (Tier 2 nêu) — 2 deliverables

| # | Deliverable | Effort |
|---|-------------|--------|
| **D-7** | Enable password field real check (bcrypt) trên `/login` | 1h |
| **D-8** | Rate-limit cho `/api/auth/*` (chống brute force) | 1h |

**Tổng Security bonus: ~2 giờ**

### Grand total: ~10 giờ = 1.5 ngày

Nếu sếp sợ quá tải, có thể tách Epic D1 (polish only) + Epic D2 (security bonus) chạy riêng. Tôi recommend làm hết trong 1 epic vì đã qua Epic A, B, C — Tier 2 đã thông codebase.

---

## 2. Quyết định của Planner (trả lời 4 câu hỏi Tier 2 có thể hỏi)

| Q | Câu hỏi | Quyết định | Lý do |
|---|---------|------------|-------|
| **Q1** | Toast library: xây từ đầu hay dùng `sonner` / `react-hot-toast`? | **Tự build bằng React Context** | MVP, ít dependency. Sonner v.v. cần thêm 20KB+ bundle. Phase 2 có thể đổi. |
| **Q2** | Dùng Server Action cho form checkout hay Client Component + fetch? | **Server Action** | Đã có pattern từ Epic A2 (`createAsset`). Consistent + secure + ít code. |
| **Q3** | Modal dùng `<dialog>` HTML5 hay custom Modal? | **Custom Modal với headless-ui hoặc tự build** | HTML5 dialog ít control style. Tự build ~80 dòng OK cho MVP. |
| **Q4** | Rate-limit dùng thư viện hay tự build với Prisma table? | **Dùng `next-rate-limit` hoặc tự build với Map in-memory** | MVP đơn giản, in-memory OK. Phase 2 sẽ chuyển Redis. |

---

## 3. Tiêu chí nghiệm thu Epic D

### BẮT BUỘC (Acceptance Criteria)

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| **D-1** | `npx tsc --noEmit` PASS (0 errors) | Shell |
| **D-2** | `npx jest` PASS (8 suites, 70+ tests) | Shell |
| **D-3** | Manual: Login ADMIN → `/assets` → thấy nút "Cấp phát" | Browser |
| **D-4** | Manual: Login ADMIN → click "Cấp phát" trên `LAP-001` → modal mở → chọn User → submit → asset được assign thật | Browser + Prisma Studio |
| **D-5** | Manual: Login ADMIN → `/licenses/[id]` → click "Cấp Seat" → modal mở → chọn User → submit | Browser + Prisma Studio |
| **D-6** | Manual: Login EMPLOYEE → `/assets` → KHÔNG thấy nút "Cấp phát" | Browser |
| **D-7** | Manual: Login EMPLOYEE → Sidebar KHÔNG thấy "Settings" link | Browser |
| **D-8** | Manual: Login EMPLOYEE → gọi `checkoutAssetCmd` qua DevTools → trả `{ ok: false, code: 'FORBIDDEN' }` + Toast error hiển thị | DevTools |
| **D-9** | Manual: Login EMPLOYEE → cố truy cập `/licenses/[id]`?action=checkout → trả error | Browser |
| **D-10** | Manual: Nhập password SAI 6 lần liên tiếp → lần thứ 6 bị rate-limit (HTTP 429) | curl |
| **D-11** | Manual: Login form giờ yêu cầu password thật (không còn disabled) | Browser |

### KHÔNG BẮT BUỘC (Phase 2)

- ~~CSS animation cho Toast fade-in/out~~ → UI polish Phase 3
- ~~Modal backdrop blur~~ → CSS Phase 3
- ~~Bulk checkout (nhiều asset 1 lúc)~~ → Feature epic
- ~~Settings page thật (chỉ cần ẩn nav, không cần build page)~~ → Epic F

---

## 4. Files thay đổi

### 4.1 MVP Polish (D-1 → D-6)

| File | Loại | Số dòng (ước tính) |
|------|------|-------------------|
| `src/components/RoleGate.tsx` | Mới | ~30 dòng |
| `src/components/Toast.tsx` | Mới | ~120 dòng (Provider + ToastContainer + Toast component) |
| `src/components/ui/Modal.tsx` | Mới | ~100 dòng |
| `src/components/assets/CheckoutAssetButton.tsx` | Mới | ~150 dòng (Client Component + modal trigger) |
| `src/components/assets/CheckoutAssetModal.tsx` | Mới | ~200 dòng |
| `src/components/assets/CheckinAssetButton.tsx` | Mới | ~80 dòng |
| `src/components/licenses/CheckoutSeatButton.tsx` | Mới | ~150 dòng |
| `src/components/licenses/CheckoutSeatModal.tsx` | Mới | ~180 dòng |
| `src/app/assets/page.tsx` | Sửa | thêm button inline + handle CommandResult |
| `src/app/licenses/page.tsx` | Sửa | (verify có sẵn không; nếu chưa có — tạo mới) |
| `src/app/licenses/[id]/page.tsx` | Mới | ~250 dòng (license detail + seats + checkout buttons) |
| `src/components/Sidebar.tsx` | Sửa | wrap `/settings` link trong `<RoleGate>` |
| `src/app/layout.tsx` | Sửa | wrap `<ToastProvider>` |
| `tests/role-gate.test.tsx` | Mới | ~40 dòng |
| `tests/toast.test.tsx` | Mới | ~50 dòng |

### 4.2 Security Bonus (D-7, D-8)

| File | Loại | Số dòng |
|------|------|---------|
| `src/app/login/page.tsx` | Sửa | enable password field + ẩn "test accounts" hint |
| `src/lib/auth.ts` | Sửa nhỏ | bỏ bypass khi credentials.password empty |
| `src/lib/rate-limit.ts` | Mới | ~60 dòng (in-memory rate-limit helper) |
| `src/app/api/auth/[...nextauth]/route.ts` | Mới | wrap NextAuth handler với rate-limit |
| `tests/rate-limit.test.ts` | Mới | ~50 dòng |

**Tổng:** ~20 file (15 mới + 5 sửa), ~1500 dòng code.

---

## 5. Bối cảnh tham chiếu

| Nguồn | Mục đích |
|--------|----------|
| `docs/plan/PLAN-CLONE-FROM-SNIPEIT.md` §4.5 | Epic D UI nguyên gốc |
| `src/app/assets/page.tsx` (Epic A2) | List view hiện tại — sẽ thêm button |
| `src/app/page.tsx` (Dashboard) | Sẽ polish: hiển thị role badge "Xin chào, [FirstName]" |
| `src/components/Sidebar.tsx` | Cần wrap `/settings` trong RoleGate |
| `src/lib/auth-guard.ts` (Epic C+1) | Có `isAuthorized` + `requireRole` — TÁI SỬ DỤNG |
| `src/lib/errors.ts` (Epic B + C+1) | `CommandResult<T>` discriminated union — TÁI SỬ DỤNG |
| `src/app/actions/asset.ts` (Epic B) | `checkoutAssetCmd`, `checkinAssetCmd`, `checkoutAssetToLocationCmd` — wire |
| `src/app/actions/license.ts` (Epic B) | `checkoutLicenseSeatCmd`, `checkinLicenseSeatCmd`, `createLicense` — wire |
| `src/app/licenses/page.tsx` | Tier 1 chưa đọc — Tier 2 verify |

---

## 6. Quy ước (Tier 2 BẮT BUỘC)

1. **Mọi component mới PHẢI là 'use client'** nếu dùng hook (useState, useSession, useTransition).
2. **Modal dùng Portal** — render vào `document.body` để tránh bị che bởi overflow:hidden.
3. **Toast tự động clear sau 5 giây** — UX chuẩn.
4. **Server Action cho form modal** — pattern giống `createAsset` ở `/assets/new`.
5. **`requireRole(['ADMIN'])` ở đầu mọi server action write** — Epic C+1 đã có, GIỮ.
6. **RoleGate KHÔNG thay thế middleware/auth** — chỉ ẩn UI. Server vẫn enforce.

---

## BƯỚC 0: Pre-Audit

```bash
cd "D:\IT-management"

# 1. Verify state trước Epic D
npx tsc --noEmit 2>&1 | head -10
# Expected: 0 errors

npx jest --silent 2>&1 | tail -5
# Expected: 5 suites PASS, 46+ tests (39 Epic B + 7 Epic C+1)

# 2. Verify file `/licenses/page.tsx` tồn tại
Test-Path src\app\licenses\page.tsx
# Expected: True (Tier 2 verify)

# 3. Verify `/licenses/[id]/page.tsx` có thể chưa có
Test-Path src\app\licenses\[id]\page.tsx
# Expected: False (sẽ tạo mới)
```

---

## PHẦN 1: MVP POLISH (D-1 → D-6)

### BƯỚC 1: Tạo `src/components/RoleGate.tsx` (D-1)

**File mới.** 30 dòng.

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { Role } from '@/lib/auth-guard'

interface RoleGateProps {
  allowedRoles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Chỉ render `children` nếu session.user.role nằm trong `allowedRoles`.
 *
 * Phase 1: chỉ dùng để ẨN UI (button, link, menu item).
 * KHÔNG dùng để enforce security — server-side đã có `requireRole()`.
 *
 * Ví dụ:
 *   <RoleGate allowedRoles={['ADMIN']}>
 *     <Button>Checkout Asset</Button>
 *   </RoleGate>
 *
 *   <RoleGate allowedRoles={['EMPLOYEE']} fallback={null}>
 *     <p>Chỉ EMPLOYEE mới thấy dòng này</p>
 *   </RoleGate>
 */
export default function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { data: session, status } = useSession()

  // Loading state: chưa có session → render fallback (ẩn) hoặc placeholder
  if (status === 'loading') return fallback

  // Unauthenticated: middleware đã redirect, nhưng defensive fallback
  if (!session?.user?.role) return fallback

  if (!allowedRoles.includes(session.user.role)) return fallback

  return <>{children}</>
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "RoleGate.tsx" || echo "✅ No errors in RoleGate.tsx"
```

---

### BƯỚC 2: Tạo `src/components/Toast.tsx` (D-2)

**File mới.** 120 dòng.

```typescript
'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  code?: string  // optional — từ CommandResult<T>.code (NOT_FOUND, INVALID_STATE, FORBIDDEN, ...)
  durationMs?: number
}

interface ToastContextValue {
  toasts: ToastItem[]
  show: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: string) => void
  /** Helper cho server action result */
  showCommandResult: (result:
    | { ok: true; data: unknown }
    | { ok: false; code: string; message: string }
    | unknown,
    successMessage?: string
  ) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast phải dùng trong <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const duration = toast.durationMs ?? 5000
    setToasts(prev => [...prev, { ...toast, id }])
    setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  const showCommandResult = useCallback((
    result: unknown,
    successMessage?: string
  ) => {
    if (
      result &&
      typeof result === 'object' &&
      'ok' in result
    ) {
      if (result.ok === true) {
        if (successMessage) show({ type: 'success', message: successMessage })
      } else if (result.ok === false) {
        const r = result as { code: string; message: string }
        show({ type: 'error', message: r.message, code: r.code })
      }
    }
  }, [show])

  return (
    <ToastContext.Provider value={{ toasts, show, dismiss, showCommandResult }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onDismiss }: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map(t => <ToastItemView key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}

function ToastItemView({ toast, onDismiss }: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const Icon =
    toast.type === 'success' ? CheckCircle :
    toast.type === 'error' ? AlertCircle :
    Info

  const colorClass =
    toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
    toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
    'bg-blue-50 border-blue-200 text-blue-800'

  return (
    <div
      className={`flex items-start space-x-3 p-4 border rounded-xl shadow-lg backdrop-blur ${colorClass} animate-in slide-in-from-right`}
      role="alert"
    >
      <Icon size={20} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {toast.code && (
          <p className="text-xs font-mono uppercase tracking-wider opacity-70 mb-1">
            {toast.code}
          </p>
        )}
        <p className="text-sm">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-50 hover:opacity-100 transition"
      >
        <X size={16} />
      </button>
    </div>
  )
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "Toast.tsx" || echo "✅ No errors in Toast.tsx"
```

---

### BƯỚC 3: Wrap `<ToastProvider>` trong `src/app/layout.tsx`

**File sửa.**

```typescript
// Thêm import:
import ToastProvider from '@/components/Toast';

// Trong RootLayout, wrap children:
return (
  <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-gray-50`}>
    <body className="h-full flex overflow-hidden">
      <SessionProviderClient>
        <ToastProvider>  {/* ← thêm */}
          <AppShell>
            {children}
          </AppShell>
        </ToastProvider>
      </SessionProviderClient>
    </body>
  </html>
);
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "layout.tsx" || echo "✅ No errors"
```

---

### BƯỚC 4: Tạo `src/components/ui/Modal.tsx` (D-3 helper)

**File mới.** 80 dòng.

```typescript
'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  /** Width: 'sm' (max-w-sm) | 'md' (max-w-md) | 'lg' (max-w-lg). Default: md */
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  // Đóng modal khi nhấn Escape
  useEffect(() => {
    if (!open) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  // Disable scroll body khi modal mở
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (typeof window === 'undefined' || !open) return null

  const sizeClass = size === 'sm' ? 'max-w-sm' : size === 'lg' ? 'max-w-lg' : 'max-w-md'

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Modal panel */}
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizeClass} animate-in fade-in zoom-in-95`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "Modal.tsx" || echo "✅ No errors in Modal.tsx"
```

---

### BƯỚC 5: Tạo `src/components/assets/CheckoutAssetModal.tsx` (D-4)

**File mới.** ~200 dòng.

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import { checkoutAssetCmd, checkoutAssetToLocationCmd } from '@/app/actions/asset'
import { useToast } from '@/components/Toast'
import { User, MapPin, Loader2 } from 'lucide-react'

interface CheckoutAssetModalProps {
  open: boolean
  onClose: () => void
  assetId: string
  assetTag: string
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
  locations: { id: string; name: string }[]
}

type TargetType = 'USER' | 'LOCATION'

export default function CheckoutAssetModal({
  open, onClose, assetId, assetTag, users, locations
}: CheckoutAssetModalProps) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [targetType, setTargetType] = useState<TargetType>('USER')
  const [targetUserId, setTargetUserId] = useState<string>('')
  const [targetLocationId, setTargetLocationId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [expectedCheckin, setExpectedCheckin] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    startTransition(async () => {
      let result: unknown
      if (targetType === 'USER') {
        if (!targetUserId) {
          showCommandResult({ ok: false, code: 'VALIDATION', message: 'Vui lòng chọn nhân viên.' })
          return
        }
        result = await checkoutAssetCmd({
          assetId,
          targetUserId,
          notes: notes || undefined,
          expectedCheckin: expectedCheckin || undefined,
        })
      } else {
        if (!targetLocationId) {
          showCommandResult({ ok: false, code: 'VALIDATION', message: 'Vui lòng chọn vị trí.' })
          return
        }
        result = await checkoutAssetToLocationCmd({
          assetId,
          targetLocationId,
          notes: notes || undefined,
        })
      }
      showCommandResult(result, `Đã cấp phát asset "${assetTag}" thành công!`)
      if (result && typeof result === 'object' && 'ok' in result && result.ok) {
        onClose()
        router.refresh()
      }
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={`Cấp phát asset "${assetTag}"`} size="md">
      <div className="space-y-5">
        {/* Target Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Cấp phát cho</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTargetType('USER')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 rounded-xl transition ${
                targetType === 'USER'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <User size={18} />
              <span className="font-medium">Nhân viên</span>
            </button>
            <button
              type="button"
              onClick={() => setTargetType('LOCATION')}
              className={`flex items-center justify-center space-x-2 px-4 py-3 border-2 rounded-xl transition ${
                targetType === 'LOCATION'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <MapPin size={18} />
              <span className="font-medium">Vị trí</span>
            </button>
          </div>
        </div>

        {/* Target select */}
        {targetType === 'USER' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nhân viên <span className="text-red-500">*</span></label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
            >
              <option value="">-- Chọn nhân viên --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.firstName}{u.lastName ? ' ' + u.lastName : ''} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vị trí <span className="text-red-500">*</span></label>
            <select
              value={targetLocationId}
              onChange={(e) => setTargetLocationId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
            >
              <option value="">-- Chọn vị trí --</option>
              {locations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition resize-none"
            placeholder="Lý do cấp phát, dự án, v.v."
          />
        </div>

        {/* Expected checkin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ngày dự kiến thu hồi (optional)</label>
          <input
            type="date"
            value={expectedCheckin}
            onChange={(e) => setExpectedCheckin(e.target.value)}
            className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Đang cấp phát...
              </>
            ) : (
              'Xác nhận cấp phát'
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
```

---

### BƯỚC 6: Tạo `src/components/assets/CheckoutAssetButton.tsx` (D-3 wiring)

**File mới.** ~150 dòng.

```typescript
'use client'

import { useState, useEffect } from 'react'
import { checkoutAssetBtnStyles } from '@/lib/ui-classes' // optional
import { ShoppingCart } from 'lucide-react'
import CheckoutAssetModal from './CheckoutAssetModal'

interface CheckoutAssetButtonProps {
  assetId: string
  assetTag: string
  /** Phase 1: Server Component truyền vào sẵn (load users + locations ở parent) */
  users: { id: string; firstName: string; lastName: string | null; email: string | null }[]
  locations: { id: string; name: string }[]
}

export default function CheckoutAssetButton({ assetId, assetTag, users, locations }: CheckoutAssetButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition border border-blue-200"
      >
        <ShoppingCart size={14} className="mr-1" />
        Cấp phát
      </button>
      <CheckoutAssetModal
        open={open}
        onClose={() => setOpen(false)}
        assetId={assetId}
        assetTag={assetTag}
        users={users}
        locations={locations}
      />
    </>
  )
}
```

---

### BƯỚC 7: Sửa `src/app/assets/page.tsx` (wire button + checkin)

**File sửa.** Thêm:
- Load `users` + `locations` ở Promise.all
- `<RoleGate allowedRoles={['ADMIN']}>` wrap nút "Thêm Tài Sản"
- Mỗi row có `<CheckoutAssetButton>` (nếu asset trống) hoặc "Thu hồi" (nếu đã assign)

Tóm tắt thay đổi (Tier 2 implement chi tiết):

```typescript
// Thêm vào query:
const [assets, users, locations] = await Promise.all([
  prisma.asset.findMany({ include: { ... } }),
  prisma.user.findMany({
    where: { activated: true, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, email: true },
    orderBy: { firstName: 'asc' },
  }),
  prisma.location.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  }),
])

// Mỗi row có 2 button: Checkout (nếu trống) hoặc Checkin (nếu đã assign)
const isAssigned = !!(asset.assignedUserId || asset.assignedLocationId || asset.assignedAssetId)

// Wrap trong <RoleGate>:
<td>
  <RoleGate allowedRoles={['ADMIN']}>
    {isAssigned ? (
      <CheckinAssetButton assetId={asset.id} assetTag={asset.assetTag} />
    ) : (
      <CheckoutAssetButton
        assetId={asset.id}
        assetTag={asset.assetTag}
        users={users}
        locations={locations}
      />
    )}
  </RoleGate>
</td>
```

---

### BƯỚC 8: Tương tự cho `/licenses/[id]` (D-5)

Tạo file mới `src/app/licenses/[id]/page.tsx` nếu chưa có, hoặc sửa nếu có:

- Load license + seats + users
- Mỗi seat có 2 button: "Cấp" (trống) hoặc "Thu hồi" (đã assign)
- Wrap trong `<RoleGate>`

Tóm tắt — Tier 2 implement chi tiết tương tự Bước 7.

---

### BƯỚC 9: Wrap `/settings` link trong `Sidebar.tsx` (D-6)

```typescript
// Sửa Sidebar.tsx:
// 1. Thêm import:
import RoleGate from '@/components/RoleGate'
import { useSession } from 'next-auth/react'

// 2. Trong component, lấy session:
const { data: session } = useSession()
const isAdmin = session?.user?.role === 'ADMIN'

// 3. Thay vì hard-code navigation, filter based on role:
// (Giữ tất cả link trong array, dùng RoleGate bọc)
{navigation.map(item => (
  <RoleGate
    key={item.href}
    allowedRoles={item.href === '/settings' ? ['ADMIN'] : ['ADMIN', 'EMPLOYEE']}
  >
    <Link href={item.href} ...>...</Link>
  </RoleGate>
))}
```

---

### BƯỚC 10: Tests cho RoleGate + Toast (D-1, D-2 verification)

```typescript
// tests/role-gate.test.tsx — file mới
// Test với React Testing Library:
// 1. Mock next-auth useSession
// 2. Render <RoleGate allowedRoles={['ADMIN']}>
// 3. Verify children render khi role match
// 4. Verify fallback khi role không match

// tests/toast.test.tsx — file mới
// Test showCommandResult:
// 1. Render <ToastProvider> + child component gọi useToast()
// 2. Pass { ok: true, data: {} } → expect 'success' toast rendered
// 3. Pass { ok: false, code: 'FORBIDDEN', message: '...' } → expect 'error' toast with code
```

(Tier 2 tự viết — pattern tham khảo từ tests/auth-guard.test.ts Epic C+1)

---

## PHẦN 2: SECURITY BONUS (D-7, D-8)

### BƯỚC 11: Tạo `src/lib/rate-limit.ts`

**File mới.** 60 dòng.

```typescript
/**
 * Simple in-memory rate-limit cho Next.js API routes.
 *
 * Phase 1: dùng Map in-memory → chỉ work trong 1 Node.js process.
 * Phase 2: chuyển sang Redis (Upstash) khi scale multi-instance.
 *
 * Cú pháp giống `next-rate-limit` API để dễ migrate Phase 2.
 *
 * Ví dụ:
 *   const result = checkRateLimit({ key: `login:${ip}`, max: 5, windowMs: 60000 })
 *   if (!result.allowed) return new Response('Too Many Requests', { status: 429 })
 */
interface RateLimitConfig {
  key: string                  // unique key (vd: IP + endpoint)
  max: number                  // số request tối đa
  windowMs: number             // thời gian (ms)
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number              // timestamp ms khi reset
}

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const { key, max, windowMs } = config
  const now = Date.now()
  const existing = buckets.get(key)

  // Bucket hết hạn hoặc chưa tồn tại → reset
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  // Bucket còn hạn + count++
  existing.count += 1
  buckets.set(key, existing)

  if (existing.count > max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  return {
    allowed: true,
    remaining: max - existing.count,
    resetAt: existing.resetAt,
  }
}

/** Test-only helper: xóa tất cả bucket. */
export function _resetRateLimitForTesting() {
  buckets.clear()
}
```

---

### BƯỚC 12: Tạo `src/app/api/auth/[...nextauth]/route.ts`

**File mới.** 30 dòng. Wrap NextAuth handler với rate-limit.

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

const handler = NextAuth(authOptions)

/**
 * Wrap NextAuth handler — rate-limit cho POST request (login attempts).
 *
 * Lấy IP từ header x-forwarded-for (nếu chạy sau proxy/load balancer) hoặc
 * fallback 'unknown'. Production nên dùng `request.ip` hoặc CDN header đáng tin.
 */
async function rateLimitedHandler(req: Request) {
  // Rate-limit CHỈ áp dụng cho POST (sign-in, callback)
  if (req.method === 'POST') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'

    const result = checkRateLimit({
      key: `auth:${ip}`,
      max: 5,
      windowMs: 60_000, // 5 attempt / 60s / IP
    })

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Too many login attempts. Please try again in a minute.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }
  }

  return handler(req, {} as never)
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST }
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "route.ts" || echo "✅ No errors"
```

---

### BƯỚC 13: Enable password field real check (D-7)

**File sửa:** `src/app/login/page.tsx`

```typescript
// 1. Enable password field — xóa disabled
<input
  id="password"
  name="password"
  type="password"
  autoComplete="current-password"
  required  // ← thêm required
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl ... bg-white"  // ← bg-white thay vì bg-gray-100
  placeholder="Nhập mật khẩu"
/>

// 2. Sửa handleSubmit — gửi password thật
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError(null)

  const result = await signIn('credentials', {
    email,
    password,  // ← gửi password thật, không còn hard-code "any"
    redirect: false,
  })

  // ... (giữ error handling)
}

// 3. Thêm useState cho password:
// const [password, setPassword] = useState('')

// 4. Xóa đoạn "test accounts hint" ở cuối form
```

---

### BƯỚC 14: Cập nhật `src/lib/auth.ts` (bỏ bypass khi password empty)

**File sửa.** Chỗ này Epic C cố tình bypass khi `credentials.password` rỗng — giờ bỏ bypass.

```typescript
// Cũ:
if (credentials.password && user.password) {
  const ok = await bcrypt.compare(credentials.password, user.password);
  if (!ok) return null;
}

// Mới:
if (!user.password) {
  // User chưa set password (LDAP/SSO Phase 2) → reject nếu Phase 1
  return null;
}

if (!credentials.password) return null;

const ok = await bcrypt.compare(credentials.password, user.password);
if (!ok) return null;
```

---

### BƯỚC 15: Tests

`tests/rate-limit.test.ts` — test checkRateLimit logic (pure function, dễ test).

(Tier 2 tự viết — 4-5 tests cơ bản: cho phép lần đầu, block sau khi đạt max, reset sau window, etc.)

---

## BƯỚC 16: Final verify

```bash
cd "D:\IT-management"

# 1. tsc clean
npx tsc --noEmit 2>&1 | tail -10
# Expected: 0 errors

# 2. Jest all suites
npx jest --silent 2>&1 | tail -10
# Expected: 8+ suites PASS, 70+ tests

# 3. Manual smoke test (theo 11 acceptance criteria D-1 → D-11)
```

**Nếu tất cả PASS → Epic D PASS.**

---

## Phụ lục A: File KHÔNG patch

| File | Lý do |
|------|-------|
| `prisma/schema.prisma` | A1 đã verified |
| `prisma/seed.ts` | Đã seed |
| `src/lib/prisma.ts` | Adapter OK |
| `src/lib/errors.ts` | Epic B + C+1 đã đúng |
| `src/lib/auth-guard.ts` | Epic C+1 đã đúng |
| `src/lib/audit.ts` | Epic B đã đúng |
| `src/lib/locking.ts` | Epic B đã đúng |
| `src/lib/commands/*` | Epic B đã đúng |
| `src/app/actions/asset.ts` | Epic B + C+1 đã đúng — wire từ UI |
| `src/app/actions/license.ts` | Epic B + C+1 đã đúng — wire từ UI |
| `src/proxy.ts` / `src/middleware.ts` | Epic C đã đúng |
| `src/types/next-auth.d.ts` | Session.role đã đúng |
| `src/lib/auth.ts` | CHỈ sửa nhỏ D-14 (bỏ bypass password) |
| `src/components/SessionProvider.tsx` | OK |
| `src/components/Header.tsx` | Epic C đã đúng (role badge) |

---

## Phụ lục B: Effort estimate

| Step | Effort |
|---|---|
| Bước 0: Pre-Audit | 1 phút |
| Bước 1: RoleGate | 1 giờ |
| Bước 2: Toast | 1 giờ |
| Bước 3: ToastProvider wrap | 5 phút |
| Bước 4: Modal helper | 1 giờ |
| Bước 5: CheckoutAssetModal | 2 giờ |
| Bước 6: CheckoutAssetButton | 1 giờ |
| Bước 7: Wire `/assets` page | 1.5 giờ |
| Bước 8: Wire `/licenses` page | 1.5 giờ |
| Bước 9: Sidebar RoleGate | 30 phút |
| Bước 10: Tests | 1 giờ |
| Bước 11: rate-limit.ts | 1 giờ |
| BƯỚC 12: API route | 30 phút |
| Bước 13: login enable password | 30 phút |
| Bước 14: auth.ts fix bypass | 5 phút |
| Bước 15: rate-limit tests | 30 phút |
| Bước 16: verify | 30 phút |
| **Tổng** | **~14 giờ = 2 ngày** |

→ Epic lớn nhất từ đầu tới giờ. Tôi recommend Tier 2 cày trong **2 ngày liên tục** với breaks.

---

## Phụ lục C: Lý do thiết kế chính

### C.1 Tại sao tách RoleGate, Toast, Modal ra components riêng?

| Component | Lý do tách |
|-----------|-----------|
| `RoleGate` | Dùng ở nhiều chỗ (Sidebar, list buttons, dashboard widgets) |
| `Toast` | Generic, dùng cho mọi server action result |
| `Modal` | Generic, dùng cho checkout asset + checkout license seat + (Phase 2: create category, etc.) |

→ Tái sử dụng cao. Phase 3 thêm modal mới không cần viết lại CSS.

### C.2 Tại sao Toast dùng Context chứ không phải Redux/Zustand?

- MVP đơn giản, chỉ cần 1 toast queue toàn cục
- Context + useState đủ dùng
- Tránh thêm dependency Redux/Zustand (~10KB+)

### C.3 Tại sao rate-limit dùng in-memory Map?

Phase 1: 1 process Node.js (Vercel serverless hoặc single server) → in-memory đủ.

Phase 2: scale multi-instance → phải Redis. Cú pháp `checkRateLimit()` interface giữ nguyên → chỉ swap implementation.

### C.4 Tại sao enable password thật (bỏ bypass MVP)?

Tech debt Tier 2 nêu — Phase 1 đã có seed `password123` cho admin/nhanvien. Enable thật không tốn effort, giải quyết bảo mật quan trọng (ai cũng login được nếu bypass).

### C.5 Tại sao KHÔNG enable rate-limit cho toàn bộ `/api/*`?

Phase 1 chỉ có `/api/auth/*` là critical (brute force login). Các API khác sẽ được gate bởi session check nên attacker không reach được.

---

## Phụ lục D: Common pitfalls

### D.1 Modal không đóng khi submit xong

Triệu chứng: Modal vẫn mở sau khi submit success.

**Fix:** Đảm bảo gọi `onClose()` SAU khi `showCommandResult` success. Trong MSEW:
```typescript
if (result && typeof result === 'object' && 'ok' in result && result.ok) {
  onClose()
  router.refresh()
}
```

### D.2 Toast xuất hiện nhưng không tự ẩn

Triệu chứng: Toast stuck mãi trên UI.

**Fix:** Verify `setTimeout` được gọi trong `show()` (đã có trong MSEW). Đừng quên `dismiss(id)` trong cleanup.

### D.3 EMPLOYEE vẫn thấy nút checkout

Triệu chứng: Dù đã wrap RoleGate, nút vẫn hiển thị với EMPLOYEE.

**Fix:**
1. Verify `<RoleGate>` được wrap ngoài `<button>`
2. Verify `useSession()` trả role đúng trong browser DevTools → Application → Cookies → next-auth.session-token → decode JWT
3. Hard refresh (Ctrl+Shift+R) — Next.js có thể cache

### D.4 Rate-limit bypass khi restart server

Triệu chứng: Sau khi restart dev server, in-memory Map bị reset → attacker bypass được.

**Chấp nhận được cho Phase 1** (dev + demo). Phase 2 sẽ chuyển Redis.

### D.5 Test fail vì mock `next-auth`

Triệu chứng: Test không pass vì `useSession` mock sai.

**Fix:** Pattern mock đúng:
```typescript
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
  signIn: jest.fn(),
}))
```

---

## Phụ lục E: Sau khi Epic D xong — Phase 1 MVP done

Sau Epic D PASS, MVP **đã chạy được production-ready cho demo**:

| Feature | Status |
|---------|--------|
| Login thật với bcrypt | ✅ |
| Rate-limit brute force | ✅ |
| Dashboard role-aware | ✅ |
| List assets/licenses | ✅ |
| Checkout/checkin commands | ✅ |
| Audit log đầy đủ | ✅ |
| RBAC ADMIN/EMPLOYEE | ✅ |
| UI ẩn nút với EMPLOYEE | ✅ |
| Toast error display | ✅ |
| Modal chọn target | ✅ |

→ Tier 2 có thể demo cho stakeholder.

**Phase 2 sẽ có:**
- Bulk checkout (nhiều asset)
- Approval workflow (employee request → admin approve)
- Settings page thật (FMCS, depreciation rules, etc.)
- LDAP/SSO integration
- Redis rate-limit
- Mobile REST API
- Email notifications

---

**HẾT MSEW-epic-D-ui-checkout-flow.md**

Tổng kết: 16 bước, ~20 file (15 mới + 5 sửa), ~1500 dòng code, effort ~14 giờ (2 ngày). MVP-ready sau epic này.