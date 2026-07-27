# Khảo sát: License ↔ Asset ↔ User Relationship & UI Gap

**Người lập:** Tier 2 (Reviewer/Architect)
**Ngày lập:** 2026-07-28 03:00 UTC+7
**Phạm vi:** Toàn bộ codebase MSEW (Next.js 15 + Prisma + RBAC)
**Phương pháp:** Đọc trực tiếp `prisma/schema.prisma` + `src/lib/commands/license.ts` + `src/app/{licenses,assets,settings/users}/**`

---

## 1. Context — Câu hỏi nghiệp vụ

> Khi 1 License được gán cho 1 **Asset**, và Asset đó lại được cấp phát cho 1 **User** thì hiển nhiên User đó cũng đang được cấp phát license đó (tuy nhiên **không gán trực tiếp** vào User mà **chỉ hiển thị để biết** thôi).
>
> Đồng thời thì khi bấm vào **Asset** cũng phải hiển thị các License đã được gán.

**Ý nghĩa:** Đây là yêu cầu **read-only inheritance view** — hiển thị license **TRUYỀN** (transitive) từ Asset → User, không lưu DB trực tiếp. Khi asset bị checkin (không còn gán cho user nào), license transitive cũng tự biến mất khỏi view user.

---

## 2. Schema thực tế (Evidence)

**File:** `prisma/schema.prisma`

### 2.1 `LicenseSeat` — junction table với 2 FK nullable (XOR)

```prisma
// prisma/schema.prisma:538-559
model LicenseSeat {
  id        String  @id @default(cuid())
  licenseId String
  license   License @relation(fields: [licenseId], references: [id], onDelete: Cascade)

  assignedUserId  String?
  assignedUser    User?   @relation("LicenseSeatAssignedUser", fields: [assignedUserId], references: [id], onDelete: SetNull)
  assignedAssetId String?
  assignedAsset   Asset?  @relation(fields: [assignedAssetId], references: [id], onDelete: SetNull)

  notes              String?
  unreassignableSeat Boolean   @default(false)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  deletedAt          DateTime?

  tickets Ticket[] @relation("TicketLicenseSeat")

  @@index([licenseId])
  @@index([assignedUserId])
  @@index([assignedAssetId])
}
```

### 2.2 `Asset` — có `assignedUserId` + inverse `licenseSeats`

```prisma
// prisma/schema.prisma:390-460 (relevant fields)
model Asset {
  // ...
  assignedUserId     String?
  assignedUser       User?     @relation("AssetAssignedUser", fields: [assignedUserId], references: [id], onDelete: SetNull)
  assignedAssetId    String?    // ← Asset → Asset (parent/child)
  assignedAsset      Asset?    @relation("AssetAssignedAsset", fields: [assignedAssetId], references: [id], onDelete: SetNull)
  // ...
  licenseSeats LicenseSeat[]   // ← line 451: inverse relation
  tickets      Ticket[]           @relation("TicketAsset")
  maintenances AssetMaintenance[]
}
```

### 2.3 `User` — inverse `licenseSeats` (verified qua `@relation`)

`User.licenseSeats: LicenseSeat[]` (qua `LicenseSeatAssignedUser` @relation name).

---

## 3. Luồng dữ liệu thực tế — XOR enforced ở application layer

**File:** `src/lib/commands/license.ts:32-37`

```typescript
if (!targetUserId && !targetAssetId) {
  throw new InvalidStateError('Phải chọn Nhân viên hoặc Thiết bị để cấp phát.');
}
if (targetUserId && targetAssetId) {
  throw new InvalidStateError('Chỉ được chọn 1 trong 2: Nhân viên HOẶC Thiết bị.');
}
```

→ **1 LicenseSeat = EITHER `assignedUserId` XOR `assignedAssetId`**. Không thể cả 2 cùng lúc. Đây là design theo SnipeIT gốc.

### Command context

```typescript
// src/lib/commands/license.ts:20-110
export async function checkoutLicenseSeat(
  tx: Tx,
  params: {
    seatId: string;
    targetUserId?: string;     // ← XOR
    targetAssetId?: string;    // ← XOR
    actorId: string;
    notes?: string;
  }
) {
  // ... (full invariant checks: seat trống, license chưa hết hạn/reassignable, user activated)
  
  const updated = await tx.licenseSeat.update({
    where: { id: seatId },
    data: {
      assignedUserId: targetUserId || null,
      assignedAssetId: targetAssetId || null,
    },
    // ...
  });

  await tx.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemType: 'LICENSE_SEAT',
      itemId: seatId,
      targetType: targetUserId ? 'USER' : 'ASSET',
      targetId: targetUserId || targetAssetId,
      // ...
    },
  });
}
```

### Asset commands KHÔNG touch LicenseSeat

```bash
$ grep -E "license|License" src/lib/commands/asset.ts
# → No matches
```

**Confirmed:** `checkoutAssetToUser` chỉ update `Asset.assignedUserId` — KHÔNG đụng đến `LicenseSeat`. Hai flow hoàn toàn tách rời.

---

## 4. Graph quan hệ đầy đủ (3 cases)

```
┌──────────────────────────────────────────────────────────┐
│  CASE A — License trực tiếp cho User                     │
│                                                          │
│  License ─< LicenseSeat ─> User (assignedUserId)         │
│  → User X có Office license (trực tiếp)                  │
│    (query: prisma.licenseSeat.findMany({                 │
│       where: { assignedUserId: userId } }))              │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  CASE B — License cho Asset (gián tiếp cho User) ← GAP    │
│                                                          │
│  License ─< LicenseSeat ─> Asset ─> User (assignedUserId)│
│       ↓                                                   │
│   User X dùng LAPTOP-001 có gán Office                   │
│   → Hiện KHÔNG có UI nào báo User X có Office!           │
│                                                          │
│  Query cần:                                              │
│  prisma.licenseSeat.findMany({                            │
│    where: {                                              │
│      assignedAsset: {                                    │
│        assignedUserId: userId,                           │
│      }                                                   │
│    }                                                     │
│  })                                                      │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  CASE C — License "orphaned" (asset không ai dùng)        │
│                                                          │
│  License ─< LicenseSeat ─> Asset (assignedAssetId)       │
│       (Asset.assignedUserId = null)                      │
│   → Không cấp phát cho ai, nhưng vẫn "ngốn" seat         │
└──────────────────────────────────────────────────────────┘
```

---

## 5. UI hiện tại — Audit matrix

| Page | Hiển thị licenses? | Hiển thị assets? | Evidence |
|------|-------------------|------------------|----------|
| `/licenses/[id]` | ✅ Chính nó | ✅ per-seat | `src/app/licenses/[id]/page.tsx:36-44` + `LicenseDetailClient.tsx:254-345` |
| `/licenses` | ✅ List | (chỉ seat count) | `src/app/licenses/page.tsx` |
| `/assets/[id]` | ❌ **KHÔNG** | — | `src/app/assets/[id]/AssetDetailClient.tsx` grep "license" → **0 matches** |
| `/settings/users/[id]` | ❌ **KHÔNG** | chỉ user info | grep "license\|Seat" → **0 matches** |
| `/admin/dashboard` | (chỉ alert expiry) | — | `LicenseExpiryAlert` (commit 1b3219a) |

**Verified bằng Grep:**

```bash
$ grep -n "license\|License\|Seat" src/app/assets/[id]/AssetDetailClient.tsx
# → No matches

$ grep -n "license\|License\|Seat" src/app/assets/[id]/page.tsx
# → No matches

$ grep -n "license\|License\|Seat" src/app/settings/users/[id]/page.tsx
# → No matches
```

**Kết luận audit:**
- ✅ **LicenseDetail** đầy đủ — render 5 columns (seat #, state, assignee, notes, actions) với logic highlight (AVAILABLE/ASSIGNED/EXPIRED).
- ❌ **AssetDetail** thiếu hoàn toàn tab License.
- ❌ **UserDetail** thiếu hoàn toàn tab License.

---

## 6. Vấn đề nghiệp vụ (theo yêu cầu của sếp)

### 6.1 Use case chính cần giải quyết

> **Read-only inheritance view**: Khi User A đang dùng LAPTOP-001, và LAPTOP-001 đã được gán license "Microsoft Office", thì User A view của chính họ phải thấy "Microsoft Office" — nhưng **không có FK trực tiếp** trong DB.

### 6.2 Design constraints

| Câu hỏi | Recommend |
|---------|-----------|
| **Q1:** User detail list license? | ✅ Có — chia 2 section: (a) **Direct** (qua `LicenseSeat.assignedUserId = userId`), (b) **Through assets** (qua asset đang assigned cho user) |
| **Q2:** Asset detail list license? | ✅ Có — query đơn giản `LicenseSeat.where(assignedAssetId = assetId)` |
| **Q3:** Khi user checkin asset, license transitive có tự biến mất khỏi view user? | Nếu **computed query**: TỰ ĐỘNG. Nếu **denormalized**: CẦN sync logic. |
| **Q4:** Cho phép checkout/checkin license từ asset detail? | Recommend **KHÔNG** — chỉ hiển thị + link → license detail. Tránh UX phức tạp. |
| **Q5:** Permission? | Admin/IT: full. User xem của chính mình: limited (filter `where: { assignedUserId: session.userId }`). |

---

## 7. Recommendation thiết kế (Mockup)

```
┌────────────────────────────────────────────────────────┐
│  USER DETAIL PAGE                                     │
│                                                        │
│  ┌─ Tab "Bản quyền trực tiếp" ────────────────────────┐│
│  │ (Licenses gán thẳng qua LicenseSeat.assignedUserId) ││
│  │  ┌────────────────────────────────────────┐         ││
│  │  │ Microsoft Office 365 │ Pro Plus │ Active│         ││
│  │  │ Adobe Creative Cloud │ ─          │ Active│         ││
│  │  └────────────────────────────────────────┘         ││
│  └────────────────────────────────────────────────────┘│
│                                                        │
│  ┌─ Tab "Bản quyền qua thiết bị" (READ-ONLY) ──────────┐│
│  │ ⚠️ License user được dùng GIÁN TIẾP qua thiết bị     ││
│  │  ┌────────────────────────────────────────┐          ││
│  │  │ Autodesk AutoCAD  → LAPTOP-001 (Direct)│          ││
│  │  │ Visual Studio Pro → LAPTOP-002 (Direct)│          ││
│  │  └────────────────────────────────────────┘          ││
│  │ [Tooltip: Khi checkin thiết bị, license sẽ KHÔNG    ││
│  │  tự động rời khỏi user — chỉ hiển thị trong khi     ││
│  │  user đang dùng thiết bị]                            ││
│  └────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  ASSET DETAIL PAGE                                    │
│                                                        │
│  ┌─ Tab "Bản quyền" ───────────────────────────────────┐│
│  │  ┌───────────────────────────────────────────┐      ││
│  │  │ Microsoft Office 365 │ Pro Plus │ Active  │      ││
│  │  │ Adobe Creative Cloud │ ─         │ Active │      ││
│  │  └───────────────────────────────────────────┘      ││
│  │ [Button: + Gán bản quyền] (admin only)             ││
│  │  → Modal: chọn license + chọn seat trống           ││
│  └────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
```

---

## 8. Implementation spec

**Khuyến nghị: Dùng Prisma relation query (computed) — KHÔNG cần schema thay đổi, KHÔNG sync logic.**

### 8.1 Q1 — User detail: License qua assets

**File mới:** `src/app/settings/users/[id]/licenses/page.tsx`

```typescript
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export default async function UserLicensesPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  const targetUserId = params.id
  
  // Permission: Employee chỉ xem của mình
  if (session?.user?.role === 'EMPLOYEE' && session.user.id !== targetUserId) {
    notFound()
  }

  // Query 1: Direct licenses (UserSeat.assignedUserId = userId)
  const directLicenses = await prisma.licenseSeat.findMany({
    where: {
      assignedUserId: targetUserId,
      deletedAt: null,
    },
    include: {
      license: {
        select: {
          id: true,
          name: true,
          productKey: true,
          expirationDate: true,
          manufacturer: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Query 2: Transitive licenses (LicenseSeat.assignedAsset.assignedUserId = userId)
  const transitiveLicenses = await prisma.licenseSeat.findMany({
    where: {
      assignedAsset: {
        assignedUserId: targetUserId,
        deletedAt: null,
      },
      deletedAt: null,
    },
    include: {
      license: {
        select: {
          id: true,
          name: true,
          productKey: true,
          expirationDate: true,
          manufacturer: { select: { name: true } },
        },
      },
      assignedAsset: {
        select: { id: true, assetTag: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <UserLicensesClient
      userId={targetUserId}
      directLicenses={directLicenses}
      transitiveLicenses={transitiveLicenses}
    />
  )
}
```

### 8.2 Q2 — Asset detail: License

**File sửa:** `src/app/assets/[id]/page.tsx` (Server Component)

```typescript
// Trong prisma query cho asset detail, include licenseSeats
const asset = await prisma.asset.findUnique({
  where: { id: assetId },
  include: {
    licenseSeats: {
      where: { deletedAt: null },
      include: {
        license: {
          select: {
            id: true,
            name: true,
            productKey: true,
            expirationDate: true,
            manufacturer: { select: { name: true } },
          },
        },
      },
    },
    // ... existing includes (assignedUser, model, etc.)
  },
})
```

**File sửa:** `src/app/assets/[id]/AssetDetailClient.tsx` — thêm Tab "Bản quyền":

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Tổng quan</TabsTrigger>
    <TabsTrigger value="licenses">
      Bản quyền ({asset.licenseSeats.length})
    </TabsTrigger>
    <TabsTrigger value="history">Lịch sử</TabsTrigger>
    <TabsTrigger value="maintenance">Bảo trì</TabsTrigger>
  </TabsList>

  <TabsContent value="licenses">
    {asset.licenseSeats.length === 0 ? (
      <EmptyState 
        icon={<Key />} 
        title="Chưa có bản quyền nào"
        description="Asset này chưa được gán license seat nào."
      />
    ) : (
      <LicensesTable 
        seats={asset.licenseSeats}
        showLicenseLink
        showExpirationBadge
      />
    )}
    {isAdmin && (
      <Button onClick={() => setShowAssignModal(true)}>
        + Gán bản quyền
      </Button>
    )}
  </TabsContent>
</Tabs>
```

### 8.3 Modal "Gán bản quyền" cho Asset (admin only)

**File mới:** `src/components/assets/AssignLicenseModal.tsx`

```tsx
'use client'

export function AssignLicenseModal({ 
  assetId, 
  isOpen, 
  onClose 
}: {
  assetId: string
  isOpen: boolean
  onClose: () => void
}) {
  // Step 1: Chọn license
  const [selectedLicenseId, setSelectedLicenseId] = useState<string | null>(null)
  
  // Step 2: Hiển thị seats trống của license đó
  const availableSeats = useQuery({
    enabled: !!selectedLicenseId,
    queryKey: ['license', selectedLicenseId, 'available-seats'],
    queryFn: () => fetch(`/api/licenses/${selectedLicenseId}/seats?available=true`)
  })

  // Step 3: Submit checkoutLicenseSeat(assetId, seatId)
  const handleAssign = async (seatId: string) => {
    await fetch('/api/licenses/checkout-seat', {
      method: 'POST',
      body: JSON.stringify({ seatId, targetAssetId: assetId }),
    })
    onClose()
    router.refresh()
  }

  // ... render UI
}
```

**API endpoint mới cần tạo:**

```
GET    /api/licenses/[id]/seats?available=true    (NEW)
POST   /api/licenses/checkout-seat                  (NEW — wrap checkoutLicenseSeat)
```

---

## 9. Trade-offs — 3 approaches

| Approach | Ưu | Nhược | Recommend? |
|----------|-----|-------|-----------|
| **A. Query động (computed)** | Không cần schema change. Tự động cập nhật khi asset reassign. Permission control dễ. | Mỗi page load query 2 lần. | ✅ **Recommend** |
| **B. Denormalized FK** (`User.inheritedLicenseIds String[]`) | Read nhanh hơn. | Phải maintain (cần trigger/sync khi reassign). Dễ drift. Sync logic phức tạp. | ❌ |
| **C. View/derived table** (Postgres MATVIEW) | Read cực nhanh. | Overkill cho use case. Complexity refresh. | ❌ |

**Lý do recommend A:**

1. **DB đã sẵn có quan hệ** (`Asset.licenseSeats`, `User.licenseSeats`) — chỉ cần exploit quan hệ đó.
2. **Truth source duy nhất** = `LicenseSeat` table. Không có drift risk.
3. **Effort thấp** (~2 ngày) so với denormalized (~5-7 ngày bao gồm sync logic + tests).
4. **Permission**: filter qua Prisma `where` clause, không cần RLS.
5. **Performance**: scale user có 1-50 assets × 1-10 licenses/asset = 50-500 rows — **không đáng lo**. Nếu sau này scale lớn, có thể cache ở Redis 30s.

---

## 10. Effort tổng

| Task | Effort | Ghi chú |
|------|--------|---------|
| Asset detail: hiển thị licenses (tab + table) | **XS (0.5d)** | chỉ truy vấn + 1 bảng |
| Asset detail: Modal "Gán bản quyền" | **S (1d)** | 2-step modal + 1 API endpoint mới |
| User detail: tab Licenses (direct + transitive) | **S (1d)** | 2 queries + 2 sub-table + logic badge |
| API endpoint `/api/licenses/[id]/seats` | **XS (0.5d)** | wrapper query, có sẵn pattern từ `/api/assets/[id]/seats` |
| Tests (integration) | **XS (0.5d)** | 2 file test (asset-licenses, user-licenses-transitive) |
| Permission filter (Employee chỉ xem của mình) | **XS (0.25d)** | 1 dòng `if (session.user.role === 'EMPLOYEE' && ...)` |
| Tooltip + Empty state UX polish | **XS (0.25d)** | giải thích "read-only inheritance" |
| **Tổng** | **~4 ngày** | |

So với approach B (denormalized): ~7-10 ngày (sync logic + tests + edge cases).

---

## 11. Risk + Mitigation

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Confusion**: User thấy license ở tab "qua thiết bị" → tưởng là trực tiếp | Medium | Tooltip rõ ràng: "License này gán cho thiết bị LAPTOP-001, không phải gán trực tiếp cho bạn." Badge `READ-ONLY` trên mỗi row transitive. |
| **Permission leak**: User xem license của user khác qua transitive | High | Filter `where: { assignedUserId: session.userId }` ở cả 2 queries, **TRỪ** role admin/IT_MANAGER. Test riêng cho EMPLOYEE role. |
| **Performance**: User có 50 assets × 100 licenses = 5000 rows | Low | Pagination 20 items/page + lazy load tab (Client Component, chỉ fetch khi click). Cache 30s ở Server Component nếu cần. |
| **Stale view**: User đã checkin asset nhưng vẫn thấy license ở tab "thiết bị" | Low | Query real-time, không cache (hoặc cache 5s max). Document behavior trong tooltip. |
| **Checkout race condition**: 2 admin cùng gán 1 seat cho 2 assets | Medium | Dùng `withRowLock('LicenseSeat', seatId)` đã có sẵn trong commands/license.ts. Test riêng. |
| **Soft delete**: `LicenseSeat.deletedAt` không filter | High | **MUST filter** `deletedAt: null` ở cả 2 queries. Đã note trong code spec. |

---

## 12. Acceptance criteria

```
Schema & Data
[ ] KHÔNG thay đổi prisma/schema.prisma
[ ] KHÔNG migration mới

Asset detail page (/assets/[id])
[ ] Có tab "Bản quyền" hiển thị count licenseSeats.length
[ ] Bảng render: License name, Product key (masked), Expiration, Manufacturer, Seat #, Actions
[ ] Empty state khi 0 licenses
[ ] Button "+ Gán bản quyền" (admin only)
[ ] Modal 2-step: chọn license → chọn seat trống → confirm
[ ] Sau checkout → page reload, count tăng

User detail page (/settings/users/[id])
[ ] Có tab "Bản quyền"
[ ] Section "Trực tiếp" — query directLicenses
[ ] Section "Qua thiết bị" — query transitiveLicenses, badge "READ-ONLY"
[ ] Hiển thị tên asset gán cho mỗi license transitive
[ ] Tooltip giải thích "read-only inheritance"
[ ] Empty state cho cả 2 section
[ ] Pagination nếu > 20 licenses

Permission
[ ] EMPLOYEE role: chỉ thấy license của chính mình (filter session.userId)
[ ] ADMIN/IT_MANAGER/IT_STAFF: thấy tất cả
[ ] Test riêng cho 4 role (4 integration test cases)

Performance
[ ] Query < 200ms với 50 licenses/100 assets
[ ] Pagination khi > 20 rows
[ ] Lazy load tab (Client Component)

Tests (integration)
[ ] tests/integration/asset-licenses.test.ts
    - Direct license display
    - Admin assigns new license
    - Permission check (EMPLOYEE blocked)
[ ] tests/integration/user-licenses-transitive.test.ts
    - Direct licenses section
    - Transitive licenses (via asset)
    - When asset reassigned → transitive view updates
    - When asset checked-in → transitive view hides

UX
[ ] Mobile responsive (table → cards ở mobile)
[ ] Tooltip "READ-ONLY inheritance" giải thích behavior
[ ] Visual badge khác biệt Direct vs Transitive
[ ] Loading state (skeleton khi tab load)
[ ] Error state (nếu API fail)

Edge cases
[ ] Soft-deleted license seat KHÔNG hiển thị
[ ] License expired → badge "Expired" trên row
[ ] Asset có nhiều license cùng tên → group by license, list seats
[ ] User có 0 assets → tab "Qua thiết bị" empty state
```

---

## 13. Files sẽ tạo/sửa

### Mới tạo (4 files)

```
src/app/settings/users/[id]/licenses/page.tsx                       (NEW, ~80 dòng)
src/app/settings/users/[id]/licenses/UserLicensesClient.tsx         (NEW, ~150 dòng)
src/components/assets/AssignLicenseModal.tsx                        (NEW, ~180 dòng)
src/app/api/licenses/[id]/seats/route.ts                            (NEW, ~50 dòng — list available seats)
src/app/api/licenses/checkout-seat/route.ts                         (NEW, ~60 dòng — wrapper checkoutLicenseSeat)
tests/integration/asset-licenses.test.ts                            (NEW, ~150 dòng)
tests/integration/user-licenses-transitive.test.ts                  (NEW, ~180 dòng)
```

### Sửa (2 files)

```
src/app/assets/[id]/page.tsx                                        (MODIFY, +15 dòng include licenseSeats)
src/app/assets/[id]/AssetDetailClient.tsx                           (MODIFY, +80 dòng tab + table + button)
```

**Total:** 7 new files + 2 modified = ~9 file changes, ~4 ngày.

---

## 14. Phụ thuộc (Dependencies)

| Dep | Status | Note |
|-----|--------|------|
| `prisma.licenseSeat.findMany` với nested filter | ✅ Sẵn | Prisma support `where: { assignedAsset: { assignedUserId } }` |
| `withRowLock` cho checkout | ✅ Sẵn | `src/lib/commands/license.ts` đã dùng pattern |
| Tabs component | ✅ Sẵn | `src/components/ui/tabs.tsx` đã có |
| RoleGate component | ✅ Sẵn | Đã dùng ở `LicenseDetailClient.tsx:331-342` |
| Action: `checkoutLicenseSeat` | ✅ Sẵn | `src/app/actions/license.ts` đã wrap command |

**Không có blocker.** Có thể bắt đầu code ngay.

---

## 15. So sánh với Audit Report (liên quan)

Trong `audit-report-features-missing-ui.md`, B9 (Reports page) và B16 (Forgot password) đã đụng đến các phần liên quan tới license UI. Recommendation:

- **Nếu code asset/user licenses TRƯỚC** → update B9 để add "License distribution by user" widget.
- **Nếu code B9 trước** → widget phải dùng **cùng pattern** (query transitive) để consistent.

Recommend: làm theo thứ tự này để consistent UX:

```
Sprint A9 (Maintenance) 
  → Asset/UI licenses (B-MỚI, 4 ngày) ← bài này
    → B9 Reports (extend "License distribution" widget)
      → Sprint D (UserPreference)
        → B10 Notification prefs
```

---

## 16. Kết luận & Khuyến nghị cuối

| Aspect | Verdict |
|--------|---------|
| **Schema cần thay đổi?** | ❌ KHÔNG — quan hệ đã có sẵn |
| **Migration cần?** | ❌ KHÔNG |
| **Approach recommend** | ✅ **A. Computed query** |
| **Effort** | ~4 ngày (XS+S+XS tasks) |
| **Blocker** | Không có |
| **Có thể bắt đầu ngay?** | ✅ Có |
| **Phụ thuộc với Sprint nào?** | Nên code **sau A9** (Maintenance) nhưng **trước B9** (Reports) |

### Decision points cho sếp

| Decision | Recommend |
|----------|-----------|
| Approach A vs B vs C | **A** (computed) |
| Có cho checkout license từ Asset detail? | **Có** (admin only) — UX mượt hơn |
| Permission EMPLOYEE xem của mình? | **Có** — filter session.userId |
| Tooltip giải thích read-only? | **Có** — tránh confusion |
| Có dùng pagination? | **Có** — chỉ khi > 20 rows |

---

**HẾT BÁO CÁO**

Next step: Sếp review → approve → viết implementation spec chi tiết cho AI coding, hoặc tôi có thể scaffold trực tiếp 2 file chính (User detail tab + Asset detail tab) ngay.