# CHANGELOG EXEC — Epic E Test Coverage

| Hạng mục | File | Thay đổi | Trạng thái |
|---|---|---|---|
| Dependencies/scripts | `package.json`, `package-lock.json` | Thêm PGlite, Testing Library, Playwright và local CI scripts | DONE |
| Jest config | `jest.config.ts` | Nhận `.test.tsx`, raw Prisma mapper, coverage scope mới, timeout | DONE |
| PGlite setup | `tests/setup/pglite-setup.ts` | Raw PostgreSQL schema, singleton, reset/seed/teardown, facade | DONE |
| Prisma test boundary | `tests/setup/prisma-mock.ts` | Forward Prisma calls sang PGlite facade | DONE |
| Integration helper | `tests/integration/_helpers.ts` | Reset DB/locks và seed độc lập | DONE |
| Smoke | `tests/integration/_smoke.test.ts` | 2 PGlite infrastructure tests | DONE |
| Asset create | `tests/integration/asset.create.test.ts` | 4 server-action tests | DONE |
| Asset checkout | `tests/integration/asset.checkout.test.ts` | 4 checkout/checkin/location tests | DONE |
| Asset race | `tests/integration/asset.race.test.ts` | 1 concurrent lock test | DONE |
| License create | `tests/integration/license.create.test.ts` | 3 server-action tests | DONE |
| License seat | `tests/integration/license.checkout-seat.test.ts` | 4 seat lifecycle/RBAC tests | DONE |
| Audit | `tests/integration/audit.test.ts` | 2 actor resolution tests | DONE |
| RoleGate | `tests/components/RoleGate.test.tsx` | 3 jsdom tests | DONE |
| Toast | `tests/components/Toast.test.tsx` | 3 jsdom tests | DONE |
| Modal | `tests/components/Modal.test.tsx` | 4 jsdom tests | DONE |
| Playwright config | `playwright.config.ts` | Chromium, webServer, traces/screenshots on failure | DONE |
| Login E2E | `tests/e2e/login.spec.ts` | Login error/success và anonymous redirect | WRITTEN; AUTH BLOCKED |
| Dashboard E2E | `tests/e2e/dashboard.spec.ts` | Authenticated assets view | WRITTEN; AUTH BLOCKED |
| Asset E2E | `tests/e2e/asset-checkout.spec.ts` | Modal checkout journey | WRITTEN; AUTH BLOCKED |
| License E2E | `tests/e2e/license-checkout.spec.ts` | Seat checkout journey | WRITTEN; AUTH BLOCKED |
| RBAC E2E | `tests/e2e/rbac-403.spec.ts` | EMPLOYEE UI restrictions | WRITTEN; AUTH BLOCKED |
| Evidence docs | `docs/exec/*epic-E-test-coverage.md` | 5 execution/audit documents | DONE |

Không thay đổi bất kỳ production business logic, Prisma schema, server-action signature hoặc component implementation nào.
