# Implementation Plan — Refactor & Tech Debt Paydown

> **Ngày:** 2026-07-27
> **Người lập:** Senior Full-Stack Engineer / Architect
> **Phạm vi:** Toàn bộ codebase `D:\IT-management` (Next.js App Router + Prisma + PostgreSQL)
> **Nguyên tắc:** Mỗi sprint có Definition of Done + cách verify. Không sửa code ngoài scope sprint.

## 0. Tổng quan & Thứ tự ưu tiên

| Sprint | Chủ đề | Effort | Phụ thuộc |
|--------|--------|--------|-----------|
| **S0** | Cleanup: xóa file backup/dev/log, cập nhật `.gitignore` | 0.5 ngày | — |
| **S1** | Audit Trail hoàn chỉnh cho Settings CRUD | 0.5 ngày | — |
| **S2** | RBAC migration: `requireRole` → `requirePermission` | 1 ngày | — |
| **S3** | Generic `EntityTable` + `ConfirmModal` (DRY 7 tables) | 1 ngày | — |
| **S4** | DRY: `runCommand` shared wrapper | 0.25 ngày | — |
| **S5** | Performance: `router.refresh()` thay `window.location.reload()`, dashboard query chọn hẹp | 0.5 ngày | — |
| **S6** | Type safety + cleanup nhỏ (Sidebar, SettingsBreadcrumb, validate date) | 0.5 ngày | — |
| **S7** | Domain logic audit + unit test cho 4 invariant sống còn | 1.5 ngày | S2 |
| **S8** | E2E Playwright cho asset lifecycle (optional, follow-up) | 1 ngày | S7 |

**Tổng effort ước tính:** ~6.75 ngày làm việc (5.25 nếu bỏ S8).

## 1. Phát hiện chi tiết (Findings)

### 🔴 HIGH

| # | Vấn đề | File |
|---|--------|------|
| H1 | 17 file `.backup-before-*` rác khắp repo | root + prisma + src/lib + src/app + src/components + src/types |
| H2 | `dev.db` (SQLite), `dev-server.log/err`, `curl-results.txt`, `tsconfig.tsbuildinfo` ở root — không có trong `.gitignore` | root |
| H3 | API settings (`users`, `companies`, `departments`, `locations`, `manufacturers`, `suppliers`, `categories`, `statuses`, `asset-models`) **không ghi `ActionLog`** khi POST/PUT/DELETE — vi phạm nguyên tắc audit trail | `src/app/api/settings/**/route.ts` |
| H4 | Server actions (`createAsset`, `updateAsset`, `deleteAsset`, `checkoutAssetCmd`, `checkinAssetCmd`, license tương tự) dùng `requireRole('ADMIN')` cứng — không tận dụng RBAC permission mới | `src/app/actions/asset.ts`, `src/app/actions/license.ts` |
| H5 | API settings routes có `requireAdmin()` private function — lặp ~9 file, không thống nhất với `permissionGuard` mới | `src/app/api/settings/**/route.ts` |

### 🟠 MEDIUM

| # | Vấn đề | File |
|---|--------|------|
| M1 | Tables CRUD gần như identical: `CompaniesTable`, `DepartmentsTable`, `ManufacturersTable`, `SuppliersTable`, `LocationsTable`, `CategoriesTable`, `StatusLabelTable` | `src/components/settings/*Table.tsx` |
| M2 | Modal xác nhận Delete lặp ở tất cả tables | `src/components/settings/*Table.tsx` |
| M3 | `runCommand` helper private trong `actions/asset.ts` — chưa extract shared, license.ts cũng tự viết | `src/app/actions/asset.ts`, `src/app/actions/license.ts` |
| M4 | `SettingsForm` thiếu `useMemo` cho `fields` → re-render toàn form khi 1 field đổi | `src/components/settings/SettingsForm.tsx` |
| M5 | 7 tables dùng `window.location.reload()` sau mutation → đập cache, không tận dụng RSC | `src/components/settings/*Table.tsx` |
| M6 | `src/lib/settings.ts` dùng raw SQL (`prisma.$queryRaw`, `$executeRawUnsafe`) cho `Setting` model có vẻ đang bị `@ignore` — không đồng nhất Prisma | `src/lib/settings.ts`, `prisma/schema.prisma` |

### 🟡 LOW

| # | Vấn đề | File |
|---|--------|------|
| L1 | `'use client'` không cần thiết ở `SettingsBreadcrumb.tsx` (không có hook/state) | `src/components/settings/SettingsBreadcrumb.tsx` |
| L2 | `IconKey` type thiếu nhất quán: `React.ElementType` ở Sidebar vs string literal ở `settings/page.tsx` | `src/components/Sidebar.tsx`, `src/app/settings/page.tsx` |
| L3 | `new Date(input)` không validate — input lệch có thể throw `Invalid Date` | nhiều API routes |
| L4 | `requireUser` import không dùng sau khi refactor `tickets/route.ts` | `src/app/api/tickets/route.ts` |
| L5 | Sidebar permission cache chưa có TTL client-side, fetch lại mỗi mount | `src/components/Sidebar.tsx` |

### ⚡ PERFORMANCE

| # | Vấn đề | File |
|---|--------|------|
| P1 | `window.location.reload()` x7 — full page reload, không tận dụng RSC streaming | các Tables |
| P2 | Sidebar gọi `/api/me/permissions` mỗi mount không có cache | `src/components/Sidebar.tsx` |
| P3 | Chưa kiểm chứng dashboard queries `select` — nghi ngờ N+1 hoặc over-fetch | `src/components/dashboard/*` |

### 📚 BUSINESS LOGIC (cần verify)

| # | Invariant | Cần check |
|---|-----------|-----------|
| B1 | CHỈ checkout asset có status `Deployable` | `src/lib/commands/asset.ts::checkoutAssetToUser` |
| B2 | ActionLog bất biến (no UPDATE/DELETE) | middleware + manual check |
| B3 | Checkin → `assignedUserId = null` atomic với ActionLog | `src/lib/commands/asset.ts::checkinAsset` |
| B4 | License seat ≤ seatsTotal, race-safe | `src/lib/commands/license.ts::assignSeat` |
| B5 | Ticket auto-assign: rule weight + category → team; nếu không có rule thì rơi vào đâu? | `src/lib/tickets/auto-assign.ts` |

---

## 2. Sprint-by-Sprint Plan

### S0 — Cleanup (0.5 ngày)

**Mục tiêu:** Dọn rác, không ảnh hưởng logic.

**Actions:**

```bash
# 1. Xóa 17 file .backup-before-*
rm -f prisma/schema.prisma.backup prisma/seed.ts.backup
rm -f src/app/layout.tsx.backup-before-c src/app/page.tsx.backup-before-a2
rm -f src/app/actions/asset.ts.backup-before-a2 src/app/actions/asset.ts.backup-before-b
rm -f src/app/actions/license.ts.backup-before-a2 src/app/actions/license.ts.backup-before-b
rm -f src/app/assets/page.tsx.backup-before-a2 src/app/assets/new/page.tsx.backup-before-a2
rm -f src/app/licenses/page.tsx.backup-before-a2 src/app/login/page.tsx.backup-before-a2
rm -f src/components/Header.tsx.backup-before-c
rm -f src/lib/auth.ts.backup-before-a2 src/lib/auth.ts.backup-before-c
rm -f src/types/next-auth.d.ts.backup
rm -f .env.backup-before-a1

# 2. Xóa file dev cũ ở root
rm -f dev.db dev-server.log dev-server.err curl-results.txt
# KHÔNG xóa tsconfig.tsbuildinfo (sẽ tự regen, nhưng cập nhật gitignore)
```

**File thay đổi:**
- `.gitignore` (sửa) — thêm rules: `dev.db`, `dev-server.log`, `dev-server.err`, `curl-results.txt`, `tsconfig.tsbuildinfo`, `*.backup*`, `.env.backup*`

**Verify:**
- `git status` không thấy các file rác.
- `npm run lint` pass.
- `npm run dev` vẫn chạy.

---

### S1 — Audit Trail cho Settings CRUD (0.5 ngày)

**Mục tiêu:** Mọi mutation ở `/api/settings/**` đều ghi `ActionLog`.

**File thay đổi:**
- `src/lib/audit/logAction.ts` (NEW) — wrapper `logAction({ actorId, actionType, itemType, itemId, notes })` chuẩn hóa.
- `src/app/api/settings/users/route.ts` (MODIFY) — POST/PUT/DELETE gọi `logAction`.
- `src/app/api/settings/companies/route.ts` (MODIFY) — tương tự.
- `src/app/api/settings/departments/route.ts` (MODIFY) — tương tự.
- `src/app/api/settings/locations/route.ts` (MODIFY) — tương tự.
- `src/app/api/settings/manufacturers/route.ts` (MODIFY) — tương tự.
- `src/app/api/settings/suppliers/route.ts` (MODIFY) — tương tự.
- `src/app/api/settings/categories/route.ts` (MODIFY) — tương tự.
- `src/app/api/settings/statuses/route.ts` (MODIFY) — tương tự.
- `src/app/api/settings/asset-models/route.ts` (MODIFY) — tương tự.

**ActionLog mapping:**

| Entity | actionType CREATE | actionType UPDATE | actionType DELETE |
|--------|-------------------|-------------------|-------------------|
| USER | `CREATE_USER` | `UPDATE_USER` | `DELETE_USER` |
| COMPANY | `CREATE_COMPANY` | `UPDATE_COMPANY` | `DELETE_COMPANY` |
| DEPARTMENT | `CREATE_DEPARTMENT` | `UPDATE_DEPARTMENT` | `DELETE_DEPARTMENT` |
| LOCATION | `CREATE_LOCATION` | `UPDATE_LOCATION` | `DELETE_LOCATION` |
| MANUFACTURER | `CREATE_MANUFACTURER` | `UPDATE_MANUFACTURER` | `DELETE_MANUFACTURER` |
| SUPPLIER | `CREATE_SUPPLIER` | `UPDATE_SUPPLIER` | `DELETE_SUPPLIER` |
| CATEGORY | `CREATE_CATEGORY` | `UPDATE_CATEGORY` | `DELETE_CATEGORY` |
| STATUS_LABEL | `CREATE_STATUS_LABEL` | `UPDATE_STATUS_LABEL` | `DELETE_STATUS_LABEL` |
| ASSET_MODEL | `CREATE_ASSET_MODEL` | `UPDATE_ASSET_MODEL` | `DELETE_ASSET_MODEL` |

**Verify:**
- Thử POST 1 công ty mới → check `ActionLog` có row mới với `itemType = 'COMPANY'`, `actionType = 'CREATE_COMPANY'`.
- Tương tự DELETE.
- Test E2E (Playwright) hoặc curl + check DB.

---

### S2 — RBAC Migration: `requireRole` → `requirePermission` (1 ngày)

**Mục tiêu:** Toàn bộ server actions + API settings dùng permission key mới.

**Mapping chính:**

| Action | Old | New |
|--------|-----|-----|
| Create asset | `requireRole('ADMIN')` | `requirePermission('assets.create')` |
| Update asset | `requireRole('ADMIN')` | `requirePermission('assets.update')` |
| Delete asset | `requireRole('ADMIN')` | `requirePermission('assets.delete')` |
| Checkout asset | `requireRole('ADMIN')` (currently) | `requirePermission('assets.checkout')` |
| Checkin asset | `requireRole('ADMIN')` (currently) | `requirePermission('assets.checkin')` |
| Bulk asset op | `requireRole('ADMIN')` | tương ứng từng action |
| Create/update license | `requireRole('ADMIN')` | `requirePermission('licenses.create' / 'licenses.update')` |
| Delete license | `requireRole('ADMIN')` | `requirePermission('licenses.delete')` |
| Assign seat | `requireRole('ADMIN')` | `requirePermission('licenses.assign')` |
| Settings POST/PUT/DELETE | `requireAdmin()` private | `requirePermission('settings.update')` |
| Users POST/PUT/DELETE | `requireRole('ADMIN')` | `requirePermission('users.create' / 'users.update' / 'users.delete')` |

**File thay đổi:**
- `src/lib/permissions/http-guard.ts` (MODIFY) — bổ sung `permissionGuardOptional(key)` để 1 endpoint có nhiều method với permission khác nhau.
- `src/app/actions/asset.ts` (MODIFY) — áp `requirePermission` cho từng action.
- `src/app/actions/license.ts` (MODIFY) — tương tự.
- `src/app/actions/bulk-asset.ts` (MODIFY) — tương tự.
- `src/app/actions/settings.ts` (MODIFY) — tương tự.
- `src/app/api/settings/**/route.ts` (MODIFY) — thay `requireAdmin()` bằng `permissionGuard`.
- `src/app/api/permissions/roles/[id]/route.ts` (đã OK).
- `src/app/api/permissions/users/[id]/route.ts` (đã OK).

**Verify:**
- Test với admin user (đã có trong seed) — tất cả action pass.
- Test với IT_STAFF user — checkout asset OK, nhưng delete asset → 403.
- Test với EMPLOYEE — POST /api/settings/users → 403.

---

### S3 — Generic `EntityTable` + `ConfirmModal` (1 ngày)

**Mục tiêu:** 7 tables CRUD gom vào 1 component.

**File thay đổi:**
- `src/components/settings/EntityTable.tsx` (NEW) — generic `EntityTable<T>` nhận:
  - `endpoint: string`
  - `columns: ColumnDef<T>[]`
  - `formFields?: FieldDef[]` (cho modal tạo/sửa)
  - `confirmTitle?: string`
  - `emptyMessage?: string`
- `src/components/ui/ConfirmModal.tsx` (NEW) — modal xác nhận chung (header, body, confirm/cancel).
- `src/components/settings/CompaniesTable.tsx` (REWRITE) — dùng `EntityTable`.
- `src/components/settings/DepartmentsTable.tsx` (REWRITE) — dùng `EntityTable` (giữ riêng form vì có manager + company picker).
- `src/components/settings/ManufacturersTable.tsx` (REWRITE).
- `src/components/settings/SuppliersTable.tsx` (REWRITE).
- `src/components/settings/LocationsTable.tsx` (REWRITE).
- `src/components/settings/CategoriesTable.tsx` (REWRITE).
- `src/components/settings/StatusLabelTable.tsx` (REWRITE).
- `src/components/settings/AssetModelsTable.tsx` (REWRITE — phức tạp hơn, giữ riêng nếu cần).

**Verify:**
- Tất cả 7 trang settings vẫn hoạt động như cũ.
- Bundle size giảm (ước tính ~30% từ các file lặp).

---

### S4 — DRY: `runCommand` shared (0.25 ngày)

**Mục tiêu:** Helper wrapper dùng chung.

**File thay đổi:**
- `src/lib/commands/runCommand.ts` (NEW) — extract từ `actions/asset.ts`.
- `src/app/actions/asset.ts` (MODIFY) — import shared.
- `src/app/actions/license.ts` (MODIFY) — thay local helper.
- `src/app/actions/bulk-asset.ts` (MODIFY) — thay local helper.

**Verify:** Mọi server action vẫn trả `CommandResult<T>` đúng format.

---

### S5 — Performance (0.5 ngày)

**File thay đổi:**
- `src/components/settings/EntityTable.tsx` (MODIFY) — sau mutation gọi `router.refresh()` thay vì `window.location.reload()`.
- `src/components/Sidebar.tsx` (MODIFY) — cache permission set trong `sessionStorage` với TTL 5 phút, đồng thời re-fetch khi `pathname` đổi (chỉ khi cần).
- `src/components/NotificationBell.tsx` (REVIEW) — giữ polling 30s, OK.

**Verify:**
- Mở `/settings/users`, tạo user mới → list cập nhật không full reload (check DevTools "Page reload" event).
- Refresh permission set qua nhiều mount không gọi API nhiều lần.

---

### S6 — Type safety + cleanup (0.5 ngày)

**File thay đổi:**
- `src/components/settings/SettingsBreadcrumb.tsx` (MODIFY) — bỏ `'use client'`.
- `src/components/Sidebar.tsx` (MODIFY) — strict typing với `PermissionKey` từ `catalog.ts`.
- `src/app/api/tickets/route.ts` (MODIFY) — bỏ `requireUser` import nếu không dùng.
- `src/app/api/**/route.ts` — sweep các chỗ `new Date(input)` không validate; thêm helper `parseDateSafe(input): Date | null`.

**Verify:**
- `npx tsc --noEmit` không lỗi.
- `npm run lint` pass.

---

### S7 — Domain logic audit + unit test (1.5 ngày)

**Mục tiêu:** Verify 5 invariant sống còn + viết test.

**File thay đổi:**

1. `src/lib/commands/__tests__/asset.test.ts` (NEW) — Jest:
   - ✅ B1: Checkout asset `Broken` → throw `InvalidStateError`.
   - ✅ B1: Checkout asset `Archived` → throw.
   - ✅ B3: Checkin → set `assignedUserId = null` + ghi ActionLog cùng transaction.
   - ✅ B2: Verify không có cách nào UPDATE/DELETE ActionLog (test trực tiếp qua Prisma).

2. `src/lib/commands/__tests__/license.test.ts` (NEW):
   - ✅ B4: Assign seat cuối cùng → thành công; seat tiếp theo → throw `InvalidStateError`.
   - ✅ B4: 2 transaction song song cùng assign seat cuối → chỉ 1 thành công (race-safe qua `withRowLock`).

3. `src/lib/tickets/__tests__/auto-assign.test.ts` (NEW):
   - ✅ B5: HARDWARE + có rule → assign team Helpdesk-L1.
   - ✅ B5: HARDWARE + rule bị disable → rơi vào default (Helpdesk L1 từ seed).
   - ✅ B5: Category không có rule → null team.

4. `src/lib/commands/asset.ts` (MODIFY nếu phát hiện thiếu):
   - Thêm check `StatusLabel.deployable === true` trước khi checkout (nếu thiếu).
   - Đảm bảo `withRowLock` wrap cả `prisma.asset.update` + `prisma.actionLog.create` trong 1 transaction.

**Verify:**
- `npm test` pass 100%.
- Các edge case được cover.

---

### S8 — E2E Playwright (Optional, 1 ngày)

**File thay đổi:**
- `tests/e2e/asset-lifecycle.spec.ts` (NEW) — Playwright:
  - Login as ADMIN → create asset → checkout → checkin → verify ActionLog count = 3.
  - Login as IT_STAFF → checkout OK, delete asset → 403.

**Verify:** `npx playwright test` pass.

---

## 3. Phạm vi KHÔNG động vào (Out of Scope)

- Thay thế UI library (giữ custom Tailwind).
- Migration lên Next.js 16 (hiện đang 14 theo code; kiểm tra version thực tế).
- Thêm 2FA, LDAP, SAML (Phase 4+).
- Thay đổi schema Prisma trừ khi B1/B4 audit phát hiện.
- Tối ưu bundle Next.js (production build), phân tích bundle size.

---

## 4. Definition of Done (cuối refactor)

- ✅ Sprint S0-S7 đã merge vào main (qua từng PR nhỏ).
- ✅ `npm run lint` + `npx tsc --noEmit` không lỗi.
- ✅ `npm test` pass ≥ 90% (S7 unit test).
- ✅ Manual smoke: tạo asset → checkout → checkin → verify ActionLog + permission enforcement.
- ✅ Sidebar permission-aware: IT_STAFF chỉ thấy Helpdesk + Assets (không thấy Users/Settings).
- ✅ File count giảm ~30% nhờ `EntityTable` generic (ước tính: 7 tables × ~200 LOC → 1 × ~300 LOC + config 7 × ~30 LOC).
- ✅ Repo clean: không còn `.backup-*`, `dev.db`, log files.

---

## 5. Thứ tự thực thi (Sequencing)

```
S0 (cleanup)
   ↓
S1 (audit trail) ── parallel ── S2 (RBAC migration)
   ↓                            ↓
S4 (runCommand DRY) ──────→ S3 (EntityTable generic)
                                  ↓
                              S5 (perf)
                                  ↓
                              S6 (type safety)
                                  ↓
                              S7 (domain audit + tests)
                                  ↓
                              S8 (E2E optional)
```

S1 và S2 có thể làm song song (độc lập). S3 phụ thuộc S4 xong (để không phải sửa 2 lần). S7 phải sau S2 vì cần RBAC mới để test permission denial.

---

## 6. Câu hỏi cần xác nhận trước khi bắt đầu

1. **Backup files an toàn để xóa?** Bạn đã xác nhận "yes safe" ✓
2. **Có muốn giữ lại `dev.db`** (chỉ 60 KB nhưng là SQLite lỗi thời — DB thật là Postgres ở Neon)?
3. **`curl-results.txt` 197 KB** — đây là output của test API call nào đó (có thể xóa, nhưng nếu là tài liệu debug thì cần archive trước).
4. **Sprint 8 (E2E Playwright) có cần làm không?** Hay dừng ở S7 unit test là đủ cho MVP?
5. **`src/lib/settings.ts` dùng raw SQL** — kiểm tra schema có thật sự `@ignore` model `setting` không? Nếu không thì refactor sang Prisma thuần.

Sau khi bạn duyệt plan + trả lời các câu hỏi, mình sẽ bắt đầu S0 → S7 theo thứ tự, mỗi sprint có 1 commit/PR riêng + test verification.