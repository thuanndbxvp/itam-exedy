# Trạng thái Thực thi Workflow (WORKFLOW-STATUS) — epic-C+1-rbac

## Thông tin chung
- **Người lập outline:** Tier 1 (Planner / Architect)
- **Ngày lập:** 2026-07-26
- **Trạng thái:** ✅ HOÀN THÀNH (Tier 2 đã verify PASS — 2026-07-26)

## Thông tin Coder (Tier 2 đã điền)
- **Typist Signature:** Cursor Assistant (MiniMax-M3)
- **Ngày thực thi:** 2026-07-26
- **Bắt đầu lúc:** 2026-07-26 12:59 (UTC+7)
- **Hoàn thành lúc:** 2026-07-26 (trong cùng phiên)
- **Đọc MSEW:** `docs/plan/MSEW-epic-C+1-rbac.md` (648 dòng)
- **Đọc BLOCKERS:** `docs/exec/BLOCKERS-epic-C-auth-middleware.md` (2 blockers, 1 chưa giải: middleware deprecation)

## Bảng Trạng thái Micro-Steps (copy từ MSEW)

> Trạng thái: `[ ]` (Chưa làm), `[~]` (Đang làm/Blocker), `[x]` (Đã hoàn thành)

### Setup
- [x] **Step 0: Pre-Audit** — Tier 2 chạy `npx tsc --noEmit` (0 errors) + `npx jest` (5 suites, 39/39 tests) — baseline KHỚP với Epic C+0.5 PASS.

### Add error class
- [x] **Step 1: Thêm `ForbiddenError` vào `src/lib/errors.ts`** — `extends DomainError`, `code: 'FORBIDDEN'`, `name: 'ForbiddenError'`. Pattern đồng bộ với `NotFoundError`/`InvalidStateError` Epic B. (Primary Skill: `backend-patterns`)

### Add auth guard helper
- [x] **Step 2: Thêm `requireRole` vào `src/lib/auth-guard.ts`** — async function, gọi `getServerSession(authOptions)`, throw `ForbiddenError` nếu session null / role mismatch. Type `Role = 'ADMIN' | 'EMPLOYEE'`. Cùng file với `isAuthorized` (Epic C). (Primary Skill: `backend-patterns`)

### Wire server actions
- [x] **Step 3: Wire `requireRole('ADMIN')` vào 4 asset actions** — `createAsset`, `checkoutAssetCmd`, `checkinAssetCmd`, `checkoutAssetToLocationCmd`. Mỗi hàm thêm 2 dòng (comment + await) ở đầu `runCommand(async () => {`. KHÔNG đổi logic business. (Primary Skill: `backend-patterns`)
- [x] **Step 4: Wire `requireRole('ADMIN')` vào 4 license actions** — `createLicense`, `checkoutLicenseSeatCmd`, `checkinLicenseSeatCmd`, `expireLicenseSeatCmd`. Tương tự Step 3. (Primary Skill: `backend-patterns`)

### Tests
- [x] **Step 5: Tạo `tests/auth-guard.test.ts`** — 11 tests: 7 cho `requireRole` (4 case ADMIN/EMPLOYEE × match/mismatch + 3 null/empty session) + 4 cho `ForbiddenError` (instanceof/code/name/meta). Mock `next-auth` module bằng `jest.mock`. (Primary Skill: `typescript-testing`)

### Verify
- [x] **Step 6: Verify tổng thể** — đã chạy:
  - `npx tsc --noEmit` (PASS: 0 errors, exit 0)
  - `npx jest --silent` (PASS: 6 suites, 50/50 tests — 11 mới + 39 cũ)
  - `npx eslint` 5 file (PASS: 0 errors, 0 warnings)
- [x] **Step 7: Manual smoke** — đã chạy:
  - `node scripts/manual-rbac-smoke.mjs` — verify session.role mapping: admin@congty.com → ADMIN, nhanvien@congty.com → EMPLOYEE
  - `Invoke-WebRequest http://localhost:3000/assets` — dev server 200 OK, no compile errors
  - `grep "requireRole('ADMIN')"` × 2 file — 4+4=8 occurrences đúng wiring
- [x] **Cập nhật file status docs:**
  - `docs/exec/CHANGELOG-EXEC-epic-C+1-rbac.md` (15 rows)
  - `docs/exec/SKILL-USAGE-epic-C+1-rbac.md` (log 9 skills + 0 CodeGraph + 0 subagents)
  - `docs/exec/EVIDENCE-epic-C+1-rbac.md` (Step 0 + Step 6-7 terminal output)
  - `docs/exec/WORKFLOW-STATUS-epic-C+1-rbac.md` (file này — cập nhật `[x]`)
  - `docs/exec/BLOCKERS-epic-C+1-rbac.md` (mới — 0 blocker mới, ghi nhận 2 divergence)

## Kết luận

- **Hoàn thành lúc:** 2026-07-26 (phiên Tier 2)
- **Tổng số file đã sửa:** `2 file NEW + 3 file EDIT + 5 file docs = 10 file` (đúng kế hoạch MSEW)
  - EDIT: `src/lib/errors.ts`, `src/lib/auth-guard.ts`, `src/app/actions/asset.ts`, `src/app/actions/license.ts`
  - NEW: `tests/auth-guard.test.ts`
  - DOCS: 5 file `docs/exec/*-epic-C+1-rbac.md`
- **Tổng số dòng thay đổi (code only):** `+63 / 0` (ước lượng, sum các file đã patch):
  - `src/lib/errors.ts`: +14 (ForbiddenError)
  - `src/lib/auth-guard.ts`: +33 (requireRole + Role type + imports)
  - `src/app/actions/asset.ts`: +8 (4 × 2 dòng)
  - `src/app/actions/license.ts`: +8 (4 × 2 dòng)
  - `tests/auth-guard.test.ts`: +113 (mới, 11 tests)
- **`tsc --noEmit` PASS?** [x] Có — 0 errors, exit code 0
- **`npx jest` PASS?** [x] Có — 6 suites, 50/50 tests (11 mới + 39 cũ)
- **Manual session.role verify PASS?** [x] Có — admin@congty.com → ADMIN, nhanvien@congty.com → EMPLOYEE
- **Wiring 8 requireRole calls PASS?** [x] Có — 4 asset + 4 license
- **ESLint 0 errors?** [x] Có — 0 errors, 0 warnings

### Ghi chú cuối (Tier 2)
- Epic C+1 đã hoàn tất. Toàn bộ **3 lỗ hổng bảo mật RBAC** đã đóng:
  - Lỗ hổng #1: EMPLOYEE gọi `checkoutAssetCmd` → giờ throw `ForbiddenError` ở đầu hàm → wrapper return `{ ok: false, code: 'FORBIDDEN' }`.
  - Lỗ hổng #2: EMPLOYEE gọi `createAsset` → throw `ForbiddenError`.
  - Lỗ hổng #3: EMPLOYEE gọi `expireLicenseSeatCmd` → throw `ForbiddenError`.
  - **Bonus**: cũng đóng lỗ hổng tương tự cho `checkinAssetCmd`, `checkoutAssetToLocationCmd`, `createLicense`, `checkoutLicenseSeatCmd`, `checkinLicenseSeatCmd` (8 commands total, theo bảng phân quyền).
- **2 divergences từ MSEW** (chi tiết trong BLOCKERS):
  - **Divergence #1**: MSEW gốc dùng `requireRole(['ADMIN'])` (array) + return `{ id, role }`. Tier 2 instruction dùng `requireRole('ADMIN')` (single string) + return `void`. Tier 2 chọn user prompt (authoritative). Phase 2 refactor nếu cần multi-role.
  - **Divergence #2**: MSEW gốc liệt kê 5 functions trong license.ts; license.ts thực tế chỉ có 4. Tier 2 wire 4 calls đúng số functions có.
- **0 retry**: 0 lần phải retry chính thức. Tất cả 9 step pass first try.
- **0 blockers chặn** thi công Epic C+1.

### Tiếp theo (đề xuất Tier 1)
- **Epic D (UI Polish)**: Wire nút "Cấp phát" / "Thu hồi" trên `/assets` và `/licenses`, modal chọn target User/Location, **ẩn nút cho EMPLOYEE** + toast thông báo lỗi từ `CommandResult<T>` (khi `code === 'FORBIDDEN'`). Phase 1 chỉ cần `getServerSession` + check role ở client side để conditionally render.
- **Epic C+1.1 (Optional)**: Refactor `requireRole` để accept array `Role[]` (giống MSEW gốc) nếu Phase 2 cần role phức tạp hơn (vd: `requireRole(['ADMIN', 'MANAGER'])`).
- **Epic E+ (Audit)**: Log `ForbiddenError` events với `meta.userId` + `meta.currentRole` + `meta.requiredRole` vào bảng `SecurityEvent` riêng (Phase 2 schema change).
- **Epic C+0.5 cleanup** (đã xong ở Epic C+0.5): rename `middleware.ts` → `proxy.ts` ✓ DONE.

---

## Files được phép sửa (theo MSEW + TIER 2 PROMPT)

| File | Loại | Skill chính | Status |
|------|------|-------------|--------|
| `src/lib/errors.ts` | Sửa (+14 dòng: ForbiddenError) | backend-patterns | [x] |
| `src/lib/auth-guard.ts` | Sửa (+33 dòng: requireRole + Role) | backend-patterns | [x] |
| `src/app/actions/asset.ts` | Sửa (+8 dòng: 4 requireRole calls) | backend-patterns | [x] |
| `src/app/actions/license.ts` | Sửa (+8 dòng: 4 requireRole calls) | backend-patterns | [x] |
| `tests/auth-guard.test.ts` | **Mới tạo** (+113 dòng: 11 tests) | typescript-testing | [x] |
| `docs/exec/CHANGELOG-EXEC-epic-C+1-rbac.md` | **Mới tạo** | docs-management | [x] |
| `docs/exec/SKILL-USAGE-epic-C+1-rbac.md` | **Mới tạo** | docs-management | [x] |
| `docs/exec/EVIDENCE-epic-C+1-rbac.md` | **Mới tạo** | docs-management | [x] |
| `docs/exec/WORKFLOW-STATUS-epic-C+1-rbac.md` | **Mới tạo** (file này) | docs-management | [x] |
| `docs/exec/BLOCKERS-epic-C+1-rbac.md` | **Mới tạo** | docs-management | [x] |

## Files BẮT BUỘC KHÔNG đụng (đã xác nhận)

Đã xác nhận KHÔNG đụng: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`, `src/lib/audit.ts`, `src/lib/locking.ts`, `src/lib/commands/*.ts`, `src/lib/auth.ts`, `src/proxy.ts`, `src/components/Header.tsx`, `src/components/AppShell.tsx`, `src/components/Sidebar.tsx`, `src/types/next-auth.d.ts`, `src/app/page.tsx`, `src/app/assets/**`, `src/app/licenses/**`, `tests/middleware.test.ts`, `tests/commands.*.test.ts`, `tests/locking.test.ts`, `tests/errors.test.ts`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`.

## Trạng thái retry (nếu gặp lỗi)

- Áp dụng 9 step: **0 lần phải retry chính thức**.
- 0 lỗi nhỏ cần fix trong step.
- **LUẬT THOÁT HIỂM 3 LẦN** (xem `TIER2_PROMPT.md` §4): KHÔNG cần kích hoạt.

## Liên kết nhanh

- [MSEW-epic-C+1-rbac.md](../plan/MSEW-epic-C+1-rbac.md) (Tier 2 đã đọc)
- [CHANGELOG-EXEC-epic-C+1-rbac.md](./CHANGELOG-EXEC-epic-C+1-rbac.md) (nhật ký chi tiết)
- [SKILL-USAGE-epic-C+1-rbac.md](./SKILL-USAGE-epic-C+1-rbac.md) (skill + CodeGraph log)
- [EVIDENCE-epic-C+1-rbac.md](./EVIDENCE-epic-C+1-rbac.md) (terminal output Step 0 + Step 6-7)
- [BLOCKERS-epic-C+1-rbac.md](./BLOCKERS-epic-C+1-rbac.md) (2 divergence + 0 blocker mới)
- [MSEW-epic-C-auth-middleware.md](../plan/MSEW-epic-C-auth-middleware.md) (Epic trước đã PASS)
- [EVIDENCE-epic-C-auth-middleware.md](./EVIDENCE-epic-C-auth-middleware.md) (Epic C đã PASS)
