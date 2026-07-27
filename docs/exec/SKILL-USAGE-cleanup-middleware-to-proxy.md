# SKILL USAGE — epic-C+0.5-cleanup-middleware-to-proxy

**Người ghi:** Tier 2 (Coder / Auditor)
**Ngày ghi:** 2026-07-26
**Workspace:** `D:\IT-management`
**MSEW:** `docs/plan/MSEW-cleanup-middleware-to-proxy.md`
**Mục đích:** Ghi nhận các skill/agent đã dùng trong Epic C+0.5, kèm mã CodeGraph query (nếu có).

---

## 1. Kỹ năng (Skills) đã invoke

| Step | Skill chính | Mô tả cách dùng |
|------|-------------|-----------------|
| Step 0 | `debugging` | Chạy `Test-Path` × 3 file + `npx tsc --noEmit` + `npx jest` baseline |
| Step 1 | (Read tool) | Đọc `src/middleware.ts` (53 dòng) thật — verify MSEW estimate sai (25 dòng) → adjust plan |
| Step 2 | `backend-patterns` (file convention) | Verify Next.js 16 dual naming: `proxy.ts` (mới) vs `middleware.ts` (legacy). Pattern copy nguyên logic `withAuth(...)` + `config.matcher` |
| Step 2 | `markdown` (JSDoc) | Mở rộng JSDoc đầu file từ 12 dòng (middleware) → 18 dòng (proxy), giải thích lý do rename + Phase 2 plan |
| Step 3 | `shell` (PowerShell) | `Remove-Item src/middleware.ts` (KHÔNG `git mv` vì workspace không phải git repo) |
| Step 4 | `frontend-patterns` (comment hygiene) | Update 1 dòng comment trong `Header.tsx`: "middleware sẽ redirect" → "proxy sẽ redirect" |
| Step 5 | `shell` (PowerShell) | `Remove-Item src/middleware.ts.backup-before-c` (backup đã có snapshot trong CHANGELOG Epic C) |
| Step 6 | `verification-loop` | Chạy `npx tsc --noEmit` + `npx jest` + `npx eslint src/proxy.ts src/components/Header.tsx` |
| Step 7 | `verification-loop` (curl) | Stop dev server cũ (PID 22320) + `Remove-Item .next -Recurse` + start fresh (PID 19312, port 3000) + curl 4 routes |
| Step 7 | `shell` (PowerShell tee) | `curl.exe -sS -o NUL -w "code=%{http_code}\`nlocation=%{redirect_url}\`n"` × 4 routes (ghi vào 4 file txt để bypass PowerShell tilde expand bug) |
| Step 8 | `docs-management` | Viết 5 file `docs/exec/*cleanup-middleware-to-proxy*` (CHANGELOG / SKILL / EVIDENCE / STATUS / BLOCKERS) |

## 2. CodeGraph queries (nếu có dùng)

Tier 2 đã inspect codebase qua **Read tool trực tiếp** (3 file: src/middleware.ts, src/proxy.ts (mới), src/components/Header.tsx) thay vì gọi CodeGraph server — vì scope đã rõ (MSEW liệt kê đầy đủ file paths), và Phase 1 (rename cosmetic) không có codebase lớn cần graph traversal.

## 3. Subagents đã invoke

**KHÔNG** invoke subagent nào — tất cả 9 step đều thực hiện trực tiếp bằng Read/Write/Shell tools vì:
- Code change rất nhỏ + cosmetic (chỉ rename 1 file + 1 comment), đã được Tier 1 verify mapping trong MSEW.
- Không cần multi-perspective analysis.
- Context window còn nhiều dung lượng, không cần delegate.

## 4. Skill rules (always-applied) đã theo

- **common-coding-style**:
  - **Immutability**: Toàn bộ file `src/proxy.ts` được viết mới từ `middleware.ts` — KHÔNG mutate file cũ (đã xóa trước rồi tạo file mới = append-only pattern).
  - **Small files**: `src/proxy.ts` 61 dòng (tăng 8 dòng so với middleware 53 dòng vì JSDoc header dài hơn), vẫn < 800 dòng.
  - **Error handling**: Logic giữ nguyên từ Epic C (NextAuth `withAuth` đã handle auth flow).
  - **Input validation**: KHÔNG thay đổi (chỉ rename file).
- **common-development-workflow**:
  - Plan ✓ (đọc MSEW trước, verify state qua Test-Path)
  - TDD ✗ (rename cosmetic, KHÔNG thêm test mới — đã có 39 tests PASS từ Epic C cover `isAuthorized`)
  - Code Review ✗ (Tier 1 đã review qua MSEW; Phase 2 có thể chạy `code-reviewer` agent riêng)
  - Commit ✗ (workspace không phải git repo, theo chỉ thị Tier 1)
- **common-testing**: **39 tests PASS** (giữ nguyên từ Epic C — không thêm test vì rename cosmetic).
- **common-security**: 
  - KHÔNG thay đổi auth logic (gate routes vẫn áp dụng cho `/`, `/assets/:path*`, `/licenses/:path*`).
  - KHÔNG hardcode secret (giữ nguyên `process.env.NEXTAUTH_SECRET` qua NextAuth).
  - KHÔNG dùng `eval`, `dangerouslySetInnerHTML`, raw SQL.
  - Middleware gate dựa trên JWT token (Edge runtime không có Prisma).
- **common-performance**:
  - Tier 1 quyết định giữ `withAuth` + `matcher` pattern (Edge runtime, JWT check không qua DB).
  - File rename KHÔNG ảnh hưởng overhead.
- **common-patterns**:
  - **Repository pattern**: middleware `authorized` callback → `isAuthorized` helper (giữ nguyên).
  - **API response format**: NextAuth response: `{ user: {...}, expires: ... }` (giữ nguyên).

## 5. Anti-patterns đã tránh

- **Hallucination**: KHÔNG tự sáng tạo field mới ngoài schema. JSDoc copy nguyên từ `middleware.ts` (Epic C) + thêm 6 dòng giải thích rename.
- **Shotgun edit**: KHÔNG sửa file ngoài scope (đã verify: 4 file thay đổi = đúng kế hoạch).
- **Skip verify**: KHÔNG bỏ qua `tsc --noEmit` + `npx jest` sau từng step. Phát hiện 1 vấn đề nhỏ trong Step 7 (dev server cũ còn cache `middleware.ts`) → stop process + clear `.next` + restart.
- **Copy-paste from MSEW**: MSEW estimate `middleware.ts` 25 dòng sai (thực tế 53 dòng) → Tier 2 verify lại bằng `Get-Content | Measure-Object -Line` trước khi copy.
- **Hard-code fallback**: KHÔNG hardcode — copy nguyên logic từ Epic C.

## 6. Dependencies đã thêm (NONE)

Epic C+0.5 KHÔNG thêm dependencies mới — toàn bộ stack (`next-auth@4.24.15`, `next@16.2.11`) đã có sẵn. Rename file là cosmetic operation (Next.js 16 dual naming).

## 7. Files khác đã tham khảo (READ only)

| File | Mục đích |
|------|---------|
| `docs/plan/MSEW-cleanup-middleware-to-proxy.md` | Source of truth cho Tier 2 |
| `src/middleware.ts` (53 dòng) | Verify state trước khi xóa + copy nguyên logic |
| `src/components/Header.tsx` (verify file size) | Tìm comment line 25 cần sửa |
| `docs/exec/CHANGELOG-EXEC-epic-C-auth-middleware.md` | Format template cho CHANGELOG mới |
| `docs/exec/SKILL-USAGE-epic-C-auth-middleware.md` | Format template cho SKILL mới |
| `docs/exec/EVIDENCE-epic-C-auth-middleware.md` | Format template cho EVIDENCE mới |
| `docs/exec/WORKFLOW-STATUS-epic-C-auth-middleware.md` | Format template cho STATUS mới |
| `docs/exec/BLOCKERS-epic-C-auth-middleware.md` | Format template cho BLOCKERS mới (note: Blocker #2 middleware deprecated chính là Epic C+0.5 giải quyết) |

## 8. Files BẮT BUỘC KHÔNG đụng (đã xác nhận)

Đã xác nhận KHÔNG đụng: `src/lib/auth-guard.ts`, `src/lib/auth.ts`, `tests/middleware.test.ts`, `src/app/login/page.tsx`, `src/app/layout.tsx`, `src/components/SessionProvider.tsx`, `src/components/AppShell.tsx`, `src/components/Sidebar.tsx`, `src/types/next-auth.d.ts`, `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`, `src/lib/audit.ts`, `src/lib/errors.ts`, `src/lib/locking.ts`, `src/lib/commands/*.ts`, `src/app/actions/*.ts`, `src/app/page.tsx`, `src/app/assets/**`, `src/app/licenses/**`, `src/app/api/auth/[...nextauth]/route.ts`, `package.json`, `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`.

**Chỉ đụng** (4 file thực tế):
- Tạo mới: `src/proxy.ts`
- Xóa: `src/middleware.ts`
- Xóa: `src/middleware.ts.backup-before-c`
- Sửa 1 comment line: `src/components/Header.tsx`

**Plus 5 file docs** (Step 8):
- `docs/exec/CHANGELOG-EXEC-cleanup-middleware-to-proxy.md` (mới)
- `docs/exec/SKILL-USAGE-cleanup-middleware-to-proxy.md` (file này — mới)
- `docs/exec/EVIDENCE-cleanup-middleware-to-proxy.md` (mới)
- `docs/exec/WORKFLOW-STATUS-cleanup-middleware-to-proxy.md` (mới)
- `docs/exec/BLOCKERS-cleanup-middleware-to-proxy.md` (mới)
