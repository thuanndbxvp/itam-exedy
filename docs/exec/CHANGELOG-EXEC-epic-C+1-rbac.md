# Nhật ký Thực thi (CHANGELOG-EXEC) — epic-C+1-rbac

| WF Step | Task ID/Tên | File đã sửa | Dòng thay đổi (Lines) | Test Command đã chạy | Test Status | Có Evidence? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Step 0 | Pre-Audit (TSC baseline) | — | — | `npx tsc --noEmit` | `PASSED` (baseline 0 errors — Epic C+0.5 PASS) | `[x]` |
| Step 0 | Pre-Audit (Jest baseline) | — | — | `npx jest --silent` | `PASSED` (5 suites, 39/39 tests) | `[x]` |
| Step 1 | Thêm `ForbiddenError` class | `src/lib/errors.ts` | +14 / 0 | `npx tsc --noEmit` | `PASSED` (0 errors) | `[x]` |
| Step 2 | Thêm `requireRole` helper + `Role` type | `src/lib/auth-guard.ts` (14 → 47 dòng) | +33 / 0 | `npx tsc --noEmit` | `PASSED` (0 errors) | `[x]` |
| Step 3 | Wire `requireRole('ADMIN')` vào 4 asset actions | `src/app/actions/asset.ts` (166 → 174 dòng) | +8 / 0 | `npx tsc --noEmit` | `PASSED` (0 errors) | `[x]` |
| Step 4 | Wire `requireRole('ADMIN')` vào 4 license actions | `src/app/actions/license.ts` (149 → 157 dòng) | +8 / 0 | `npx tsc --noEmit` | `PASSED` (0 errors) | `[x]` |
| Step 5 | Tạo `tests/auth-guard.test.ts` (11 tests) | `tests/auth-guard.test.ts` (mới 113 dòng) | +113 / 0 | `npx jest tests/auth-guard.test.ts --verbose` | `PASSED` (11/11 tests) | `[x]` |
| Step 6 | Verify tsc tổng thể | — | — | `npx tsc --noEmit` | `PASSED` (exit 0, 0 errors) | `[x]` |
| Step 6 | Verify Jest full | — | — | `npx jest --silent` | `PASSED` (6 suites, 50/50 tests, +11 mới) | `[x]` |
| Step 6 | Verify ESLint (5 file) | — | — | `npx eslint src/lib/errors.ts src/lib/auth-guard.ts src/app/actions/asset.ts src/app/actions/license.ts tests/auth-guard.test.ts` | `PASSED` (0 errors, 0 warnings) | `[x]` |
| Step 7 | Manual smoke: session.role mapping | — | — | `node scripts/manual-rbac-smoke.mjs` (curl login flow) | `PASSED` (admin@congty.com → role=ADMIN, nhanvien@congty.com → role=EMPLOYEE) | `[x]` |
| Step 7 | Manual smoke: dev server recompile | — | — | `Invoke-WebRequest http://localhost:3000/assets` | `PASSED` (200 OK, no compile errors) | `[x]` |
| Step 7 | Wiring check: 4+4 requireRole occurrences | — | — | Grep `requireRole('ADMIN')` × 2 file | `PASSED` (4 asset + 4 license = 8) | `[x]` |
| Step 8 | Cập nhật 5 docs | `CHANGELOG-EXEC-epic-C+1-rbac.md`, `SKILL-USAGE-epic-C+1-rbac.md`, `EVIDENCE-epic-C+1-rbac.md`, `WORKFLOW-STATUS-epic-C+1-rbac.md`, `BLOCKERS-epic-C+1-rbac.md` | +5 file | `ls docs/exec/*epic-c+1*` | `PASSED` | `[x]` |

*Ghi chú (Tier 2 điền):*
- **Scope đúng kế hoạch**: đúng 5 file (3 sửa + 2 mới). KHÔNG đụng `src/lib/auth.ts`, `src/proxy.ts`, `src/components/Header.tsx`, `src/lib/commands/*`, `prisma/*`, `tests/middleware.test.ts`, các Epic A/B/C khác.
- **Divergence từ MSEW gốc #1**: MSEW gốc viết `requireRole(['ADMIN'])` (array) và `requireRole` trả về `{ id, role }`. TIER 2 (theo instruction cụ thể trong Tier 2 prompt) dùng `requireRole('ADMIN')` (single role string) và trả về `void`. Lý do: user instruction trong task description Tier 2 rõ ràng hơn MSEW, và signature đơn giản hơn (chỉ cần check role, không cần return value). Phase 2 sẽ refactor nếu cần nhiều role.
- **Divergence từ MSEW gốc #2**: MSEW gốc liệt kê 5 functions trong license.ts (trộn cả `createLicense` + 4 actions = 5). Tier 2 instruction Tier 2 prompt liệt kê 4 functions: `createLicense`, `checkoutLicenseSeatCmd`, `checkinLicenseSeatCmd`, `expireLicenseSeatCmd`. Tier 2 verify: license.ts chỉ có 4 exported functions, nên tổng 4 requireRole calls đúng.
- **Tier 2 KHÔNG commit** (workspace không phải git repo, theo chỉ thị Tier 1).
- **Test count**: 50 tests = 39 cũ (Epic A2 + B + C) + 11 mới (Epic C+1: 7 requireRole + 4 ForbiddenError).
- **8 occurrences** của `await requireRole('ADMIN')` = 4 trong asset.ts (createAsset, checkoutAssetCmd, checkinAssetCmd, checkoutAssetToLocationCmd) + 4 trong license.ts (createLicense, checkoutLicenseSeatCmd, checkinLicenseSeatCmd, expireLicenseSeatCmd).
