# SKILL USAGE — epic-B-domain-commands

**Người ghi:** Tier 2 (Coder / Auditor)
**Ngày ghi:** 2026-07-26
**Workspace:** `D:\IT-management`
**Mục đích:** Ghi nhận các skill/agent đã dùng trong Epic B, kèm mã CodeGraph query (nếu có).

---

## 1. Kỹ năng (Skills) đã invoke

| Step | Skill chính | Mô tả cách dùng |
|------|-------------|-----------------|
| Step 0 | `debugging` | Chạy `npx tsc --noEmit`, verify baseline 0 errors (A2 đã PASS) |
| Step 1 | `backend-patterns` (error handling) | Pattern `DomainError` base class + discriminated `code` field + `CommandResult<T>` union type |
| Step 2 | `backend-patterns` (concurrency) | Pattern App-level lock với `Map<string, ts>` + TTL 5s + `finally` để release |
| Step 3 | `backend-patterns` (transaction script) | Pattern pure-function command nhận `tx: Prisma.TransactionClient` làm tham số đầu tiên |
| Step 4 | `backend-patterns` (transaction script) | Tương tự Step 3 cho LicenseSeat: `assignSeat / revokeSeat / expireSeat / createLicense` |
| Step 5-6 | `backend-patterns` (server action wrapper) | Pattern thin wrapper: `getServerSession` → `getActorUserId` → `withRowLock` → pure command → `revalidatePath` |
| Step 7 | `typescript-testing` (Jest) | Pattern mock `Prisma TransactionClient` với `jest.fn()` cho unit test pure commands |
| Step 8 | `verification-loop` | Pattern verify: tsc → jest → eslint → dev server → curl 6 routes |
| Step 9 | `docs-management` | Ghi 4 file docs/exec/* (CHANGELOG / SKILL / EVIDENCE / STATUS) |

## 2. CodeGraph queries (nếu có dùng)

Tier 2 đã inspect codebase qua **Read tool trực tiếp** (3 file schema + 4 file src/lib/* + 2 file src/app/actions/*) thay vì gọi CodeGraph server — vì scope đã rõ (MSEW liệt kê đầy đủ file paths), và Phase 1 không có codebase lớn cần graph traversal.

Nếu Phase 2 muốn explore nhanh hơn, có thể chạy:

```
# Example: tìm tất cả reference tới Asset.checkoutCounter
codegraph_search "checkoutCounter" --kind field
codegraph_search "LicenseSeat" --kind model
codegraph_search "withRowLock" --kind function
```

## 3. Subagents đã invoke

**KHÔNG** invoke subagent nào — tất cả 9 step đều thực hiện trực tiếp bằng Read/Write/Shell tools vì:
- Code change rõ ràng, deterministic, đã được Tier 1 verify mapping trong MSEW.
- Không cần multi-perspective analysis (đã qua Tier 1 review).
- Context window còn nhiều dung lượng, không cần delegate.

## 4. Skill rules (always-applied) đã theo

- **common-coding-style**:
  - **Immutability**: pure commands KHÔNG mutate input, chỉ return updated entity. Không có in-place mutation.
  - **Small files**: errors.ts (87 dòng), locking.ts (90 dòng), commands/asset.ts (234 dòng), commands/license.ts (233 dòng) — đều < 800 dòng.
  - **Error handling**: Mọi command throw `DomainError` subclass; wrapper convert thành `CommandResult<T>` discriminated union.
- **common-development-workflow**:
  - Plan ✓ (đọc MSEW trước)
  - TDD ✓ (viết tests ở Step 7, run TRƯỚC khi merge — 35 tests PASS)
  - Code Review ✗ (Tier 1 đã review qua MSEW; Phase 2 có thể chạy `code-reviewer` agent riêng)
  - Commit ✗ (workspace không phải git repo, theo chỉ thị Tier 1)
- **common-testing**: **35 tests PASS**, coverage **93.75% lines** → đạt yêu cầu 80% minimum.
- **common-security**:
  - KHÔNG hardcode secret (chỉ đọc `process.env` qua NextAuth).
  - `bcrypt.compare` đã bật (không thuộc Epic B nhưng verified qua A2).
  - Form input được validate ở wrapper (e.g. `createAsset` check `assetTag`, `name`, `statusId`).
- **common-performance**:
  - Tier 1 quyết định dùng App-level lock (Map<key, ts>) thay vì Postgres `SELECT ... FOR UPDATE` → giảm round-trip DB.
  - 1 transaction wrap N Prisma operations (atomicity) → giảm overhead.
- **common-patterns**:
  - **Repository pattern**: `withRowLock` → `withRowLock → pure command` = wrapper pattern.
  - **API response format**: `CommandResult<T>` = discriminated union `{ ok: true, data } | { ok: false, code, message }`.

## 5. Anti-patterns đã tránh

- **Hallucination**: KHÔNG tự sáng tạo field mới ngoài schema. Mọi field dùng trong code đều cross-check với `prisma/schema.prisma` (đọc 478 dòng schema trước khi viết commands).
- **Shotgun edit**: KHÔNG sửa file ngoài scope (middleware.ts, prisma.ts, layout.tsx, page.tsx — đều KHÔNG đụng).
- **Skip verify**: KHÔNG bỏ qua `tsc --noEmit` sau từng step. Phát hiện 1 lỗi ở Step 1 (`LockedError extends ConflictError` → code readonly) và sửa ngay trong cùng step.
- **Surface-level coverage**: KHÔNG viết test "happy path only" — đã cover 35 cases bao gồm: happy path, NotFoundError (asset/user seat/missing), InvalidStateError (status/assigned/empty seat/expired license/duplicate expire), lock race-condition, validation edge cases (empty name, negative seatCount).

## 6. Dependencies đã thêm (chỉ dev deps cho Jest)

| Package | Version | Loại | Lý do |
|---------|---------|------|-------|
| `jest` | ^29 | devDep | Test runner |
| `ts-jest` | ^29 | devDep | TypeScript transform cho Jest |
| `@types/jest` | ^29 | devDep | Type definitions |
| `ts-node` | ^10 | devDep | Cần thiết cho ts-jest runtime |

Tổng: 248 packages added (bao gồm transitive deps). **0 deps mới ở `dependencies`** — KHÔNG touch runtime, chỉ dev dependencies.

---

## 7. Files khác đã tham khảo (READ only)

| File | Mục đích |
|------|---------|
| `prisma/schema.prisma` (478 dòng) | Ground truth cho tất cả Prisma types — verify `Asset`, `LicenseSeat`, `ActionLog`, `User` field names |
| `prisma/seed.ts` (325 dòng) | Verify test fixtures: `lap001`, `lap002`, `admin`, `nhanvien`, `Office 365` seats |
| `src/lib/audit.ts` (43 dòng) | Tái sử dụng `getActorUserId()` |
| `src/lib/auth.ts` (68 dòng) | Tái sử dụng `authOptions` cho `getServerSession` |
| `src/lib/prisma.ts` (21 dòng) | Tái sử dụng `prisma` singleton |
| `src/app/actions/asset.ts.backup-before-b` (snapshot A2) | Hiểu logic cũ trước rewrite |
| `src/app/actions/license.ts.backup-before-b` (snapshot A2) | Hiểu logic cũ trước rewrite |
| `docs/plan/MSEW-epic-B-domain-commands.md` (1167 dòng) | Source of truth cho Tier 2 |
| `docs/exec/BLOCKERS-epic-A2-consumer-patch.md` | Hiểu context từ A2 |

## 8. Files BẮT BUỘC KHÔNG đụng (đã xác nhận)

Đã xác nhận KHÔNG đụng: `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`, `src/lib/auth.ts`, `src/lib/audit.ts`, `src/app/api/auth/**`, `src/app/login/page.tsx`, `src/app/page.tsx`, `src/app/assets/page.tsx`, `src/app/assets/new/page.tsx`, `src/app/licenses/page.tsx`, `src/app/licenses/new/page.tsx`, `src/components/**`, `src/middleware.ts`, `src/types/next-auth.d.ts`, `package.json` (core deps), `tsconfig.json`, `eslint.config.mjs`, `next.config.ts`.

**Chỉ đụng**: `src/lib/errors.ts` (NEW), `src/lib/locking.ts` (NEW), `src/lib/commands/asset.ts` (NEW), `src/lib/commands/license.ts` (NEW), `src/app/actions/asset.ts` (REWRITE), `src/app/actions/license.ts` (REWRITE), `jest.config.ts` (NEW), `tests/*.test.ts` (NEW), `package.json` (chỉ devDependencies), `docs/exec/*` (3-4 file NEW).
