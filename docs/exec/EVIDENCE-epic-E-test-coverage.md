# EVIDENCE — Epic E Test Coverage

Ngày chạy: 2026-07-26  
Workspace: `D:\IT-management`

## 1. Baseline

Command: `npx tsc --noEmit`  
Output: exit code 0, không có TypeScript error.

Command: `npx jest --runInBand`  
Output:

```text
Test Suites: 9 passed, 9 total
Tests:       79 passed, 79 total
```

## 1.1. Audit cuối (sau khi sửa ESLint `no-explicit-any` và bổ sung typed helpers)

- `npx tsc --noEmit` → exit code 0.
- `npx eslint tests/setup tests/integration tests/components tests/e2e jest.config.ts playwright.config.ts` → exit code 0 (0 errors).
- `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --runInBand` → 19 suites × 109 tests PASS.
- `npm run build` → Compiled successfully 4.1s, 9 routes, 0 error.
- `node --experimental-vm-modules ./node_modules/jest/bin/jest.js tests/integration/asset.race.test.ts` → PASS 1.6s (1 success + 1 LOCKED).

## 1.1. Audit cuối (sau khi sửa ESLint `no-explicit-any` và bổ sung typed helpers)

Command: `npx tsc --noEmit` → exit code 0.  
Command: `npx eslint tests/setup tests/integration tests/components tests/e2e jest.config.ts playwright.config.ts` → exit code 0.  
Command: `node --experimental-vm-modules ./node_modules/jest/bin/jest.js --runInBand` → 19 suites × 109 tests PASS.  
Command: `npm run build` → Compiled successfully in 4.1s, 9 routes tạo ra, 0 error.

## 2. Registry và dependency

Command: `npm view @prisma/adapter-pglite versions --json`  
Output: npm HTTP 404 Not Found.

Command: `npm view @electric-sql/pglite version`  
Output: `0.5.4` tại thời điểm audit; package manager cài phiên bản thỏa range hiện hành.

Command: `npm view @playwright/test version`  
Output: `1.62.0`.

Command: `npx playwright install chromium --with-deps`  
Output: Chromium và Chromium Headless Shell tải thành công vào local Playwright cache.

## 3. PGlite smoke

Command: `npm test -- tests/integration/_smoke.test.ts --runInBand`  
Output:

```text
PASS tests/integration/_smoke.test.ts
Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
```

## 4. Integration

Command: `npm test -- tests/integration --runInBand`  
Output:

```text
PASS tests/integration/asset.checkout.test.ts
PASS tests/integration/license.checkout-seat.test.ts
PASS tests/integration/asset.create.test.ts
PASS tests/integration/asset.race.test.ts
PASS tests/integration/license.create.test.ts
PASS tests/integration/_smoke.test.ts
PASS tests/integration/audit.test.ts
Test Suites: 7 passed, 7 total
Tests:       20 passed, 20 total
```

## 5. Component tests

Command: `npm test -- tests/components --runInBand`  
Output cuối sau khi bọc state transition bằng `act`:

```text
PASS tests/components/Toast.test.tsx
PASS tests/components/RoleGate.test.tsx
PASS tests/components/Modal.test.tsx
Test Suites: 3 passed, 3 total
Tests:       10 passed, 10 total
```

## 6. Coverage

Command: `npm run test:coverage`  
Output:

```text
File            | % Stmts | % Branch | % Funcs | % Lines
All files       |   95.31 |    78.46 |   98.71 |   96.72
app/actions     |   96.15 |    77.61 |     100 |   96.15
 asset.ts       |   96.22 |    77.77 |     100 |   96.22
 license.ts     |   96.07 |    77.35 |     100 |   96.07
RoleGate.tsx    |   92.85 |    76.92 |     100 |     100
Toast.tsx       |   90.47 |    81.57 |   93.33 |   94.28
Modal.tsx       |     100 |    81.81 |     100 |     100
locking.ts      |     100 |      100 |     100 |     100
lib/commands    |   93.54 |    75.89 |     100 |   96.42
 asset.ts       |   93.18 |    86.27 |     100 |   94.87
 license.ts     |   93.87 |    67.21 |     100 |   97.77

Test Suites: 19 passed, 19 total
Tests:       109 passed, 109 total
```

Acceptance mapping:

- Commands statements: 93.54% >= 90%.
- Locking statements/branches/functions/lines: 100%.
- Server actions statements/lines: 96.15% >= 80%.
- RoleGate/Toast/Modal statements: 92.85% / 90.47% / 100% >= 80%.

## 7. Race condition

Command: `npm test -- tests/integration/asset.race.test.ts --runInBand`  
Output:

```text
PASS tests/integration/asset.race.test.ts
race condition khi checkout cùng asset
  hai request overlap chỉ có một success và một LOCKED
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

Assertion đồng thời xác nhận `checkoutCounter=1`, đúng 1 audit log và thời gian nằm dưới TTL 5 giây.

## 8. Playwright

Command: `npm run test:e2e`  
Output:

```text
Running 7 tests using 1 worker
1 passed
6 failed
```

Pass: anonymous truy cập `/assets` được redirect tới `/login`.  
Fail chung: authenticated/login flows chuyển tới `http://localhost:3000/api/auth/error`. Chi tiết ở `BLOCKERS-epic-E-test-coverage.md`.

Đủ 5 spec file:

- `tests/e2e/login.spec.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/asset-checkout.spec.ts`
- `tests/e2e/license-checkout.spec.ts`
- `tests/e2e/rbac-403.spec.ts`

## 9. Local CI

Command: `npm run test:ci`  
Output:

```text
TypeScript: PASS
Test Suites: 19 passed, 19 total
Tests:       109 passed, 109 total
Next.js 16.2.11: Compiled successfully
Static pages generated: 9/9
Exit code: 0
```

## 10. Kết luận acceptance

- E-1 typecheck: PASS.
- E-2 test count: PASS (19 suites, 109 tests).
- E-3 commands/locking coverage: PASS.
- E-4 server action coverage: PASS.
- E-5 components coverage: PASS.
- E-6 race: PASS.
- E-7 E2E files/browser install: PASS; authenticated runtime execution BLOCKED.
- E-8 local `test:ci`: PASS.
- E-9 Phase 1 regression: PASS.
- E-10 five docs: PASS.
