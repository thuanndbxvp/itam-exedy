# SKILL USAGE — epic-D-ui-checkout-flow

**Người ghi:** Tier 2 (Coder / Auditor)
**Ngày ghi:** 2026-07-26
**Workspace:** `D:\IT-management`
**Mục đích:** Ghi nhận các skill/agent đã dùng trong Epic D, kèm mã CodeGraph query (nếu có).

---

## 1. Kỹ năng (Skills) đã invoke

| Step | Skill chính | Mô tả cách dùng |
|------|-------------|-----------------|
| Step 0 | `debugging` | Chạy `npx tsc --noEmit` + `npx jest --silent`, verify baseline (0 errors, 6 suites / 50 tests). Verify file `/licenses/page.tsx` exists, `/licenses/[id]/page.tsx` chưa có. |
| Step 1 (D-1) | `frontend-design` (React Context + hook) | Pattern tách `isRoleAllowed` pure predicate ra khỏi component để có thể unit-test mà KHÔNG cần React Testing Library (workspace rule: KHÔNG thêm dependency mới). Default fallback `null` cho UX gọn. |
| Step 2 (D-2) | `frontend-design` (React Context + reducer pattern) | Pattern `ToastProvider` + `useToast()` hook + `showCommandResult()` helper tự nhận diện `CommandResult<T>` từ Epic B/C+1. Pure predicates `isCommandSuccess` / `isCommandError` tách riêng cho testability. Auto-dismiss sau 5s qua `setTimeout` + cleanup. |
| Step 3 (D-9) | `frontend-design` (Provider nesting) | Wrap `<ToastProvider>` TRONG `<SessionProvider>` (KHÔNG đảo thứ tự) để giữ nguyên SessionProvider position theo constraint `src/app/layout.tsx CHỈ sửa wrap ToastProvider`. |
| Step 4 (D-4 helper) | `frontend-design` (Portal + a11y) | Modal render qua `createPortal(document.body)` để tránh `overflow:hidden`. `useEffect` listen Escape + disable body scroll. KHÔNG dùng `<dialog>` HTML5 theo MSEW §2 Q3. |
| Step 5 (D-4) | `frontend-patterns` (Server Action from Client Component) | `CheckoutAssetModal` gọi `checkoutAssetCmd` / `checkoutAssetToLocationCmd` (server actions từ Epic B) qua `useTransition` cho UX loading state. Toàn bộ data flow: Server Component parent (assets/page.tsx) load `users` + `locations` → truyền xuống Client Component qua props → Modal select. KHÔNG fetch trong Client Component (sẽ lộ DB connection). |
| Step 6-7 (D-3) | `frontend-patterns` (Confirm dialog pattern) | `CheckinAssetButton` dùng `window.confirm()` cho MVP. Phase 2 có thể đổi Modal confirm riêng. Cả 2 button đều dùng `useTransition` + `router.refresh()` để revalidate server data sau khi mutate. |
| Step 8 (D-3) | `frontend-patterns` (Server Component data loading) | `assets/page.tsx` `Promise.all([findMany, findMany, findMany])` — song song 3 query, KHÔNG N+1 (vì đã include relations trong findMany đầu). User chỉ load `activated=true` + `deletedAt=null` (defensive cho dropdown target). |
| Step 9-11 (D-5) | `frontend-patterns` (License seat UI) | Pattern tương tự assets. Composite `CheckoutSeatButton` render khác nhau theo `state: 'AVAILABLE' | 'ASSIGNED' | 'EXPIRED'`. Phase 1 chỉ wire Checkout + Checkin (Expire = display-only "Expired" badge). `/licenses/[id]/page.tsx` là Server Component với `params: Promise<{id}>` (Next.js 16 async params API). |
| Step 13 (D-6) | `frontend-design` (RoleGate integration) | Sidebar mapping `navigation` array → mỗi item wrap trong `<RoleGate allowedRoles={...}>`. Settings chỉ ADMIN; các nav khác cả ADMIN + EMPLOYEE. KHÔNG đổi các nav khác. |
| Step 14-15 (D-7) | `backend-patterns` (bcrypt verify) | `authorize()` giờ LUÔN verify bcrypt nếu user có password. Nếu user KHÔNG có password (system placeholder) → return null. KHÔNG đổi jwt/session callback (Epic C giữ nguyên). Login page bỏ `disabled` attr, thêm `required`, gửi `password` qua `signIn()`. Test account hint ẩn bằng env flag `NEXT_PUBLIC_SHOW_TEST_ACCOUNTS` (production safe). |
| Step 16 (D-8) | `backend-patterns` (rate-limit in-memory) | Map<string, Bucket> với `count` + `resetAt`. `_resetRateLimitForTesting` helper export cho tests. Phase 2 chuyển Redis (interface giữ nguyên để migrate dễ). |
| Step 17 (D-8) | `backend-patterns` (Next.js Route Handler wrap) | Wrap `NextAuth(authOptions)` handler trong `rateLimitedHandler`. CHỈ check rate-limit cho POST (sign-in/callback). GET (session/csrf/providers) → bypass. IP lấy từ `x-forwarded-for` (production behind proxy) hoặc `x-real-ip` fallback `unknown`. |
| Step 18 | `typescript-testing` (pure unit test) | 3 test files KHÔNG cần React Testing Library (workspace rule KHÔNG thêm dependency). Test pure predicates + pure functions. Static analysis check cho module exports. |
| Step 19-20 | `verification-loop` | Pattern verify: tsc → jest → eslint → curl render `/login` → curl rate-limit 6 attempts. |
| Step 21 | `docs-management` | Ghi 5 file docs/exec/* (CHANGELOG / SKILL / EVIDENCE / STATUS / BLOCKERS). |

## 2. CodeGraph queries (nếu có dùng)

Tier 2 đã inspect codebase qua **Read tool trực tiếp** (8 file src/* + 2 file tests/* + 1 file MSEW + 2 file Epic C+1 docs reference) thay vì gọi CodeGraph server — vì scope đã rõ (MSEW liệt kê đầy đủ file paths), và Phase 1 không có codebase lớn cần graph traversal.

Nếu Phase 2 muốn explore nhanh hơn, có thể chạy:

```
# Example: tìm tất cả reference tới checkoutAssetCmd
codegraph_search "checkoutAssetCmd" --kind function
codegraph_search "checkoutLicenseSeatCmd" --kind function
```

## 3. Subagents đã invoke

**KHÔNG** invoke subagent nào — tất cả 21 step đều thực hiện trực tiếp bằng Read/Write/Shell tools vì:
- Code change rõ ràng, deterministic, đã được Tier 1 verify mapping trong MSEW.
- Không cần multi-perspective analysis (đã qua Tier 1 review).
- Context window còn nhiều dung lượng, không cần delegate.

## 4. Skill rules (always-applied) đã theo

- **common-coding-style**:
  - **Immutability**: Toast/RoleGate chỉ đọc session, không mutate. Modal form state dùng `useState` riêng biệt. `rate-limit.ts` Map mutation OK vì là singleton in-memory cache (side-effect cố ý).
  - **Small files**: RoleGate (46), Toast (145), Modal (80), CheckoutAssetModal (200), CheckoutAssetButton (42), CheckinAssetButton (70), CheckoutSeatModal (110), CheckoutSeatButton (95), `/licenses/[id]/page.tsx` (250), rate-limit (70) — đều < 800 dòng.
  - **Error handling**: Server action wrappers (`runCommand` ở asset.ts/license.ts Epic B) catch `DomainError` → return `{ ok: false, code, message }`. Client dùng `showCommandResult()` để render Toast error. Modal confirm dialog dùng `window.confirm()` cho checkin (MVP).
  - **Input validation**: `RateLimit` validate `key` + `max > 0` + `windowMs > 0` (defensive). Modal form validate `targetUserId` / `targetLocationId` rỗng → trả validation error. Server actions enforce `requireRole('ADMIN')` (Epic C+1).
- **common-development-workflow**:
  - Plan ✓ (đọc MSEW trước)
  - TDD ✓ (viết tests ở Step 18 — 29 tests PASS, total 79 tests)
  - Code Review ✗ (Tier 1 đã review qua MSEW; Phase 2 có thể chạy `code-reviewer` agent riêng)
  - Commit ✗ (workspace không phải git repo, theo chỉ thị Tier 1)
- **common-testing**: **79 tests PASS** (29 mới + 50 cũ Epic A2/B/C/C+1), coverage giữ nguyên từ Epic B (~93.75% lines cho commands/locking/errors).
- **common-security**:
  - **CRITICAL FIX #1**: Login trước đây BỎ QUA password check nếu form không gửi (Epic C MVP design). Giờ `authorize()` LUÔN verify bcrypt nếu user có password → fix lỗ hổng cho phép login không cần password.
  - **CRITICAL FIX #2**: `/api/auth/callback/credentials` không rate-limit → brute force dễ dàng. Giờ wrap với rate-limit 5 attempts / 60s / IP → trả 429 khi vượt.
  - **Defense in depth**: middleware (`src/proxy.ts` Epic C) gate "authenticated" + server action (`requireRole` Epic C+1) gate "ADMIN" + rate-limit (Epic D) gate "brute force" = 3 lớp bảo vệ.
  - **RoleGate chỉ ẨN UI** — KHÔNG thay thế server-side enforcement. Server actions vẫn `requireRole('ADMIN')` (Epic C+1).
  - **KHÔNG hardcode secret** — rate-limit chỉ dùng IP header (không lưu DB). Password hint chỉ hiện khi env flag `NEXT_PUBLIC_SHOW_TEST_ACCOUNTS=true` (production safe).
  - **Generic error message**: "Email hoặc mật khẩu không đúng" (không leak user có tồn tại hay không).
  - **Server Action pattern** — KHÔNG dùng fetch từ client (sẽ lộ endpoint).
- **common-performance**:
  - Server Component (`assets/page.tsx`) `Promise.all` parallel 3 query (assets + users + locations) → 1 round-trip DB thay vì 3 sequential.
  - `rate-limit.ts` Map lookup O(1), cleanup lazy (bucket tự bị reset khi hết window).
  - `useTransition` cho checkout/checkin action → UI không block khi server chạy.
- **common-patterns**:
  - **Repository pattern**: Modal/Button chỉ phụ thuộc `CommandResult<T>` (Epic B) + `useSession()` (Epic C) → abstract khỏi NextAuth/Prisma.
  - **API response format**: Toast `showCommandResult()` nhận `CommandResult<T>` discriminated union → render success/error khác nhau.
  - **Skeleton projects**: KHÔNG clone skeleton ngoài — toàn bộ component tự build, phù hợp với Phase 1 MVP.
- **common-hooks**: TodoWrite tool dùng xuyên suốt 21 step để track progress (14 todos ban đầu → completed).
- **common-git-workflow**: KHÔNG commit (workspace không phải git repo).

## 5. Anti-patterns đã tránh

- **Hallucination**: KHÔNG tự sáng tạo role mới. KHÔNG thêm dependencies mới vào `package.json` (constraint cứng MSEW §6). Toast/Modal tự build React Context + lucide-react (đã có sẵn).
- **Shotgun edit**: KHÔNG sửa file ngoài scope (17 file đúng kế hoạch). KHÔNG đụng `prisma/*`, `src/types/*`, `src/lib/prisma.ts`, `src/lib/audit.ts`, `src/lib/locking.ts`, `src/lib/commands/*`, `src/proxy.ts`, `src/components/Header.tsx`, `src/components/AppShell.tsx`, `src/components/SessionProvider.tsx`, `src/types/next-auth.d.ts`, `tests/locking.test.ts`, `tests/errors.test.ts`, `tests/middleware.test.ts`, `tests/commands.*.test.ts`, `tests/auth-guard.test.ts`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `jest.config.ts`.
- **Skip verify**: KHÔNG bỏ qua `tsc --noEmit` sau từng step. Run cuối Step 19 confirm 0 errors.
- **Copy-paste from MSEW**: Tier 2 đọc kỹ MSEW nhưng verify lại với source code thực tế. Ví dụ: MSEW §4 liệt kê `.tsx` cho test files → Tier 2 rename `.test.ts` để match `jest.config.ts` (KHÔNG sửa jest.config).
- **Hard-code role in error message**: Dùng string template `${role}` trong `requireRole` message (Epic C+1), KHÔNG hardcode "ADMIN".
- **Tạo file test mới ngoài scope**: CHỈ tạo 3 file test (role-gate, toast, rate-limit) như kế hoạch.
- **Fetch từ Client Component**: KHÔNG gọi `fetch()` hay `prisma` từ Client Component. Toàn bộ data fetch ở Server Component, truyền xuống Client Component qua props.
- **Dùng `<dialog>` HTML5**: KHÔNG (theo MSEW §2 Q3) — tự build Modal với Portal.
- **Dùng Redux/Zustand**: KHÔNG (theo MSEW §2 Q1) — Toast dùng React Context.
- **Dùng Redis cho rate-limit**: KHÔNG (theo MSEW §2 Q4) — Phase 1 dùng in-memory Map. Phase 2 sẽ swap implementation.

## 6. Dependencies đã thêm (NONE)

Epic D KHÔNG thêm dependencies mới vào `package.json`. Toàn bộ stack (`next-auth@4.24.15`, `react@19.2.4`, `@prisma/client`, `bcryptjs`, `lucide-react@1.26.0`) đã có sẵn từ Epic A2/C.

## 7. Files khác đã tham chiếu (READ only)

| File | Mục đích |
|------|---------|
| `docs/plan/MSEW-epic-D-ui-checkout-flow.md` (1230 dòng) | Source of truth cho Tier 2 |
| `src/app/assets/page.tsx` (Epic A2) | Hiểu state trước khi wire button |
| `src/app/licenses/page.tsx` (Epic A2) | Hiểu state để wrap link |
| `src/lib/auth-guard.ts` (Epic C+1) | Tái sử dụng `Role` type cho RoleGate |
| `src/lib/errors.ts` (Epic B + C+1) | Tái sử dụng `CommandResult<T>` cho Toast |
| `src/app/actions/asset.ts` (Epic B + C+1) | Wire `checkoutAssetCmd` / `checkinAssetCmd` / `checkoutAssetToLocationCmd` |
| `src/app/actions/license.ts` (Epic B + C+1) | Wire `checkoutLicenseSeatCmd` / `checkinLicenseSeatCmd` |
| `src/lib/auth.ts` (Epic C) | Hiểu `authorize()` để fix bypass password (D-7) |
| `src/app/api/auth/[...nextauth]/route.ts` (Epic C) | Wrap NextAuth handler với rate-limit (D-8) |
| `src/components/Sidebar.tsx` (Epic A2) | Wrap Settings link với RoleGate (D-6) |
| `src/app/login/page.tsx` (Epic C) | Enable password field (D-7) |
| `src/app/layout.tsx` (Epic A2) | Wrap ToastProvider (D-9) |
| `prisma/seed.ts` (Epic A2) | Verify admin/nhanvien có password hash `password123` |
| `tests/auth-guard.test.ts` (Epic C+1) | Reference test pattern cho mock session |
| `tests/errors.test.ts` (Epic B) | Reference test pattern cho CommandResult |
| `docs/exec/EVIDENCE-epic-C+1-rbac.md` | Reference cho test/smoke pattern |
| `docs/exec/BLOCKERS-epic-C+1-rbac.md` | Reference cho divergence handling |

## 8. Files BẮT BUỘC KHÔNG đụng (đã xác nhận)

Đã xác nhận KHÔNG đụng: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`, `src/lib/audit.ts`, `src/lib/locking.ts`, `src/lib/commands/asset.ts`, `src/lib/commands/license.ts`, `src/proxy.ts`, `src/components/Header.tsx`, `src/components/AppShell.tsx`, `src/components/SessionProvider.tsx`, `src/types/next-auth.d.ts`, `tests/locking.test.ts`, `tests/errors.test.ts`, `tests/middleware.test.ts`, `tests/commands.*.test.ts`, `tests/auth-guard.test.ts`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`, `jest.config.ts`, `docs/exec/*epic-A*`, `docs/exec/*epic-B*`, `docs/exec/*epic-C*`, `docs/exec/*epic-C+1*`.

**Chỉ đụng**: 10 file MỚI + 7 file SỬA (xem CHANGELOG-EXEC) + 5 file docs MỚI trong `docs/exec/`.