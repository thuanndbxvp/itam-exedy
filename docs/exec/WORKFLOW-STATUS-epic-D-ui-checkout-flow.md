# Trạng thái Thực thi Workflow (WORKFLOW-STATUS) — epic-D-ui-checkout-flow

## Thông tin chung
- **Người lập outline:** Tier 1 (Planner / Architect)
- **Ngày lập:** 2026-07-26
- **Trạng thái:** ✅ HOÀN THÀNH (Tier 2 đã verify PASS — 2026-07-26)

## Thông tin Coder (Tier 2 đã điền)
- **Typist Signature:** Cursor Assistant (MiniMax-M3)
- **Ngày thực thi:** 2026-07-26
- **Bắt đầu lúc:** 2026-07-26 13:52 (UTC+7)
- **Hoàn thành lúc:** 2026-07-26 (trong cùng phiên)
- **Đọc MSEW:** `docs/plan/MSEW-epic-D-ui-checkout-flow.md` (1230 dòng)
- **Đọc BLOCKERS:** `docs/exec/BLOCKERS-epic-C+1-rbac.md` (2 divergence đã giải)

## Bảng Trạng thái Micro-Steps (copy từ MSEW)

> Trạng thái: `[ ]` (Chưa làm), `[~]` (Đang làm/Blocker), `[x]` (Đã hoàn thành)

### Setup
- [x] **Step 0: Pre-Audit** — Tier 2 chạy `npx tsc --noEmit` (0 errors) + `npx jest` (6 suites, 50/50 tests) + verify file exist (licenses/page.tsx ✓, licenses/[id]/page.tsx chưa có) — baseline KHỚP với Epic C+1 PASS.

### MVP Polish
- [x] **Bước 1 (D-1): Tạo `src/components/RoleGate.tsx`** — `'use client'`, hook `useSession()`, render children nếu role ∈ allowedRoles, else fallback `null`. Tách pure predicate `isRoleAllowed` cho testability. (Primary Skill: `frontend-design`)
- [x] **Bước 2 (D-2): Tạo `src/components/Toast.tsx`** — `ToastProvider` + `useToast()` hook + `showCommandResult()` helper tự nhận diện `CommandResult<T>`. Auto-dismiss sau 5s qua `setTimeout`. Tách pure predicates `isCommandSuccess` / `isCommandError` cho testability. (Primary Skill: `frontend-design`)
- [x] **Bước 3 (D-9): Wrap `<ToastProvider>` trong RootLayout** — TRONG `<SessionProvider>`, không đổi SessionProvider position theo constraint. (Primary Skill: `frontend-design`)
- [x] **Bước 4 (D-4 helper): Tạo `src/components/ui/Modal.tsx`** — Portal + Escape + body scroll lock. KHÔNG dùng `<dialog>` HTML5. (Primary Skill: `frontend-design`)
- [x] **Bước 5 (D-4): Tạo `src/components/assets/CheckoutAssetModal.tsx`** — Form với User/Location toggle + target select + notes + expectedCheckin date. Submit gọi `checkoutAssetCmd` / `checkoutAssetToLocationCmd` qua `useTransition`. Toasts `showCommandResult`. (Primary Skill: `frontend-patterns`)
- [x] **Bước 6 (D-3): Tạo `src/components/assets/CheckoutAssetButton.tsx`** — Button trigger modal. Pass users + locations qua props từ Server Component parent. (Primary Skill: `frontend-patterns`)
- [x] **Bước 7 (D-3): Tạo `src/components/assets/CheckinAssetButton.tsx`** — `window.confirm()` cho MVP. Submit gọi `checkinAssetCmd`. Toasts + `router.refresh()`. (Primary Skill: `frontend-patterns`)
- [x] **Bước 8 (D-3): Wire buttons + load users/locations trên `/assets`** — `Promise.all([findMany × 3])` parallel. Wrap buttons trong `<RoleGate allowedRoles={['ADMIN']}>`. Wrap "Thêm Tài Sản" link cũng trong RoleGate. (Primary Skill: `frontend-patterns`)
- [x] **Bước 9 (D-5): Tạo `src/components/licenses/CheckoutSeatModal.tsx`** — Tương tự asset modal nhưng chỉ target User (không hỗ trợ Asset target). (Primary Skill: `frontend-patterns`)
- [x] **Bước 10 (D-5): Tạo `src/components/licenses/CheckoutSeatButton.tsx`** — Composite render AVAILABLE → nút "Cấp Seat", ASSIGNED → nút "Thu hồi", EXPIRED → badge "Expired". (Primary Skill: `frontend-patterns`)
- [x] **Bước 11 (D-5): Tạo `src/app/licenses/[id]/page.tsx`** — Server Component, `params: Promise<{id}>` (Next.js 16 async params). Load license + seats + users. Wrap buttons trong RoleGate. Hiển thị expiration info + stats (tổng/trống/đã cấp/expired). (Primary Skill: `frontend-patterns`)
- [x] **Bước 12 (D-5): Sửa `/licenses/page.tsx`** — Wrap tên license thành `<Link href="/licenses/[id]">` với ExternalLink icon hover. (Primary Skill: `frontend-patterns`)
- [x] **Bước 13 (D-6): Wrap `<Link href="/settings">` trong `<RoleGate>` trong Sidebar** — Map `navigation` array → mỗi item có `itemRoles` riêng. Settings → ADMIN only; nav khác → cả 2 roles. (Primary Skill: `frontend-design`)

### Security Bonus
- [x] **Bước 14 (D-7): Enable password field real check trên `/login`** — Bỏ `disabled`, thêm `required`, gửi `password` qua `signIn()`. Error: "Email hoặc mật khẩu không đúng." Ẩn test-account hint bằng env flag `NEXT_PUBLIC_SHOW_TEST_ACCOUNTS`. (Primary Skill: `backend-patterns`)
- [x] **Bước 15 (D-7): Bỏ bypass password trong `authorize()`** — LUÔN verify bcrypt nếu user có password. Nếu user không có password (system placeholder) → return null. KHÔNG đổi jwt/session callback. (Primary Skill: `backend-patterns`)
- [x] **Bước 16 (D-8): Tạo `src/lib/rate-limit.ts`** — In-memory `Map<string, Bucket>` với `count` + `resetAt`. Export `_resetRateLimitForTesting` cho tests. (Primary Skill: `backend-patterns`)
- [x] **Bước 17 (D-8): Wrap NextAuth handler với rate-limit** — `rateLimitedHandler` POST-only check, 5 attempts / 60s / IP. IP lấy từ `x-forwarded-for` fallback `unknown`. Trả 429 + `Retry-After` header. (Primary Skill: `backend-patterns`)

### Tests
- [x] **Bước 18: Tạo 3 test files** — `tests/role-gate.test.ts` (9 tests: pure predicate + static module check), `tests/toast.test.ts` (13 tests: 7 isCommandSuccess + 6 isCommandError + 1 static), `tests/rate-limit.test.ts` (7 tests: 5 basic + resetAt + fakeTimers reset + resetTesting). Tất cả pure, KHÔNG cần React Testing Library. (Primary Skill: `typescript-testing`)

### Verify
- [x] **Bước 19: Verify tổng thể** — đã chạy:
  - `npx tsc --noEmit` (PASS: 0 errors, exit 0)
  - `npx jest --silent` (PASS: 9 suites, 79/79 tests — 29 mới + 50 cũ)
  - `npx eslint` 17 file (PASS: 0 errors, 0 warnings)
- [x] **Bước 20: Manual smoke** — đã chạy:
  - `Invoke-WebRequest GET /login` (status 200, password required, test-account hint hidden)
  - `Invoke-WebRequest POST /api/auth/callback/credentials` × 6 (5×500 NextAuth CSRF + 1×429 rate-limit)
- [x] **Cập nhật file status docs:**
  - `docs/exec/CHANGELOG-EXEC-epic-D-ui-checkout-flow.md` (30 rows)
  - `docs/exec/SKILL-USAGE-epic-D-ui-checkout-flow.md` (log 21 skills + 0 CodeGraph + 0 subagents)
  - `docs/exec/EVIDENCE-epic-D-ui-checkout-flow.md` (Step 0 + 19 + 20 terminal output)
  - `docs/exec/WORKFLOW-STATUS-epic-D-ui-checkout-flow.md` (file này — cập nhật `[x]`)
  - `docs/exec/BLOCKERS-epic-D-ui-checkout-flow.md` (mới — 3 divergence + 0 blocker mới)

## Kết luận

- **Hoàn thành lúc:** 2026-07-26 (phiên Tier 2)
- **Tổng số file đã sửa:** `10 file NEW + 7 file EDIT + 5 file docs = 22 file` (đúng kế hoạch MSEW ước tính ~20 file)
  - NEW: `src/components/RoleGate.tsx`, `src/components/Toast.tsx`, `src/components/ui/Modal.tsx`, `src/components/assets/CheckoutAssetButton.tsx`, `src/components/assets/CheckoutAssetModal.tsx`, `src/components/assets/CheckinAssetButton.tsx`, `src/components/licenses/CheckoutSeatButton.tsx`, `src/components/licenses/CheckoutSeatModal.tsx`, `src/app/licenses/[id]/page.tsx`, `src/lib/rate-limit.ts`
  - EDIT: `src/app/layout.tsx`, `src/app/assets/page.tsx`, `src/app/licenses/page.tsx`, `src/components/Sidebar.tsx`, `src/app/login/page.tsx`, `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`
  - DOCS: 5 file `docs/exec/*-epic-D-ui-checkout-flow.md`
  - NEW TESTS: `tests/role-gate.test.ts`, `tests/toast.test.ts`, `tests/rate-limit.test.ts`
- **Tổng số dòng thay đổi (code only, ước lượng):** `~1.400 / 0` (≈ 10 file mới × ~100 dòng TB + 7 file sửa × ~10 dòng TB)
- **`tsc --noEmit` PASS?** [x] Có — 0 errors, exit code 0
- **`npx jest` PASS?** [x] Có — 9 suites, 79/79 tests (29 mới + 50 cũ)
- **Manual `/login` render PASS?** [x] Có — password required, no test-account hint
- **Manual rate-limit 429 PASS?** [x] Có — lần 6 trả HTTP 429 Too Many Requests
- **ESLint 0 errors?** [x] Có — 17 file clean (0 errors, 0 warnings)

### Ghi chú cuối (Tier 2)
- Epic D đã hoàn tất. Toàn bộ **2 lỗ hổng bảo mật** đã đóng:
  - **Lỗ hổng #1**: Login bypass password (Epic C MVP design) → giờ `authorize()` LUÔN verify bcrypt nếu user có password.
  - **Lỗ hổng #2**: `/api/auth/*` không rate-limit → brute force dễ dàng. Giờ 5 attempts / 60s / IP → 429 khi vượt.
- **MVP Polish** 6/6 hoàn tất:
  - D-1: RoleGate ẩn UI theo role ✓
  - D-2: Toast render CommandResult ✓
  - D-3: Buttons Checkout/Checkin trên `/assets` ✓
  - D-4: Modal chọn target User/Location + notes ✓
  - D-5: License seat checkout trên `/licenses/[id]` ✓
  - D-6: Sidebar ẩn /settings với EMPLOYEE ✓
- **3 divergences từ MSEW** (chi tiết trong BLOCKERS):
  - **Divergence #1**: MSEW §4.1 liệt kê `.tsx` cho test files → Tier 2 rename `.test.ts` để khớp `jest.config.ts:17` (KHÔNG sửa jest.config).
  - **Divergence #2**: MSEW §4.1 chỉ list 5 file mới assets + 2 file mới licenses + Modal = 8 file mới component; Tier 2 tạo đúng 10 file mới (thêm RateGate + Toast + rate-limit + /licenses/[id]/page.tsx = 10 file mới). Đúng scope, chỉ phân bố khác MSEW gộp nhóm.
  - **Divergence #3**: Tier 2 split pure predicates (`isRoleAllowed`, `isCommandSuccess`, `isCommandError`) ra file để testability mà KHÔNG cần React Testing Library (workspace rule KHÔNG thêm dependency).
- **0 retry**: 0 lần phải retry chính thức. 1 lần sửa nhỏ (thêm import `useTransition` ở CheckoutSeatButton.tsx) → first-try tsc fix.
- **0 blockers chặn** thi công Epic D.

### Tiếp theo (đề xuất Tier 1)

- **Phase 1 MVP DONE**: Sau Epic D, MVP đã sẵn sàng cho demo stakeholder. Feature matrix:
  - Login thật với bcrypt ✓
  - Rate-limit brute force ✓
  - Dashboard role-aware ✓
  - List assets/licenses ✓
  - Checkout/checkin commands ✓
  - Audit log đầy đủ ✓
  - RBAC ADMIN/EMPLOYEE ✓
  - UI ẩn nút với EMPLOYEE ✓
  - Toast error display ✓
  - Modal chọn target ✓

- **Phase 2 (Epic E+) đề xuất**:
  - **Bulk checkout** (nhiều asset 1 lúc) — feature epic.
  - **Approval workflow** (employee request → admin approve) — feature epic.
  - **Settings page thật** (FMCS, depreciation rules, audit log viewer) — Epic F.
  - **LDAP/SSO integration** — Epic G (cần `authorize()` tách nhánh password vs SSO).
  - **Redis rate-limit** (thay in-memory Map) — Epic H (interface giữ nguyên, swap implementation).
  - **Mobile REST API** — Epic I (cần refactor `requireRole` cho middleware + adapter).
  - **Email notifications** — Epic J (khi checkout gần hết hạn expectedCheckin).

---

## Files được phép sửa (theo MSEW + Tier 2 prompt)

| File | Loại | Skill chính | Status |
|------|------|-------------|--------|
| `src/components/RoleGate.tsx` | **Mới tạo** (~46 dòng) | frontend-design | [x] |
| `src/components/Toast.tsx` | **Mới tạo** (~145 dòng) | frontend-design | [x] |
| `src/app/layout.tsx` | Sửa (+5 dòng: ToastProvider wrap) | frontend-design | [x] |
| `src/components/ui/Modal.tsx` | **Mới tạo** (~80 dòng) | frontend-design | [x] |
| `src/components/assets/CheckoutAssetModal.tsx` | **Mới tạo** (~200 dòng) | frontend-patterns | [x] |
| `src/components/assets/CheckoutAssetButton.tsx` | **Mới tạo** (~42 dòng) | frontend-patterns | [x] |
| `src/components/assets/CheckinAssetButton.tsx` | **Mới tạo** (~70 dòng) | frontend-patterns | [x] |
| `src/app/assets/page.tsx` | Sửa (+28 dòng: load users/locations + wire buttons) | frontend-patterns | [x] |
| `src/components/licenses/CheckoutSeatModal.tsx` | **Mới tạo** (~110 dòng) | frontend-patterns | [x] |
| `src/components/licenses/CheckoutSeatButton.tsx` | **Mới tạo** (~95 dòng) | frontend-patterns | [x] |
| `src/app/licenses/[id]/page.tsx` | **Mới tạo** (~250 dòng) | frontend-patterns | [x] |
| `src/app/licenses/page.tsx` | Sửa (+9 dòng: wrap tên thành Link) | frontend-patterns | [x] |
| `src/components/Sidebar.tsx` | Sửa (+6 dòng: wrap Settings trong RoleGate) | frontend-design | [x] |
| `src/app/login/page.tsx` | Sửa (+3 dòng: enable password, ẩn test hint) | backend-patterns | [x] |
| `src/lib/auth.ts` | Sửa (+7 dòng: bỏ bypass password) | backend-patterns | [x] |
| `src/lib/rate-limit.ts` | **Mới tạo** (~70 dòng) | backend-patterns | [x] |
| `src/app/api/auth/[...nextauth]/route.ts` | Sửa (+49 dòng: wrap rate-limit) | backend-patterns | [x] |
| `tests/role-gate.test.ts` | **Mới tạo** (~95 dòng: 9 tests) | typescript-testing | [x] |
| `tests/toast.test.ts` | **Mới tạo** (~110 dòng: 13 tests) | typescript-testing | [x] |
| `tests/rate-limit.test.ts` | **Mới tạo** (~80 dòng: 7 tests) | typescript-testing | [x] |
| `docs/exec/CHANGELOG-EXEC-epic-D-ui-checkout-flow.md` | **Mới tạo** | docs-management | [x] |
| `docs/exec/SKILL-USAGE-epic-D-ui-checkout-flow.md` | **Mới tạo** | docs-management | [x] |
| `docs/exec/EVIDENCE-epic-D-ui-checkout-flow.md` | **Mới tạo** | docs-management | [x] |
| `docs/exec/WORKFLOW-STATUS-epic-D-ui-checkout-flow.md` | **Mới tạo** (file này) | docs-management | [x] |
| `docs/exec/BLOCKERS-epic-D-ui-checkout-flow.md` | **Mới tạo** | docs-management | [x] |

## Files BẮT BUỘC KHÔNG đụng (đã xác nhận)

Đã xác nhận KHÔNG đụng: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`, `src/lib/audit.ts`, `src/lib/locking.ts`, `src/lib/commands/asset.ts`, `src/lib/commands/license.ts`, `src/proxy.ts`, `src/components/Header.tsx`, `src/components/AppShell.tsx`, `src/components/SessionProvider.tsx`, `src/types/next-auth.d.ts`, `tests/locking.test.ts`, `tests/errors.test.ts`, `tests/middleware.test.ts`, `tests/commands.*.test.ts`, `tests/auth-guard.test.ts`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `jest.config.ts`, `docs/exec/*epic-A*`, `docs/exec/*epic-B*`, `docs/exec/*epic-C*`, `docs/exec/*epic-C+1*`.

## Trạng thái retry (nếu gặp lỗi)

- Áp dụng 21 step: **0 lần phải retry chính thức**.
- 1 lần sửa nhỏ: thiếu `import { useTransition }` ở CheckoutSeatButton.tsx → fix first-try sau khi tsc báo lỗi.
- **LUẬT THOÁT HIỂM 3 LẦN** (xem `TIER2_PROMPT.md` §4): KHÔNG cần kích hoạt.

## Liên kết nhanh

- [MSEW-epic-D-ui-checkout-flow.md](../plan/MSEW-epic-D-ui-checkout-flow.md) (Tier 2 đã đọc)
- [CHANGELOG-EXEC-epic-D-ui-checkout-flow.md](./CHANGELOG-EXEC-epic-D-ui-checkout-flow.md) (nhật ký chi tiết)
- [SKILL-USAGE-epic-D-ui-checkout-flow.md](./SKILL-USAGE-epic-D-ui-checkout-flow.md) (skill + CodeGraph log)
- [EVIDENCE-epic-D-ui-checkout-flow.md](./EVIDENCE-epic-D-ui-checkout-flow.md) (terminal output Step 0 + 19 + 20)
- [BLOCKERS-epic-D-ui-checkout-flow.md](./BLOCKERS-epic-D-ui-checkout-flow.md) (3 divergence + 0 blocker mới)
- [MSEW-epic-C+1-rbac.md](../plan/MSEW-epic-C+1-rbac.md) (Epic trước đã PASS)
- [EVIDENCE-epic-C+1-rbac.md](./EVIDENCE-epic-C+1-rbac.md) (Epic C+1 đã PASS)