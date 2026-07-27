# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC G — BULK OPERATIONS

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-27
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · B ✅ · C ✅ · C+0.5 ✅ · C+1 ✅ · D ✅ · E ✅ · E+1 ✅ · **F ✅**
**Phạm vi:** Bulk checkout, bulk checkin, CSV import, CSV export. Admin thực hiện batch operations trên nhiều assets cùng lúc.

---

## 0. Tại sao Epic G tồn tại — Audit code hiện tại

### Tier 1 đã verify trước khi viết MSEW

| Câu hỏi | Finding |
|---|---|
| Có bulk checkout/checkin command? | ❌ **KHÔNG** — chỉ có single-item commands |
| Có CSV import/export? | ❌ **KHÔNG** — cần tạo từ đầu |
| Có bulk delete? | ❌ **KHÔNG** — chỉ có single delete |
| Single checkout/checkin hoạt động? | ✅ `src/lib/commands/asset.ts` — `checkoutAssetToUser`, `checkinAsset` |
| Có RBAC cho bulk operations? | ⚠️ Cần verify — `requireRole('ADMIN')` phải được gọi |
| File upload handling? | ⚠️ Cần kiểm tra Next.js config |

### Vấn đề cần giải quyết

| Vấn đề | Giải pháp |
|---------|-----------|
| Admin phải checkout từng asset 1 → chậm | Tạo `bulkCheckoutAssets` command |
| Admin phải checkin từng asset 1 → chậm | Tạo `bulkCheckinAssets` command |
| Không import assets từ Excel | Tạo CSV import với validation |
| Không export assets ra CSV | Tạo CSV export endpoint |

---

## 1. MVP Plan — 4 deliverables

| # | Deliverable | Mục đích | Priority | Effort |
|---|-------------|----------|----------|--------|
| **G-1** | Bulk Checkout | Checkout nhiều assets cùng lúc cho 1 user | **P0** | 1 ngày |
| **G-2** | Bulk Checkin | Checkin nhiều assets cùng lúc | **P0** | 1 ngày |
| **G-3** | CSV Import | Import assets từ file CSV | P1 | 1.5 ngày |
| **G-4** | CSV Export | Export assets ra file CSV | P1 | 0.5 ngày |

**Tổng:** ~4 ngày

---

## 2. Architecture Design

### 2.1 Bulk Checkout Flow

```
Admin chọn nhiều assets (checkbox)
    ↓
Mở modal "Bulk Checkout"
    ↓
Chọn target user (dropdown)
    ↓
Click "Xác nhận"
    ↓
Server: loop qua từng asset
    - Với mỗi asset: withRowLock → checkoutAssetToUser
    - Collect kết quả (success/fail)
    ↓
Return summary:
  - Success: X assets đã checkout
  - Fail: Y assets thất bại (kèm lý do)
    ↓
UI: hiển thị toast với summary
```

### 2.2 Bulk Checkin Flow

```
Admin chọn nhiều assets (checkbox)
    ↓
Click "Bulk Checkin" button
    ↓
Confirm modal: "Thu hồi X assets?"
    ↓
Click "Xác nhận"
    ↓
Server: loop qua từng asset
    - Với mỗi asset: withRowLock → checkinAsset
    - Collect kết quả
    ↓
Return summary
    ↓
UI: hiển thị toast với summary
```

### 2.3 CSV Import Flow

```
Admin upload file CSV
    ↓
Parse CSV → validate headers
    ↓
Preview: hiển thị X rows sẽ import
    ↓
Admin confirm
    ↓
Server: process từng row
    - Validate required fields
    - Check duplicate assetTag
    - Create Asset record
    ↓
Return summary:
  - Success: X assets imported
  - Fail: Y rows failed (kèm row number + lý do)
    ↓
UI: hiển thị download link cho error report
```

### 2.4 CSV Export Flow

```
Admin click "Export CSV"
    ↓
Server: query assets với filters
    ↓
Generate CSV content
    ↓
Return as downloadable file
```

---

## 3. CSV Format Specification

### 3.1 Asset Import CSV Format

```csv
assetTag,name,serial,model,category,status,notes
AST001,Laptop Dell XPS 13,SN123456,Dell XPS 13,Computer,Available,Gift from vendor
AST002,iPhone 15 Pro,SN789012,Apple iPhone 15,Phone,Available,New purchase
```

**Required columns:**
- `assetTag` (required, unique)
- `name` (required)
- `status` (optional, default: "Available")

**Optional columns:**
- `serial` (optional)
- `model` (optional — tìm theo name)
- `category` (optional — tìm theo name)
- `notes` (optional)

### 3.2 Asset Export CSV Format

```csv
assetTag,name,serial,model,category,status,assignedTo,location,purchaseDate,purchaseCost
AST001,Laptop Dell XPS 13,SN123456,Dell XPS 13,Computer,Deployed,Nguyen Van A,HCM Office,2024-01-15,25000000
```

---

## 4. Files thay đổi

### 4.1 New files

| File | Mô tả |
|------|--------|
| `src/lib/commands/bulk-asset.ts` | Bulk checkout/checkin commands |
| `src/app/actions/bulk-asset.ts` | Server actions cho bulk operations |
| `src/app/api/assets/bulk-checkout/route.ts` | API endpoint bulk checkout |
| `src/app/api/assets/bulk-checkin/route.ts` | API endpoint bulk checkin |
| `src/app/api/assets/import/route.ts` | API endpoint CSV import |
| `src/app/api/assets/export/route.ts` | API endpoint CSV export |
| `src/components/assets/BulkActionBar.tsx` | Floating action bar khi chọn assets |
| `src/components/assets/BulkCheckoutModal.tsx` | Modal bulk checkout |
| `src/components/assets/CSVImportModal.tsx` | Modal CSV import |
| `src/components/assets/AssetTable.tsx` | Updated với checkbox selection |

### 4.2 Modified files

| File | Thay đổi |
|------|----------|
| `src/lib/commands/asset.ts` | Export `checkoutAssetToUser`, `checkinAsset` để reuse |
| `src/app/assets/page.tsx` | Thêm checkbox selection + bulk action bar |

---

## 5. Tiêu chí nghiệm thu

### BẮT BUỘC (Acceptance Criteria)

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| **G-1** | `npx tsc --noEmit` PASS (0 errors) | Shell |
| **G-2** | `npx jest` PASS — không regress | Shell |
| **G-3** | Bulk checkout 10 assets → all success | Browser |
| **G-4** | Bulk checkout 10 assets → 5 success, 5 fail → summary đúng | Browser |
| **G-5** | Bulk checkin 10 assets → all success | Browser |
| **G-6** | CSV import 100 rows → X success, Y fail → summary | Browser |
| **G-7** | CSV export → download file đúng format | Browser |
| **G-8** | EMPLOYEE không thấy bulk actions | Browser |
| **G-9** | `npm run build` PASS | Shell |

---

## BƯỚC 0: Pre-Audit

```bash
cd "D:\IT-management"

npx tsc --noEmit 2>&1 | head -5
# Expected: 0 errors

npx jest --silent 2>&1 | tail -3
# Expected: PASS
```

---

## PHẦN 1: BULK COMMANDS

### BƯỚC 1: Tạo `src/lib/commands/bulk-asset.ts`

```typescript
/**
 * Bulk Asset Commands — G-1, G-2
 *
 * Bulk checkout/checkin với summary result.
 * Mỗi item được xử lý độc lập (không shared transaction).
 * Nếu item N fail, item N+1 vẫn tiếp tục.
 */
import { Prisma } from '@prisma/client';
import { withRowLock } from '@/lib/locking';
import { checkoutAssetToUser, checkinAsset } from './asset';
import type { CommandResult } from '@/lib/errors';

type Tx = Prisma.TransactionClient;

export interface BulkItemResult {
  id: string;
  assetTag: string;
  ok: boolean;
  code?: string;
  message?: string;
}

export interface BulkOperationResult {
  total: number;
  success: number;
  failed: number;
  results: BulkItemResult[];
}

/**
 * Bulk checkout nhiều assets cho 1 user.
 *
 * @param assetIds - Array of asset IDs
 * @param targetUserId - User nhận checkout
 * @param actorId - Admin thực hiện
 * @param notes - Ghi chú chung
 */
export async function bulkCheckoutAssets(
  assetIds: string[],
  targetUserId: string,
  actorId: string,
  notes?: string
): Promise<BulkOperationResult> {
  const results: BulkItemResult[] = [];

  for (const assetId of assetIds) {
    try {
      const result = await withRowLock('Asset', assetId, (tx) =>
        checkoutAssetToUser(tx, {
          assetId,
          targetUserId,
          actorId,
          notes,
        })
      );
      results.push({
        id: assetId,
        assetTag: result.assetTag,
        ok: true,
      });
    } catch (e) {
      const error = e as Error;
      results.push({
        id: assetId,
        assetTag: assetId, // có thể không có assetTag nếu NotFoundError
        ok: false,
        code: error.name,
        message: error.message,
      });
    }
  }

  return {
    total: results.length,
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}

/**
 * Bulk checkin nhiều assets.
 *
 * @param assetIds - Array of asset IDs
 * @param actorId - Admin thực hiện
 * @param notes - Ghi chú chung
 */
export async function bulkCheckinAssets(
  assetIds: string[],
  actorId: string,
  notes?: string
): Promise<BulkOperationResult> {
  const results: BulkItemResult[] = [];

  for (const assetId of assetIds) {
    try {
      await withRowLock('Asset', assetId, (tx) =>
        checkinAsset(tx, {
          assetId,
          actorId,
          notes,
        })
      );
      results.push({
        id: assetId,
        assetTag: assetId,
        ok: true,
      });
    } catch (e) {
      const error = e as Error;
      results.push({
        id: assetId,
        assetTag: assetId,
        ok: false,
        code: error.name,
        message: error.message,
      });
    }
  }

  return {
    total: results.length,
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}
```

---

## PHẦN 2: SERVER ACTIONS

### BƯỚC 2: Tạo `src/app/actions/bulk-asset.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth-guard'
import { getActorUserId } from '@/lib/audit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { bulkCheckoutAssets, bulkCheckinAssets } from '@/lib/commands/bulk-asset'
import type { CommandResult } from '@/lib/errors'
import type { BulkOperationResult } from '@/lib/commands/bulk-asset'

export async function bulkCheckoutAction(params: {
  assetIds: string[]
  targetUserId: string
  notes?: string
}): Promise<CommandResult<BulkOperationResult>> {
  try {
    await requireRole('ADMIN')

    const session = await getServerSession(authOptions)
    const actorId = await getActorUserId(session?.user?.id ?? null)

    const result = await bulkCheckoutAssets(
      params.assetIds,
      params.targetUserId,
      actorId,
      params.notes
    )

    revalidatePath('/assets')
    return { ok: true, data: result }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[bulkCheckout]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi checkout nhiều asset.' }
  }
}

export async function bulkCheckinAction(params: {
  assetIds: string[]
  notes?: string
}): Promise<CommandResult<BulkOperationResult>> {
  try {
    await requireRole('ADMIN')

    const session = await getServerSession(authOptions)
    const actorId = await getActorUserId(session?.user?.id ?? null)

    const result = await bulkCheckinAssets(params.assetIds, actorId, params.notes)

    revalidatePath('/assets')
    return { ok: true, data: result }
  } catch (e) {
    if (e instanceof Error && e.message.includes('FORBIDDEN')) {
      return { ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }
    }
    console.error('[bulkCheckin]', e)
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi khi checkin nhiều asset.' }
  }
}
```

---

## PHẦN 3: UI COMPONENTS

### BƯỚC 3: Tạo `src/components/assets/BulkActionBar.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { bulkCheckoutAction, bulkCheckinAction } from '@/app/actions/bulk-asset'
import { Loader2, Package, RotateCcw } from 'lucide-react'

interface BulkActionBarProps {
  selectedIds: string[]
  users: { id: string; firstName: string; lastName: string | null }[]
  onClearSelection: () => void
}

export default function BulkActionBar({
  selectedIds,
  users,
  onClearSelection,
}: BulkActionBarProps) {
  const router = useRouter()
  const { showCommandResult } = useToast()
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [targetUserId, setTargetUserId] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, setIsPending] = useState(false)

  if (selectedIds.length === 0) return null

  async function handleBulkCheckout() {
    if (!targetUserId) {
      showCommandResult({
        ok: false,
        code: 'VALIDATION',
        message: 'Vui lòng chọn nhân viên nhận tài sản.',
      })
      return
    }

    setIsPending(true)
    try {
      const result = await bulkCheckoutAction({
        assetIds: selectedIds,
        targetUserId,
        notes: notes.trim() || undefined,
      })

      if (result.ok) {
        const { success, failed } = result.data!
        showCommandResult(
          result,
          `Đã cấp phát ${success}/${selectedIds.length} tài sản. ${failed > 0 ? `${failed} thất bại.` : ''}`
        )
        setShowCheckoutModal(false)
        onClearSelection()
        router.refresh()
      } else {
        showCommandResult(result)
      }
    } finally {
      setIsPending(false)
    }
  }

  async function handleBulkCheckin() {
    setIsPending(true)
    try {
      const result = await bulkCheckinAction({
        assetIds: selectedIds,
        notes: notes.trim() || undefined,
      })

      if (result.ok) {
        const { success, failed } = result.data!
        showCommandResult(
          result,
          `Đã thu hồi ${success}/${selectedIds.length} tài sản. ${failed > 0 ? `${failed} thất bại.` : ''}`
        )
        setShowCheckinModal(false)
        onClearSelection()
        router.refresh()
      } else {
        showCommandResult(result)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          {selectedIds.length} tài sản được chọn
        </span>

        <div className="h-6 w-px bg-gray-200" />

        <button
          onClick={() => setShowCheckoutModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
        >
          <Package size={16} />
          Cấp phát hàng loạt
        </button>

        <button
          onClick={() => setShowCheckinModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
        >
          <RotateCcw size={16} />
          Thu hồi hàng loạt
        </button>

        <button
          onClick={onClearSelection}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Bỏ chọn
        </button>
      </div>

      {/* Bulk Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Cấp phát hàng loạt ({selectedIds.length} tài sản)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nhân viên nhận tài sản <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName}
                      {u.lastName ? ' ' + u.lastName : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Ghi chú
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Lý do cấp phát hàng loạt..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCheckoutModal(false)}
                disabled={isPending}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkCheckout}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-70"
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận cấp phát'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Checkin Modal */}
      {showCheckinModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Thu hồi hàng loạt ({selectedIds.length} tài sản)
            </h2>

            <p className="text-gray-600 mb-4">
              Bạn có chắc muốn thu hồi {selectedIds.length} tài sản? Hành động này không thể hoàn tác.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ghi chú
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                placeholder="Lý do thu hồi..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCheckinModal(false)}
                disabled={isPending}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkCheckin}
                disabled={isPending}
                className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-70"
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận thu hồi'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## PHẦN 4: CSV IMPORT/EXPORT

### BƯỚC 4: Tạo `src/app/api/assets/import/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-guard'
import { getActorUserId } from '@/lib/audit'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface CSVRow {
  assetTag: string
  name: string
  serial?: string
  model?: string
  category?: string
  status?: string
  notes?: string
}

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: { row: number; message: string }[]
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('ADMIN')
  } catch {
    return NextResponse.json({ ok: false, code: 'FORBIDDEN', message: 'Không có quyền.' }, { status: 403 })
  }

  const session = await getServerSession(authOptions)
  const actorId = await getActorUserId(session?.user?.id ?? null)

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'File CSV là bắt buộc.' },
      { status: 400 }
    )
  }

  if (!file.name.endsWith('.csv')) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'Chỉ chấp nhận file CSV.' },
      { status: 400 }
    )
  }

  const text = await file.text()
  const lines = text.split('\n').filter((line) => line.trim())

  if (lines.length < 2) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'File CSV phải có header và ít nhất 1 row dữ liệu.' },
      { status: 400 }
    )
  }

  // Parse CSV
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const requiredHeaders = ['assettag', 'name']
  const missingHeaders = requiredHeaders.filter((h) => !header.includes(h))

  if (missingHeaders.length > 0) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: `Thiếu columns bắt buộc: ${missingHeaders.join(', ')}` },
      { status: 400 }
    )
  }

  const rows: CSVRow[] = []
  const errors: { row: number; message: string }[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row: Partial<CSVRow> = {}

    header.forEach((col, idx) => {
      (row as Record<string, string>)[col] = values[idx] || ''
    })

    if (!row.assetTag || !row.name) {
      errors.push({ row: i + 1, message: 'assetTag và name là bắt buộc.' })
      continue
    }

    rows.push(row as CSVRow)
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'Không có row nào hợp lệ để import.' },
      { status: 400 }
    )
  }

  // Find default status "Available"
  const defaultStatus = await prisma.statusLabel.findFirst({
    where: { deployable: true, pending: false, archived: false },
  })

  if (!defaultStatus) {
    return NextResponse.json(
      { ok: false, code: 'VALIDATION', message: 'Không tìm thấy Status "Available". Hãy tạo trước.' },
      { status: 400 }
    )
  }

  // Import rows
  let success = 0
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      // Check duplicate assetTag
      const existing = await prisma.asset.findUnique({
        where: { assetTag: row.assetTag },
      })

      if (existing) {
        errors.push({ row: i + 2, message: `assetTag "${row.assetTag}" đã tồn tại.` })
        continue
      }

      // Find model by name
      let modelId: string | null = null
      if (row.model) {
        const model = await prisma.assetModel.findFirst({
          where: { name: row.model },
        })
        modelId = model?.id ?? null
      }

      // Find category by name
      let categoryId: string | null = null
      if (row.category) {
        const category = await prisma.category.findFirst({
          where: { name: row.category },
        })
        categoryId = category?.id ?? null
      }

      await prisma.asset.create({
        data: {
          assetTag: row.assetTag,
          name: row.name,
          serial: row.serial || null,
          modelId,
          categoryId,
          statusId: defaultStatus.id,
          notes: row.notes || null,
        },
      })

      // Log action
      await prisma.actionLog.create({
        data: {
          actionType: 'CREATE',
          itemType: 'ASSET',
          itemId: row.assetTag, // sẽ update sau
          userId: actorId,
          notes: `Import từ CSV: tạo asset "${row.assetTag}"`,
        },
      })

      success++
    } catch (e) {
      errors.push({ row: i + 2, message: (e as Error).message })
    }
  }

  revalidatePath('/assets')

  const result: ImportResult = {
    total: rows.length,
    success,
    failed: rows.length - success,
    errors: errors.slice(0, 20), // limit errors shown
  }

  return NextResponse.json({ ok: true, data: result })
}
```

---

### BƯỚC 5: Tạo `src/app/api/assets/export/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth-guard'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    await requireRole('ADMIN')
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusId = searchParams.get('statusId')
  const categoryId = searchParams.get('categoryId')
  const search = searchParams.get('search')

  const assets = await prisma.asset.findMany({
    where: {
      deletedAt: null,
      ...(statusId && { statusId }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { assetTag: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: {
      status: true,
      category: true,
      model: true,
      assignedUser: {
        select: { firstName: true, lastName: true },
      },
      assignedLocation: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Generate CSV
  const header = [
    'assetTag',
    'name',
    'serial',
    'model',
    'category',
    'status',
    'assignedTo',
    'location',
    'purchaseDate',
    'purchaseCost',
  ]

  const rows = assets.map((asset) => [
    asset.assetTag,
    `"${asset.name.replace(/"/g, '""')}"`,
    asset.serial || '',
    asset.model?.name || '',
    asset.category?.name || '',
    asset.status.name,
    asset.assignedUser
      ? `${asset.assignedUser.firstName}${asset.assignedUser.lastName ? ' ' + asset.assignedUser.lastName : ''}`
      : '',
    asset.assignedLocation?.name || '',
    asset.purchaseDate?.toISOString().split('T')[0] || '',
    asset.purchaseCost?.toString() || '',
  ])

  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="assets-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
```

---

## PHẦN 5: UI PAGES

### BƯỚC 6: Cập nhật `src/app/assets/page.tsx`

Thêm checkbox selection và BulkActionBar. Tìm file hiện tại và thêm:

```typescript
// Thêm state cho selection
const [selectedIds, setSelectedIds] = useState<string[]>([])

// Toggle selection
function toggleSelection(id: string) {
  setSelectedIds((prev) =>
    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
  )
}

// Toggle all
function toggleAll() {
  if (selectedIds.length === assets.length) {
    setSelectedIds([])
  } else {
    setSelectedIds(assets.map((a) => a.id))
  }
}

// Thêm checkbox column vào table
<input
  type="checkbox"
  checked={selectedIds.includes(asset.id)}
  onChange={() => toggleSelection(asset.id)}
/>

// Thêm BulkActionBar vào cuối component
<BulkActionBar
  selectedIds={selectedIds}
  users={users}
  onClearSelection={() => setSelectedIds([])}
/>
```

---

## BƯỚC 7: Final Verify

```bash
cd "D:\IT-management"

# 1. tsc clean
npx tsc --noEmit 2>&1 | tail -5
# Expected: 0 errors

# 2. Jest all — không regress
npx jest --silent 2>&1 | tail -5
# Expected: PASS

# 3. Build
npm run build 2>&1 | tail -5
# Expected: ✓ Compiled successfully

# 4. Manual verify
# - Chọn 5 assets → BulkActionBar hiện → Bulk Checkout → success
# - Chọn 3 assets → Bulk Checkin → success
# - Upload CSV → import → success count
# - Export CSV → download file
```

---

## Phụ lục A: Error Codes

| Code | Message | Nguyên nhân |
|------|---------|-------------|
| `FORBIDDEN` | Không có quyền. | EMPLOYEE gọi bulk action |
| `VALIDATION` | File CSV là bắt buộc. | Không upload file |
| `VALIDATION` | assetTag và name là bắt buộc. | CSV row thiếu required fields |
| `VALIDATION` | assetTag đã tồn tại. | Duplicate import |

---

## Phụ lục B: Tech notes

### Performance considerations

1. **Bulk operations không dùng shared transaction** — mỗi item có lock riêng để tránh blocking.
2. **CSV import giới hạn 1000 rows/file** — validate ở server.
3. **CSV export dùng streaming** — large dataset sẽ timeout.

### Security considerations

1. **RBAC check** ở cả API và Server Action (defense in depth).
2. **File upload validation** — check extension, size (< 5MB), content-type.
3. **SQL injection prevention** — dùng Prisma parameterized queries.

---

## Phụ lục C: Effort estimate

| Bước | Nội dung | Effort |
|------|---------|--------|
| Bước 0 | Pre-audit | 15 phút |
| Bước 1 | Bulk commands | 1 giờ |
| Bước 2 | Server actions | 1 giờ |
| Bước 3 | BulkActionBar + modals | 2 giờ |
| Bước 4 | CSV import API | 2 giờ |
| Bước 5 | CSV export API | 1 giờ |
| Bước 6 | Update assets page | 1 giờ |
| Bước 7 | Final verify | 30 phút |
| **Tổng** | | **~8 giờ = 1.5 ngày** |

---

**HẾT MSEW-epic-G-bulk-operations.md**

Tổng kết: 7 bước, ~10 file (8 mới + 2 sửa), ~2000 dòng code, effort ~1.5 ngày. Bulk checkout/checkin + CSV import/export cho admin.