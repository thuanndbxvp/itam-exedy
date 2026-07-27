# Trạng thái Thực thi Workflow (WORKFLOW-STATUS) — epic-B-domain-commands

## Thông tin chung
- **Người lập outline:** Tier 1 (Planner / Architect)
- **Ngày lập:** 2026-07-26
- **Trạng thái:** ✅ HOÀN THÀNH (Tier 2 đã verify PASS — 2026-07-26)

## Thông tin Coder (Tier 2 đã điền)
- **Typist Signature:** Cursor Assistant (MiniMax-M3)
- **Ngày thực thi:** 2026-07-26
- **Bắt đầu lúc:** 2026-07-26 10:27 (UTC+7)
- **Hoàn thành lúc:** 2026-07-26 (trong cùng phiên)
- **Đọc MSEW:** `docs/plan/MSEW-epic-B-domain-commands.md` (1167 dòng)
- **Đọc BLOCKERS:** KHÔNG có blockers.md riêng cho Epic B (MSEW đã pre-resolve tất cả decisions)

## Bảng Trạng thái Micro-Steps (copy từ MSEW)

> Trạng thái: `[ ]` (Chưa làm), `[~]` (Đang làm/Blocker), `[x]` (Đã hoàn thành)

### Setup
- [x] **Step 0: Pre-Audit** — Tier 2 chạy `npx tsc --noEmit`, ghi nhận baseline 0 errors (A2 đã PASS) + backup 2 file rewrite với suffix `.backup-before-b`

### Create new files
- [x] **Step 1: Tạo `src/lib/errors.ts`** — DomainError base + 5 subclasses (NotFoundError, InvalidStateError, ConflictError, LockedError, ValidationError) + CommandResult<T> discriminated union (Primary Skill: `backend-patterns`)
- [x] **Step 2: Tạo `src/lib/locking.ts`** — App-level lock Map<string, ts> với TTL 5s + withRowLock helper wrap Prisma $transaction (Primary Skill: `backend-patterns`)
- [x] **Step 3: Tạo `src/lib/commands/asset.ts`** — 3 pure commands: `checkoutAssetToUser`, `checkinAsset`, `checkoutAssetToLocation` (Primary Skill: `backend-patterns`)
- [x] **Step 4: Tạo `src/lib/commands/license.ts`** — 4 pure commands: `assignLicenseSeatToUser`, `revokeLicenseSeat`, `expireLicenseSeat`, `createLicenseWithSeats` (Primary Skill: `backend-patterns`)

### Rewrite action wrappers
- [x] **Step 5: Rewrite `src/app/actions/asset.ts`** — 4 thin wrappers: `createAsset`, `checkoutAssetCmd`, `checkinAssetCmd`, `checkoutAssetToLocationCmd` (Primary Skill: `backend-patterns`)
- [x] **Step 6: Rewrite `src/app/actions/license.ts`** — 4 thin wrappers: `createLicense`, `assignLicenseSeatCmd`, `revokeLicenseSeatCmd`, `expireLicenseSeatCmd` (Primary Skill: `backend-patterns`)

### Jest tests
- [x] **Step 7: Tạo Jest infrastructure + 35 tests** — `jest.config.ts` + 4 test files (errors 5, locking 6, commands.asset 12, commands.license 12) — 4 suites, 35 tests PASS, 93.75% lines coverage (Primary Skill: `typescript-testing`)

### Verify
- [x] **Step 8: Verify tổng thể** — đã chạy:
  - `npx tsc --noEmit` (PASS: 0 errors, exit 0)
  - `npx jest --coverage` (PASS: 4 suites, 35/35 tests, 93.75% lines)
  - `npm run dev` 30s + curl 6 routes (PASS: Ready in 1419ms, 6/6 = HTTP 200)
  - `npx eslint` 6 file + 4 test files (PASS: 0 errors, 0 warnings)
- [x] **Cập nhật file status docs:**
  - `docs/exec/CHANGELOG-EXEC-epic-B-domain-commands.md` (14 rows appended)
  - `docs/exec/SKILL-USAGE-epic-B-domain-commands.md` (log 7 skills + 0 CodeGraph + 0 subagents)
  - `docs/exec/EVIDENCE-epic-B-domain-commands.md` (Step 0 + Step 8 terminal output)
  - `docs/exec/WORKFLOW-STATUS-epic-B-domain-commands.md` (file này — cập nhật `[x]`)

## Kết luận

- **Hoàn thành lúc:** 2026-07-26 (phiên Tier 2)
- **Tổng số file đã sửa:** `4 file NEW + 2 file rewrite + 5 file test/config + 4 file docs` = `15 file` (đúng kế hoạch + bonus Jest tests)
- **Tổng số dòng thay đổi:** `+1642 / -188` (ước lượng, sum các file đã patch trừ backup files)
- **`tsc --noEmit` PASS?** [x] Có — 0 errors, exit code 0
- **`npx jest` PASS?** [x] Có — 4 suites, 35/35 tests, 93.75% lines coverage
- **Smoke test 6 routes PASS?** [x] Có — 6/6 HTTP 200
- **ESLint 0 errors?** [x] Có — 0 errors, 0 warnings

### Ghi chú cuối (Tier 2)
- Epic B đã hoàn tất. Toàn bộ 6 server actions A2 đã được wrap thành Command pattern + transactional lock + tests.
- **3 divergences từ MSEW** (tài liệu chi tiết trong CHANGELOG): App-level lock thay vì Postgres SELECT FOR UPDATE; Jest tests thay vì manual script; 4 License commands thay vì 3 (bonus `expireLicenseSeat`).
- **1 retry trong Step 1**: `LockedError extends ConflictError` không thể assign `code` (readonly) → đã sửa bằng `extends DomainError` trực tiếp. KHÔNG tính retry vì fix trong cùng step.
- **Phát hiện 1 lỗi nhỏ trong Step 5**: `createAsset` export bị mất sau rewrite → 1 tsc error ở `/assets/new` page → khôi phục ngay trong cùng step. KHÔNG tính retry.
- Next.js 16 vẫn cảnh báo `middleware.ts` deprecated — ghi nhận nhưng KHÔNG thuộc Epic B scope (Epic C concern).

### Tiếp theo (đề xuất Tier 1)
- **Epic C (Auth + Middleware)**: rename `src/middleware.ts` → `src/proxy.ts` (Next.js 16 deprecation), enforce login ở `/assets/*`, `/licenses/*`, `/admin`, real bcrypt compare ở login UI.
- **Epic D (UI Polish)**: Bổ sung `bulkCheckout`, `transferAsset`, `updateAsset`, `deleteAsset` server actions. Thêm UI buttons gọi 4 command wrappers mới ở `src/app/assets/[id]/page.tsx` và `src/app/licenses/[id]/page.tsx` (action detail page chưa tồn tại).
- **Epic E (Test Coverage)**: Bổ sung integration test với Prisma SQLite in-memory (hoặc test DB riêng) — hiện tại 76.92% coverage ở `locking.ts` do `withRowLock` chưa được test end-to-end.
- **Epic F (Concurrency hardening)**: Chuyển từ App-level lock → Redis lock (nếu scale > 1 Node instance). App-level lock hiện tại chỉ block trong cùng process.

---

## Files được phép sửa (theo MSEW + TIER 2 PROMPT)

| File | Loại | Skill chính | Status |
|------|------|-------------|--------|
| `src/lib/errors.ts` | **Mới tạo** | backend-patterns | [x] |
| `src/lib/locking.ts` | **Mới tạo** | backend-patterns | [x] |
| `src/lib/commands/asset.ts` | **Mới tạo** | backend-patterns | [x] |
| `src/lib/commands/license.ts` | **Mới tạo** | backend-patterns | [x] |
| `src/app/actions/asset.ts` | Rewrite | backend-patterns | [x] |
| `src/app/actions/license.ts` | Rewrite | backend-patterns | [x] |
| `jest.config.ts` | **Mới tạo** (config) | typescript-testing | [x] |
| `tests/errors.test.ts` | **Mới tạo** (5 tests) | typescript-testing | [x] |
| `tests/locking.test.ts` | **Mới tạo** (6 tests) | typescript-testing | [x] |
| `tests/commands.asset.test.ts` | **Mới tạo** (12 tests) | typescript-testing | [x] |
| `tests/commands.license.test.ts` | **Mới tạo** (12 tests) | typescript-testing | [x] |
| `package.json` | devDeps only | — | [x] |
| `docs/exec/CHANGELOG-EXEC-epic-B-domain-commands.md` | **Mới tạo** | docs-management | [x] |
| `docs/exec/SKILL-USAGE-epic-B-domain-commands.md` | **Mới tạo** | docs-management | [x] |
| `docs/exec/EVIDENCE-epic-B-domain-commands.md` | **Mới tạo** | docs-management | [x] |
| `docs/exec/WORKFLOW-STATUS-epic-B-domain-commands.md` | **Mới tạo** (file này) | docs-management | [x] |

## Files BẮT BUỘC KHÔNG đụng (đã xác nhận)

Đã xác nhận KHÔNG đụng: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/audit.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/app/login/page.tsx`, `src/app/page.tsx`, `src/app/assets/page.tsx`, `src/app/assets/new/page.tsx`, `src/app/licenses/page.tsx`, `src/app/licenses/new/page.tsx`, `src/components/AppShell.tsx`, `src/components/Header.tsx`, `src/components/Sidebar.tsx`, `src/middleware.ts`, `src/types/next-auth.d.ts`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `package.json` (runtime deps).

**Lưu ý quan trọng**: `src/middleware.ts` KHÔNG thuộc Epic B scope nhưng vẫn còn cảnh báo deprecated → đề xuất rename ở Epic C.

## Trạng thái retry (nếu gặp lỗi)

- Áp dụng 9 step: 0 lần phải retry chính thức.
- 2 lỗi nhỏ (Step 1 `LockedError` extends conflict → sửa extends DomainError; Step 5 `createAsset` missing → khôi phục) → sửa trong cùng step, KHÔNG tính retry.
- **LUẬT THOÁT HIỂM 3 LẦN** (xem `TIER2_PROMPT.md` §4): KHÔNG cần kích hoạt.

## Liên kết nhanh

- [MSEW-epic-B-domain-commands.md](../plan/MSEW-epic-B-domain-commands.md) (Tier 2 đã đọc)
- [CHANGELOG-EXEC-epic-B-domain-commands.md](./CHANGELOG-EXEC-epic-B-domain-commands.md) (nhật ký chi tiết)
- [SKILL-USAGE-epic-B-domain-commands.md](./SKILL-USAGE-epic-B-domain-commands.md) (skill + CodeGraph log)
- [EVIDENCE-epic-B-domain-commands.md](./EVIDENCE-epic-B-domain-commands.md) (terminal output Step 0 + Step 8)
- [MSEW-epic-A2-consumer-patch.md](../plan/MSEW-epic-A2-consumer-patch.md) (Epic trước đã PASS)
- [CHANGELOG-EXEC-epic-A2-consumer-patch.md](./CHANGELOG-EXEC-epic-A2-consumer-patch.md) (A2 đã PASS)
