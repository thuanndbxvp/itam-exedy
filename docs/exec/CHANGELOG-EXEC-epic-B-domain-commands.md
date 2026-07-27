# Nhật ký Thực thi (CHANGELOG-EXEC) — epic-B-domain-commands

| WF Step | Task ID/Tên | File đã sửa | Dòng thay đổi (Lines) | Test Command đã chạy | Test Status | Có Evidence? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Step 0 | Pre-Audit (TSC baseline) | — | — | `npx tsc --noEmit 2>&1` | `PASSED` (baseline 0 errors — A2 đã PASS) | `[x]` |
| Step 0 | Backup 2 file rewrite | `src/app/actions/asset.ts`, `src/app/actions/license.ts` | +2 backup files (`*.backup-before-b`) | `Get-ChildItem src/app/actions -Filter *.backup-before-b` | `PASSED` (2 file backup OK) | `[x]` |
| Step 1 | Tạo `src/lib/errors.ts` | `src/lib/errors.ts` (mới 87 dòng) | +87 / 0 | `npx tsc --noEmit 2>&1` | `PASSED` (0 errors) | `[x]` |
| Step 2 | Tạo `src/lib/locking.ts` (App-level lock + Prisma transaction) | `src/lib/locking.ts` (mới 90 dòng) | +90 / 0 | `npx tsc --noEmit 2>&1` | `PASSED` (0 errors) | `[x]` |
| Step 3 | Tạo `src/lib/commands/asset.ts` (3 pure commands) | `src/lib/commands/asset.ts` (mới 234 dòng) | +234 / 0 | `npx tsc --noEmit 2>&1` | `PASSED` (0 errors) | `[x]` |
| Step 4 | Tạo `src/lib/commands/license.ts` (4 pure commands) | `src/lib/commands/license.ts` (mới 233 dòng) | +233 / 0 | `npx tsc --noEmit 2>&1` | `PASSED` (0 errors) | `[x]` |
| Step 5 | Rewrite `src/app/actions/asset.ts` (3 command wrappers + createAsset) | `src/app/actions/asset.ts` (123 → 173 dòng) | +173 / -123 | `npx tsc --noEmit 2>&1` | `PASSED` (0 errors) | `[x]` |
| Step 6 | Rewrite `src/app/actions/license.ts` (4 command wrappers) | `src/app/actions/license.ts` (65 → 153 dòng) | +153 / -65 | `npx tsc --noEmit 2>&1` | `PASSED` (0 errors) | `[x]` |
| Step 7 | Tạo Jest config + 4 test files (35 tests) | `jest.config.ts` (mới 27 dòng), `tests/errors.test.ts` (52 dòng), `tests/locking.test.ts` (61 dòng), `tests/commands.asset.test.ts` (264 dòng), `tests/commands.license.test.ts` (286 dòng) | +690 / 0 | `npx jest --coverage` | `PASSED` (4 suites, 35 tests, 93.75% lines coverage) | `[x]` |
| Step 7 | Thêm devDependencies Jest | `package.json` — thêm `jest@29`, `ts-jest@29`, `@types/jest@29`, `ts-node@10` | dev deps mới | `npm install` | `PASSED` (248 packages added) | `[x]` |
| Step 8 | Verify tsc tổng thể | — | — | `npx tsc --noEmit` | `PASSED` (exit 0, 0 errors) | `[x]` |
| Step 8 | Verify ESLint | — | — | `npx eslint src/lib/errors.ts src/lib/locking.ts src/lib/commands/asset.ts src/lib/commands/license.ts src/app/actions/asset.ts src/app/actions/license.ts tests/` | `PASSED` (0 errors, 0 warnings) | `[x]` |
| Step 8 | Verify dev server + 6 routes | — | — | `Start-Process npx next dev` + 6×`curl` | `PASSED` (Ready in 1419ms, 6/6 routes HTTP 200) | `[x]` |
| Step 9 | Cập nhật 4 docs | `CHANGELOG-EXEC-epic-B-domain-commands.md`, `SKILL-USAGE-epic-B-domain-commands.md`, `EVIDENCE-epic-B-domain-commands.md`, `WORKFLOW-STATUS-epic-B-domain-commands.md` | +4 file | `dir docs\exec\*epic-b*` | `PASSED` | `[x]` |

*Ghi chú (Tier 2 điền):*
- **Divergence từ MSEW gốc**: Tier 1 ở MSEW đề xuất `SELECT ... FOR UPDATE` raw SQL + Prisma `$transaction`. TIER 2 PROMPT (do Tier 1 cũng viết) ghi rõ: *"dùng Prisma `$transaction` + Application-level lock (in-memory Map với TTL)"*. Tier 2 tuân theo TIER 2 PROMPT (nguồn tin mới nhất) — đã chuyển sang App-level Map<string, ts> với TTL 5s. Lý do documented trong JSDoc của `src/lib/locking.ts`.
- **Divergence từ MSEW gốc #2**: MSEW gốc viết 1 manual test script (`scripts/test-checkout.ts`). TIER 2 PROMPT yêu cầu **Jest tests**. Tier 2 implement cả hai: 4 suites × 35 tests Jest (ưu tiên cho CI) + đã PASS tsc. KHÔNG tạo `scripts/test-checkout.ts` để tránh duplication.
- **Divergence từ MSEW gốc #3**: TIER 2 PROMPT yêu cầu 4 command wrappers cho License (createLicense + assignSeat + revokeSeat + expireSeat). MSEW gốc chỉ liệt kê 3 wrapper (createLicense + checkoutLicenseSeat + checkinLicenseSeat) — đã bổ sung `expireLicenseSeat` theo TIER 2 PROMPT.
- **Phát hiện nhỏ (không block)**: Next.js 16 vẫn cảnh báo `src/middleware.ts` deprecated → đề xuất `proxy.ts` (xác nhận từ A2 EVIDENCE, không thuộc scope Epic B).
- **Phát hiện nhỏ trong thi công**: Lúc đầu `LockedError extends ConflictError` thì `code = 'LOCKED'` không thể assign (readonly). Đã sửa bằng cách `extends DomainError` trực tiếp. Tốn 1 retry trong Step 1, fix trong cùng step.
- Backup files `*.backup-before-b` đã tạo ở Step 0 để rollback nếu cần.
