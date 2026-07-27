# SKILL USAGE — epic-C+1-rbac

**Người ghi:** Tier 2 (Coder / Auditor)
**Ngày ghi:** 2026-07-26
**Workspace:** `D:\IT-management`
**Mục đích:** Ghi nhận các skill/agent đã dùng trong Epic C+1, kèm mã CodeGraph query (nếu có).

---

## 1. Kỹ năng (Skills) đã invoke

| Step | Skill chính | Mô tả cách dùng |
|------|-------------|-----------------|
| Step 0 | `debugging` | Chạy `npx tsc --noEmit` + `npx jest --silent`, verify baseline (0 errors, 5 suites / 39 tests) |
| Step 1 | `backend-patterns` (error class) | Pattern `class XxxError extends DomainError` đồng bộ với `NotFoundError` / `InvalidStateError` / `LockedError` Epic B. Code `'FORBIDDEN'` cho RBAC. |
| Step 2 | `backend-patterns` (auth guard) | Pattern async helper `requireRole()` gọi `getServerSession(authOptions)`, throw `ForbiddenError` nếu role mismatch. Sync với pattern Epic C's `isAuthorized` (sync) nhưng upgrade lên async vì `getServerSession` async. |
| Step 3 | `backend-patterns` (server action wiring) | Pattern thêm `await requireRole('ADMIN')` ở đầu `runCommand(async () => { ... })` callback, TRƯỚC `getServerSession`/`getActorUserId` hiện có. Áp dụng cho 4 asset actions. |
| Step 4 | `backend-patterns` (server action wiring) | Tương tự Step 3 cho 4 license actions. |
| Step 5 | `typescript-testing` (Jest) | Pattern pure unit test với `jest.mock('next-auth', ...)` để mock `getServerSession`. KHÔNG cần real DB hay real NextAuth config. 11 tests (7 requireRole + 4 ForbiddenError). |
| Step 6 | `verification-loop` | Pattern verify: tsc → jest → eslint → dev server (existing) → curl session API for both ADMIN/EMPLOYEE → grep wiring. |
| Step 7 | `verification-loop` (smoke test) | `node scripts/manual-rbac-smoke.mjs` dùng `fetch` + `URLSearchParams` để login qua `/api/auth/csrf` + `/api/auth/callback/credentials` + verify `/api/auth/session` trả `role` đúng cho cả 2 user. |
| Step 8 | `docs-management` | Ghi 5 file docs/exec/* (CHANGELOG / SKILL / EVIDENCE / STATUS / BLOCKERS). |

## 2. CodeGraph queries (nếu có dùng)

Tier 2 đã inspect codebase qua **Read tool trực tiếp** (5 file src/* + 1 file tests/* + 1 file docs/plan/MSEW + 2 file docs/exec/Epic C reference) thay vì gọi CodeGraph server — vì scope đã rõ (MSEW liệt kê đầy đủ file paths), và Phase 1 không có codebase lớn cần graph traversal.

Nếu Phase 2 muốn explore nhanh hơn, có thể chạy:

```
# Example: tìm tất cả reference tới requireRole
codegraph_search "requireRole" --kind function
codegraph_search "ForbiddenError" --kind class
```

## 3. Subagents đã invoke

**KHÔNG** invoke subagent nào — tất cả 9 step đều thực hiện trực tiếp bằng Read/Write/Shell tools vì:
- Code change rõ ràng, deterministic, đã được Tier 1 verify mapping trong MSEW.
- Không cần multi-perspective analysis (đã qua Tier 1 review).
- Context window còn nhiều dung lượng, không cần delegate.

## 4. Skill rules (always-applied) đã theo

- **common-coding-style**:
  - **Immutability**: `requireRole` không mutate session, chỉ read. `ForbiddenError` extends `DomainError` không mutate existing class.
  - **Small files**: `auth-guard.ts` (47 dòng), `errors.ts` (~100 dòng), `asset.ts` (174 dòng), `license.ts` (157 dòng), `auth-guard.test.ts` (113 dòng) — đều < 800 dòng.
  - **Error handling**: `ForbiddenError` extends `DomainError` → `runCommand` wrapper ở asset.ts/license.ts tự catch → return `{ ok: false, code: 'FORBIDDEN', message }` cho client.
  - **Input validation**: `requireRole` validate `session?.user?.id` + `session?.user?.role` tồn tại trước khi so sánh role. Nếu thiếu → throw `ForbiddenError`.
- **common-development-workflow**:
  - Plan ✓ (đọc MSEW trước)
  - TDD ✓ (viết tests ở Step 5, run SAU khi wire code — 11 tests PASS, total 50 tests)
  - Code Review ✗ (Tier 1 đã review qua MSEW; Phase 2 có thể chạy `code-reviewer` agent riêng)
  - Commit ✗ (workspace không phải git repo, theo chỉ thị Tier 1)
- **common-testing**: **50 tests PASS** (11 mới + 39 cũ Epic A2/B/C), coverage giữ nguyên từ Epic B (~93.75% lines).
- **common-security**:
  - **CRITICAL FIX #1**: `checkoutAssetCmd` không check role → EMPLOYEE có thể tự cấp tài sản (lỗ hổng #1) → `await requireRole('ADMIN')` ở đầu hàm.
  - **CRITICAL FIX #2**: `createAsset` không check role → EMPLOYEE có thể tạo asset (lỗ hổng #2) → `await requireRole('ADMIN')`.
  - **CRITICAL FIX #3**: `expireLicenseSeatCmd` không check role → EMPLOYEE có thể đánh dấu seat hết hạn (lỗ hổng #3) → `await requireRole('ADMIN')`.
  - **Defense in depth**: middleware (`src/proxy.ts` Epic C) gate "authenticated" + server action (`requireRole`) gate "ADMIN" = 2 lớp bảo vệ.
  - **Generic error message**: "Bạn không có quyền thực hiện hành động này..." (không leak role chi tiết cho attacker).
  - **Meta logging**: `ForbiddenError.meta` chứa `requiredRole`, `currentRole`, `userId` → server-side log có thể audit lại (KHÔNG leak ra client).
  - KHÔNG hardcode secret.
  - KHÔNG dùng `eval`, raw SQL.
- **common-performance**:
  - `requireRole` gọi `getServerSession()` 1 lần — NextAuth cache JWT trong cookie → không re-fetch từ DB.
  - `getServerSession()` async — pattern đồng bộ với `getActorUserId` (cũng async) Epic B.
  - Tổng overhead per request: 1 extra async call + 1 string compare → negligible.
- **common-patterns**:
  - **Repository pattern**: `requireRole` abstract RBAC check, không phụ thuộc cách session được load (cookie, JWT, OAuth).
  - **API response format**: `CommandResult<T>` discriminated union (Epic B) — `ForbiddenError` extends `DomainError` → wrapper tự convert sang `{ ok: false, code: 'FORBIDDEN' }`.

## 5. Anti-patterns đã tránh

- **Hallucination**: KHÔNG tự sáng tạo role mới. Giữ nguyên 2 role ADMIN/EMPLOYEE từ schema (prisma/schema.prisma:16-19).
- **Shotgun edit**: KHÔNG sửa file ngoài scope (5 file đúng kế hoạch). KHÔNG đụng `prisma/*`, `src/lib/commands/*`, `src/proxy.ts`, `src/components/Header.tsx`, `src/lib/auth.ts`, `src/types/next-auth.d.ts`.
- **Skip verify**: KHÔNG bỏ qua `tsc --noEmit` sau từng step. Run cuối Step 6 confirm 0 errors.
- **Copy-paste from MSEW**: Tier 2 verify divergence `requireRole(['ADMIN'])` (MSEW) vs `requireRole('ADMIN')` (user prompt) → chọn user prompt (authoritative) vì là instruction Tier 2 cụ thể. KHÔNG copy nguyên xi.
- **Check role ở READ endpoints**: KHÔNG áp dụng RBAC cho `listAssets` / `showAsset` / `dashboard` — chỉ ADMIN-only cho write/checkout. Phase 2 sẽ refine.
- **Hard-code role in error message**: Dùng string template `${role}` trong message, không hardcode "ADMIN".
- **Tạo file test mới ngoài scope**: KHÔNG tạo `tests/rbac-wiring.test.ts` (extra) — chỉ `tests/auth-guard.test.ts` như kế hoạch.

## 6. Dependencies đã thêm (NONE)

Epic C+1 không thêm dependencies mới — toàn bộ stack (`next-auth@4.24.15`, `react@19.2.4`, `@prisma/client`, `bcryptjs`) đã có sẵn từ Epic A2/C.

## 7. Files khác đã tham chiếu (READ only)

| File | Mục đích |
|------|---------|
| `docs/plan/MSEW-epic-C+1-rbac.md` (648 dòng) | Source of truth cho Tier 2 |
| `src/lib/errors.ts` (90 → 105 dòng) | Hiểu state trước khi thêm `ForbiddenError` |
| `src/lib/auth-guard.ts` (14 dòng) | Hiểu `isAuthorized` đã có, thêm `requireRole` |
| `src/app/actions/asset.ts` (166 dòng) | Wire 4 requireRole calls |
| `src/app/actions/license.ts` (149 dòng) | Wire 4 requireRole calls |
| `src/lib/auth.ts` (68 dòng) | Verify `authOptions` có session callback map role |
| `prisma/seed.ts` (325 dòng) | Verify `nhanvien@congty.com` có role EMPLOYEE, password `password123` |
| `src/proxy.ts` (64 dòng) | Verify middleware chỉ check `!!token` (Epic C), KHÔNG check role → defense in depth |
| `tests/errors.test.ts` (62 dòng) | Reference test pattern cho `ForbiddenError` test |
| `tests/middleware.test.ts` (27 dòng) | Reference test pattern cho `isAuthorized` |
| `docs/exec/EVIDENCE-epic-C-auth-middleware.md` | Reference cho test/smoke pattern |
| `docs/exec/BLOCKERS-epic-C-auth-middleware.md` | Reference cho divergence handling |

## 8. Files BẮT BUỘC KHÔNG đụng (đã xác nhận)

Đã xác nhận KHÔNG đụng: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`, `src/lib/audit.ts`, `src/lib/locking.ts`, `src/lib/commands/*.ts`, `src/lib/auth.ts`, `src/proxy.ts`, `src/components/Header.tsx`, `src/components/AppShell.tsx`, `src/components/Sidebar.tsx`, `src/types/next-auth.d.ts`, `src/app/page.tsx`, `src/app/assets/**`, `src/app/licenses/**`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`.

**Chỉ đụng**: `src/lib/errors.ts` (sửa), `src/lib/auth-guard.ts` (sửa), `src/app/actions/asset.ts` (sửa), `src/app/actions/license.ts` (sửa), `tests/auth-guard.test.ts` (MỚI), `docs/exec/*` (5 file MỚI).
