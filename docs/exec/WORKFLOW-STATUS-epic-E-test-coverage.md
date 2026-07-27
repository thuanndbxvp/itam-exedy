# WORKFLOW STATUS — Epic E Test Coverage

Ngày thực thi: 2026-07-26

## Pre-audit

- [x] Đọc và đối chiếu `docs/plan/MSEW-epic-E-test-coverage.md`.
- [x] Verify code thật của server actions, commands, audit, locking và UI components.
- [x] Baseline `npx tsc --noEmit`: PASS.
- [x] Baseline Jest: 9 suites, 79 tests PASS.
- [x] Verify registry `@prisma/adapter-pglite`: 404 Not Found.
- [x] Xác nhận workspace không phải Git repository.

## E-1 — PGlite

- [x] Cài `@electric-sql/pglite`.
- [x] Áp Strategy C: PGlite raw SQL và Prisma-compatible facade cho test.
- [x] Tạo singleton `getPg()`, `getPrisma()`, `resetDb()`, `seedMinimal()`, `teardownDb()`.
- [x] Smoke test PGlite: 2 tests PASS.

## E-2/E-3 — Integration

- [x] Asset create: happy path, RBAC, validation, audit.
- [x] Asset checkout/checkin/location: happy path và RBAC.
- [x] License create: happy path, RBAC, audit.
- [x] License seat checkout/checkin/expire và RBAC.
- [x] Audit actor: session user và system user.
- [x] Integration tổng: 7 suites, 20 tests PASS.

## E-4 — Race condition

- [x] Hai checkout chạy qua `Promise.all` trên cùng asset.
- [x] Kết quả đúng 1 success và 1 `LOCKED`.
- [x] DB có `checkoutCounter=1` và đúng 1 audit log.

## E-5 — Component tests

- [x] `RoleGate`: ADMIN, EMPLOYEE, loading fallback.
- [x] `Toast`: success, command error, auto-clear 5 giây.
- [x] `Modal`: closed/open/backdrop/Escape.
- [x] Component tổng: 3 suites, 10 tests PASS.

## E-6 — Playwright

- [x] Cài `@playwright/test`.
- [x] Cài Chromium binary thành công.
- [x] Tạo `playwright.config.ts`.
- [x] Tạo đủ 5 spec file.
- [x] Browser suite đã chạy: 1 pass, 6 fail tại `/api/auth/error`.
- [ ] Authenticated E2E flows PASS — BLOCKED bởi lỗi NextAuth runtime hiện hữu.

## Local CI adaptation

- [x] Tạo script `test`, `test:coverage`, `test:e2e`, `test:ci`.
- [x] `npm run test:ci`: PASS (`tsc`, 109 Jest tests, Next build).
- [x] Không tạo `.github/`, Codecov hoặc Husky.

## Trạng thái cuối

Epic E phần unit/integration/component/race/local-CI: PASS. Playwright files và browser đã sẵn sàng; authenticated flows còn blocker NextAuth runtime được ghi trong `BLOCKERS-epic-E-test-coverage.md`.

## Audit cuối (sau khi sửa ESLint `no-explicit-any`)

- [x] `npx tsc --noEmit`: PASS (0 errors).
- [x] `npx eslint tests/setup tests/integration tests/components tests/e2e jest.config.ts playwright.config.ts`: PASS (0 errors).
- [x] Toàn bộ Jest: 19 suites × 109 tests PASS.
- [x] `next build`: Compiled successfully 4.1s, 9 routes.
- [x] `asset.race.test.ts` rerun: PASS trong 1.6s (1 success + 1 LOCKED).
