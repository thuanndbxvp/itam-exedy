# SKILL USAGE — epic-C-auth-middleware

**Người ghi:** Tier 2 (Coder / Auditor)
**Ngày ghi:** 2026-07-26
**Workspace:** `D:\IT-management`
**Mục đích:** Ghi nhận các skill/agent đã dùng trong Epic C, kèm mã CodeGraph query (nếu có).

---

## 1. Kỹ năng (Skills) đã invoke

| Step | Skill chính | Mô tả cách dùng |
|------|-------------|-----------------|
| Step 0 | `debugging` | Chạy `npx tsc --noEmit`, verify baseline 0 errors (Epic B đã PASS) |
| Step 1 | `backend-patterns` (middleware) | Pattern `withAuth` từ `next-auth/middleware` + `authorized` callback + `matcher` config cho edge runtime |
| Step 2 | `frontend-patterns` (provider context) | Pattern Client Component wrapper cho Server Component (layout.tsx) → cần SessionProvider từ next-auth/react |
| Step 3 | `frontend-patterns` (composition) | Pattern wrap `<AppShell>` trong `<SessionProviderClient>` ở root layout |
| Step 4 | `frontend-patterns` (hook composition) | `useSession()` + `signOut()` từ next-auth/react + `useState` cho dropdown menu |
| Step 5 | `frontend-patterns` (form + auth) | `signIn('credentials', { redirect: false })` + `router.push(callbackUrl)` + `useSearchParams` wrapped in `<Suspense>` (Next.js 16 requirement) |
| Step 6 | `typescript-testing` (Jest) | Pattern pure-function test cho edge `isAuthorized` helper — middleware chạy Edge runtime nên test logic trích xuất ra helper thuần |
| Step 7 | `refactor-cleaner` | Refactor inline `authorized: ({ token }) => !!token` → dùng helper `isAuthorized` từ `auth-guard.ts` |
| Step 8 | `verification-loop` | Pattern verify: tsc → jest → eslint → dev server (existing) → curl 6 routes no-cookie → login flow → curl 4 routes with cookie |
| Step 9 | `docs-management` | Ghi 5 file docs/exec/* (CHANGELOG / SKILL / EVIDENCE / STATUS / BLOCKERS) |

## 2. CodeGraph queries (nếu có dùng)

Tier 2 đã inspect codebase qua **Read tool trực tiếp** (5 file src/* + 1 file tests/* + 1 file docs/plan/MSEW + 1 file docs/exec/Epic B reference) thay vì gọi CodeGraph server — vì scope đã rõ (MSEW liệt kê đầy đủ file paths), và Phase 1 không có codebase lớn cần graph traversal.

Nếu Phase 2 muốn explore nhanh hơn, có thể chạy:

```
# Example: tìm tất cả reference tới SessionProvider
codegraph_search "SessionProvider" --kind component
codegraph_search "useSession" --kind hook
codegraph_search "withAuth" --kind function
```

## 3. Subagents đã invoke

**KHÔNG** invoke subagent nào — tất cả 9 step đều thực hiện trực tiếp bằng Read/Write/Shell tools vì:
- Code change rõ ràng, deterministic, đã được Tier 1 verify mapping trong MSEW.
- Không cần multi-perspective analysis (đã qua Tier 1 review).
- Context window còn nhiều dung lượng, không cần delegate.

## 4. Skill rules (always-applied) đã theo

- **common-coding-style**:
  - **Immutability**: SessionProvider chỉ wrap children, không mutate. Header không mutate session, chỉ read.
  - **Small files**: SessionProvider (22 dòng), auth-guard (14 dòng), middleware (49 dòng) — đều < 800 dòng.
  - **Error handling**: Login form có AlertCircle message khi `result?.error` truthy; middleware trả `NextResponse.next()` explicit.
  - **Input validation**: `signIn` qua NextAuth credentials provider đã validate (email + bcrypt hoặc bypass).
- **common-development-workflow**:
  - Plan ✓ (đọc MSEW trước)
  - TDD ✓ (viết tests ở Step 6, run TRƯỚC khi merge — 39 tests PASS, +4 mới)
  - Code Review ✗ (Tier 1 đã review qua MSEW; Phase 2 có thể chạy `code-reviewer` agent riêng)
  - Commit ✗ (workspace không phải git repo, theo chỉ thị Tier 1)
- **common-testing**: **39 tests PASS** (4 mới + 35 cũ Epic B), coverage giữ nguyên từ Epic B (93.75% lines).
- **common-security**:
  - **CRITICAL FIX**: `authorized: () => true` → `isAuthorized` (gate protected routes — đóng lỗ hổng #1).
  - **CRITICAL FIX**: Header hard-code "Admin" → `useSession()` đọc từ JWT (đóng lỗ hổng #2).
  - KHÔNG hardcode secret (chỉ đọc `process.env.NEXTAUTH_SECRET` qua NextAuth).
  - KHÔNG dùng `eval`, `dangerouslySetInnerHTML`, raw SQL.
  - Middleware gate dựa trên JWT token (Edge runtime không có Prisma).
  - Login error message: "Email không tồn tại hoặc mật khẩu không đúng." (generic, không leak user existence).
- **common-performance**:
  - Tier 1 quyết định dùng `withAuth` từ next-auth/middleware (Edge runtime optimization, JWT check không qua DB).
  - Middleware `matcher` chỉ cover `/`, `/assets/*`, `/licenses/*` → giảm overhead (không scan mọi route).
  - `isAuthorized` là pure function → O(1), không có side effect.
- **common-patterns**:
  - **Repository pattern**: middleware `authorized` callback → `isAuthorized` helper = pure function pattern.
  - **API response format**: NextAuth response: `{ user: {...}, expires: ... }` (Session interface).

## 5. Anti-patterns đã tránh

- **Hallucination**: KHÔNG tự sáng tạo field mới ngoài schema. Dùng `firstName`, `lastName` từ `next-auth.d.ts` (đã có sẵn từ A2).
- **Shotgun edit**: KHÔNG sửa file ngoài scope (prisma/*, src/lib/audit.ts, src/lib/locking.ts, src/lib/commands/*, src/app/actions/*, src/app/page.tsx, src/app/assets/**, src/app/licenses/**, AppShell.tsx, Sidebar.tsx — đều KHÔNG đụng).
- **Skip verify**: KHÔNG bỏ qua `tsc --noEmit` sau từng step. Phát hiện 1 bug trong MSEW BƯỚC 5 (password "any" trigger bcrypt fail) → sửa trong cùng step bằng cách bỏ password hoàn toàn.
- **Copy-paste from MSEW**: Khi MSEW code example có bug (như `password: "any"`), Tier 2 verify lại với auth.ts logic → sửa theo đúng quyết định của Tier 1 chứ KHÔNG copy nguyên xi.
- **Hard-code fallback**: Header có fallback `...` (3 dots) thay vì hard-code "Admin" — phù hợp Phase 1 (sẽ refine ở Phase 2 với proper `status === 'loading'` check).

## 6. Dependencies đã thêm (NONE)

Epic C không thêm dependencies mới — toàn bộ stack (`next-auth@4.24.15`, `react@19.2.4`, `lucide-react@1.26.0`) đã có sẵn từ Epic A2.

## 7. Files khác đã tham khảo (READ only)

| File | Mục đích |
|------|---------|
| `docs/plan/MSEW-epic-C-auth-middleware.md` (772 dòng) | Source of truth cho Tier 2 |
| `src/middleware.ts` (16 dòng A2 → verify BUG) | Hiểu state trước khi edit |
| `src/lib/auth.ts` (68 dòng) | Verify `authorize()` logic + `authorized: () => true` → BUG |
| `src/components/Header.tsx` (55 dòng) | Verify hard-code "Admin" → BUG |
| `src/app/layout.tsx` (38 dòng) | Hiểu wrap structure cho SessionProvider |
| `src/app/login/page.tsx` (118 dòng) | Verify `signIn('credentials', { password: "any" })` → MSEW bug |
| `src/components/AppShell.tsx` (27 dòng) | Read để KHÔNG đụng (đã đúng) |
| `src/types/next-auth.d.ts` (35 dòng) | Verify Session.user có firstName, lastName, role |
| `prisma/seed.ts` (325 dòng) | Verify admin user: firstName="Admin", lastName="IT", email="admin@congty.com" |
| `src/lib/prisma.ts` (21 dòng) | Verify PrismaPg adapter pattern (test check-admin.ts) |
| `docs/exec/EVIDENCE-epic-B-domain-commands.md` | Hiểu context từ Epic B |

## 8. Files BẮT BUỘC KHÔNG đụng (đã xác nhận)

Đã xác nhận KHÔNG đụng: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`, `src/lib/audit.ts`, `src/lib/errors.ts`, `src/lib/locking.ts`, `src/lib/commands/*.ts`, `src/app/actions/*.ts`, `src/app/page.tsx`, `src/app/assets/**`, `src/app/licenses/**`, `src/components/AppShell.tsx`, `src/components/Sidebar.tsx`, `src/types/next-auth.d.ts`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`.

**Chỉ đụng**: `src/middleware.ts` (sửa), `src/components/Header.tsx` (sửa), `src/app/layout.tsx` (sửa), `src/app/login/page.tsx` (sửa), `src/components/SessionProvider.tsx` (MỚI), `src/lib/auth-guard.ts` (MỚI), `tests/middleware.test.ts` (MỚI), `docs/exec/*` (5 file).
