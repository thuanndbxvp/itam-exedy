# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC E — TEST COVERAGE (INTEGRATION + E2E + RACE-CONDITION)

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-26
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · B ✅ · C ✅ · C+0.5 ✅ · C+1 ✅ · **D ✅**
**Phạm vi:** Nâng test coverage từ 79 unit tests (mock Prisma) → 79 unit + **integration + E2E + race-condition + visual regression**. Mục tiêu: 90%+ coverage cho business logic, regression-safe cho UI.
**Phạm vi LOẠI TRỪ:** KHÔNG test third-party libs (NextAuth, Prisma); KHÔNG load test ở Phase 2 (defer Phase 3); KHÔNG chaos test (defer Phase 4)

---

## 0. Tại sao Epic E tồn tại — Audit code hiện tại

### Tier 1 đã verify trước khi viết MSEW

| Câu hỏi | Finding |
|---|---|
| Số unit tests Phase 1 | **9 suites × 79 tests** PASS |
| Coverage hiện tại | `collectCoverageFrom: ['src/lib/commands/**', 'src/lib/locking.ts', 'src/lib/errors.ts']` → chỉ ~25% codebase |
| Có integration test với Prisma + DB thật? | ❌ KHÔNG — `tests/commands.asset.test.ts` mock TransactionClient |
| Có E2E test (Playwright)? | ❌ KHÔNG — không có playwright.config.ts |
| Có test race-condition? | ❌ KHÔNG — Epic B đã note app-level lock có giới hạn |
| Có test server actions? | ❌ KHÔNG — chỉ test pure commands, không test RBAC thật |
| Có test UI components? | ❌ KHÔNG — chỉ test `auth-guard.ts`, không test RoleGate/Toast/Modal |
| Có CI/CD? | ❌ KHÔNG — không có `.github/workflows/*.yml` |

### Tech debt Tier 2 nêu

> "App-level lock (Epic B) chỉ là Phase 1 — không thay thế được Postgres advisory lock hoặc SELECT FOR UPDATE khi scale multi-instance"

→ Epic E sẽ test giới hạn này với **race-condition test** (2 concurrent requests).

### 4 test gap nguy hiểm

| # | Gap | Rủi ro |
|---|-----|--------|
| 1 | Server actions KHÔNG có test | `createAsset` / `checkoutAssetCmd` có thể silently fail hoặc bypass RBAC |
| 2 | UI components KHÔNG có test | `RoleGate` / `Toast` / `CheckoutAssetModal` có thể render sai sau Epic F |
| 3 | Race-condition KHÔNG có test | 2 admin checkout cùng 1 asset → có thể cả 2 đều pass logic check, DB inconsistent |
| 4 | E2E KHÔNG có test | Login flow + redirect + auth middleware chưa được test end-to-end |

---

## 1. MVP Test Plan — 6 deliverables

| # | Deliverable | Mục đích | Effort |
|---|-------------|----------|--------|
| **E-1** | Setup **PGlite** (in-memory Postgres) cho integration test | Test Prisma commands với DB thật, KHÔNG cần Docker | 1 ngày |
| **E-2** | Integration tests cho server actions (`createAsset`, `checkoutAssetCmd`, `checkinAssetCmd`, `checkoutAssetToLocationCmd`) | Verify RBAC + business logic + audit log | 2 ngày |
| **E-3** | Integration tests cho license server actions (`createLicense`, `checkoutLicenseSeatCmd`, `checkinLicenseSeatCmd`, `expireLicenseSeatCmd`) | Verify seat availability + assignment | 1 ngày |
| **E-4** | Race-condition test (2 concurrent checkouts cùng asset) | Verify `withRowLock` thật sự lock | 0.5 ngày |
| **E-5** | Component tests cho RoleGate / Toast / Modal | Verify React components render đúng với role | 1 ngày |
| **E-6** | E2E tests với Playwright (login, dashboard, checkout flow) | Verify toàn bộ flow trên browser thật | 2 ngày |

**Tổng MVP: ~7.5 ngày**

### Bonus — 4 deliverables (Tier 2 nên làm nếu còn time)

| # | Deliverable | Effort |
|---|-------------|--------|
| **E-7** | GitHub Actions CI: lint + test + build trên mỗi PR | 0.5 ngày |
| **E-8** | Visual regression test với Playwright screenshot | 1 ngày |
| **E-9** | Coverage report tự động upload lên Codecov / Coveralls | 0.5 ngày |
| **E-10** | Pre-commit hook (lint + format + test affected) | 0.5 ngày |

**Tổng Bonus: ~2.5 ngày**

### Grand total: ~10 ngày

→ Tier 2 nên làm MVP 6 deliverables trước (7.5 ngày), bonus 4 deliverables nếu còn time.

---

## 2. Quyết định của Planner (trả lời 4 câu hỏi Tier 2 có thể hỏi)

| Q | Câu hỏi | Quyết định | Lý do |
|---|---------|------------|-------|
| **Q1** | Integration test dùng Postgres thật (Neon + Docker) hay PGlite (in-memory)? | **PGlite** | Không cần Docker → chạy được trên CI free tier. Phase 3 sẽ chuyển Postgres thật. |
| **Q2** | E2E test dùng Cypress hay Playwright? | **Playwright** | Cùng nhà với PGlite team (Microsoft), hỗ trợ multi-browser + auto-wait, free + open source. |
| **Q3** | Test UI components dùng React Testing Library + Vitest hay Jest? | **React Testing Library + Jest** (giữ Jest) | Đã có Jest setup → không cần đổi. Vitest nhanh hơn nhưng switch cost cao. |
| **Q4** | CI/CD dùng GitHub Actions hay Vercel native? | **GitHub Actions** | Free cho public repo, control được test matrix. Vercel chỉ build, không chạy test. |

---

## 3. Tiêu chí nghiệm thu Epic E

### BẮT BUỘC (Acceptance Criteria)

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| **E-1** | `npx tsc --noEmit` PASS (0 errors) | Shell |
| **E-2** | `npx jest` PASS (13+ suites, 100+ tests) | Shell |
| **E-3** | Coverage report: `src/lib/commands/**` ≥ 90%, `src/lib/locking.ts` ≥ 90% | `npx jest --coverage` |
| **E-4** | Coverage report: `src/app/actions/**` ≥ 80% (server actions) | Coverage report |
| **E-5** | Coverage report: `src/components/RoleGate.tsx`, `Toast.tsx`, `Modal.tsx` ≥ 80% | Coverage report |
| **E-6** | Race-condition test: 2 concurrent `checkoutAssetCmd` cùng assetId → 1 pass, 1 throw `LockedError` | `npx jest tests/integration/asset.race.test.ts` |
| **E-7** | E2E test: Login flow (`/login` → admin → `/dashboard` check) | `npx playwright test tests/e2e/login.spec.ts` |
| **E-8** | E2E test: Checkout flow (login admin → `/assets` → click "Cấp phát" → modal → submit → asset assigned) | Playwright |
| **E-9** | E2E test: RBAC flow (login EMPLOYEE → click checkout → toast FORBIDDEN hiển thị) | Playwright |
| **E-10** | GitHub Actions CI chạy xanh trên PR đầu tiên | Push lên GitHub, check Actions tab |

### KHÔNG BẮT BUỘC (Phase 3)

- ~~Load test (100 concurrent users)~~ → Phase 3 hardening
- ~~Chaos test (kill Postgres mid-request)~~ → Phase 4
- ~~Penetration test (SQL injection, XSS)~~ → Phase 2 polish

---

## 4. Files thay đổi

### 4.1 E-1: Setup PGlite

| File | Loại |
|------|------|
| `tests/setup/pglite-setup.ts` | Mới — singleton PGlite instance + Prisma adapter |
| `tests/integration/_helpers.ts` | Mới — `beforeEach` reset DB, `seedMinimal()` helper |
| `jest.config.ts` | Sửa — thêm `setupFilesAfterEach`, `globalSetup` cho PGlite |
| `package.json` | Sửa — thêm `@electric-sql/pglite`, `@prisma/adapter-pglite` |

### 4.2 E-2, E-3: Server action integration tests

| File | Loại |
|------|------|
| `tests/integration/asset.create.test.ts` | Mới — test `createAsset` happy path + validation + RBAC |
| `tests/integration/asset.checkout.test.ts` | Mới — test `checkoutAssetCmd` happy + forbidden + invalid state |
| `tests/integration/asset.checkin.test.ts` | Mới — test `checkinAssetCmd` |
| `tests/integration/license.create.test.ts` | Mới — test `createLicense` |
| `tests/integration/license.checkout-seat.test.ts` | Mới — test `checkoutLicenseSeatCmd` |
| `tests/integration/license.checkin-seat.test.ts` | Mới — test `checkinLicenseSeatCmd` |

### 4.3 E-4: Race-condition test

| File | Loại |
|------|------|
| `tests/integration/asset.race.test.ts` | Mới — 2 concurrent checkouts |

### 4.4 E-5: Component tests

| File | Loại |
|------|------|
| `tests/components/RoleGate.test.tsx` | Mới |
| `tests/components/Toast.test.tsx` | Mới |
| `tests/components/Modal.test.tsx` | Mới |
| `jest.config.ts` | Sửa — thêm `testEnvironment: 'jsdom'` cho component tests |
| `package.json` | Sửa — thêm `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` |

### 4.5 E-6: E2E tests

| File | Loại |
|------|------|
| `playwright.config.ts` | Mới |
| `tests/e2e/login.spec.ts` | Mới |
| `tests/e2e/dashboard.spec.ts` | Mới |
| `tests/e2e/asset-checkout.spec.ts` | Mới |
| `tests/e2e/license-checkout.spec.ts` | Mới |
| `tests/e2e/rbac-403.spec.ts` | Mới |
| `package.json` | Sửa — thêm `@playwright/test` |

### 4.6 Bonus (E-7 → E-10)

| File | Loại |
|------|------|
| `.github/workflows/ci.yml` | Mới — GitHub Actions |
| `.github/workflows/e2e.yml` | Mới — Playwright CI |
| `.husky/pre-commit` | Mới — lint + format |
| `package.json` | Sửa — thêm `lint-staged`, `husky` |

**Tổng:** ~25 file (20 mới + 5 sửa), ~3000 dòng test code.

---

## 5. Bối cảnh tham chiếu

| Nguồn | Mục đích |
|--------|----------|
| `jest.config.ts` | Config hiện tại — sẽ sửa setup + testEnvironment |
| `tests/*.test.ts` (9 files) | Phase 1 tests — KHÔNG sửa, sẽ giữ song song |
| `src/app/actions/asset.ts` (Epic B + C+1) | Test target cho E-2 |
| `src/app/actions/license.ts` (Epic B + C+1) | Test target cho E-3 |
| `src/lib/commands/*.ts` (Epic B) | Test target cho E-1 (PGlite) |
| `src/lib/locking.ts` (Epic B) | Test target cho E-4 (race condition) |
| `src/components/RoleGate.tsx` (Epic D) | Test target cho E-5 |
| `src/components/Toast.tsx` (Epic D) | Test target cho E-5 |
| `src/components/ui/Modal.tsx` (Epic D) | Test target cho E-5 |
| `@electric-sql/pglite` | Lightweight Postgres in WASM — test dependency mới |
| `@playwright/test` | E2E test framework — test dependency mới |

---

## 6. Quy ước (Tier 2 BẮT BUỘC)

1. **Mỗi test file PHẢI independent** — không phụ thuộc thứ tự chạy. Dùng `beforeEach` reset DB.
2. **Mỗi test PHẢI có 1 assertion chính** — đừng test 5 thứ trong 1 test.
3. **Tên test PHẢI mô tả behavior**, không phải implementation: `test('EMPLOYEE bị block khi checkout')` KHÔNG `test('testRequireRoleWithEmployeeSession')`.
4. **Mock CHỈ ở biên giới** (network, file system, time). KHÔNG mock internal libs.
5. **PGlite schema reset giữa tests** — dùng `TRUNCATE` thay vì `prisma migrate reset` (chậm).
6. **E2E test KHÔNG touch DB trực tiếp** — chỉ tương tác qua UI.
7. **Race-condition test PHẢI đo timing** — dùng `Date.now()` để verify 2 requests overlap.

---

## BƯỚC 0: Pre-Audit

```bash
cd "D:\IT-management"

# 1. Verify state Phase 1
npx tsc --noEmit 2>&1 | head -10
# Expected: 0 errors

npx jest --silent 2>&1 | tail -5
# Expected: 9 suites PASS, 79 tests

# 2. Verify npm packages hiện tại KHÔNG có PGlite/Playwright
grep -E "pglite|playwright|testing-library" package.json
# Expected: KHÔNG tìm thấy

# 3. Verify PGlite + Playwright available trên registry (chỉ check, không install)
npm view @electric-sql/pglite version
npm view @playwright/test version
# Expected: cả 2 đều có version mới nhất
```

---

## PHẦN 1: SETUP PGLITE (E-1)

### BƯỚC 1: Cài dependencies

```bash
cd "D:\IT-management"

npm install --save-dev \
  @electric-sql/pglite \
  @prisma/adapter-pglite \
  jest-environment-jsdom \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test
```

**Verify:**

```bash
grep -E "pglite|testing-library|playwright" package.json
# Expected: 6 packages mới
```

---

### BƯỚC 2: Tạo `tests/setup/pglite-setup.ts`

**File mới.** ~60 dòng.

```typescript
/**
 * Singleton PGlite instance + Prisma adapter cho integration tests.
 *
 * Tại sao PGlite:
 *   - In-memory Postgres, KHÔNG cần Docker/CI infrastructure.
 *   - Chạy trong cùng Node.js process (Postgres compiled to WASM).
 *   - Schema/migration giống 100% Postgres thật → no surprise.
 *
 * Phase 3 sẽ chuyển sang Postgres thật (Neon + Docker) cho performance.
 *
 * Cách dùng:
 *   import { prisma, resetDb, seedMinimal } from './setup/pglite-setup'
 *
 *   beforeEach(async () => {
 *     await resetDb()
 *     await seedMinimal()
 *   })
 */
import { PGlite } from '@electric-sql/pglite'
import { PrismaPGliteAdapter } from '@prisma/adapter-pglite'
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

let pgInstance: PGlite | null = null
let prismaInstance: PrismaClient | null = null

export async function getPg(): Promise<PGlite> {
  if (pgInstance) return pgInstance
  pgInstance = new PGlite()  // in-memory
  await pgInstance.waitReady
  return pgInstance
}

export async function getPrisma(): Promise<PrismaClient> {
  if (prismaInstance) return prismaInstance

  const pg = await getPg()

  // Apply schema
  const schema = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', { encoding: 'utf-8' })
  await pg.exec(schema)

  prismaInstance = new PrismaClient({
    adapter: new PrismaPGliteAdapter(pg),
  })
  return prismaInstance
}

/** Xóa tất cả data, giữ schema. Gọi trong beforeEach. */
export async function resetDb(): Promise<void> {
  const prisma = await getPrisma()
  // Order matters: delete theo thứ tự FK constraint
  await prisma.actionLog.deleteMany()
  await prisma.asset.deleteMany()
  await prisma.licenseSeat.deleteMany()
  await prisma.license.deleteMany()
  await prisma.user.deleteMany()
  await prisma.statusLabel.deleteMany()
  await prisma.category.deleteMany()
  await prisma.company.deleteMany()
  await prisma.location.deleteMany()
}

/** Seed minimum data để test chạy được. */
export async function seedMinimal(): Promise<{ adminId: string; employeeId: string; companyId: string }> {
  const prisma = await getPrisma()

  const company = await prisma.company.create({
    data: { name: 'Test Corp' },
  })

  await prisma.statusLabel.create({
    data: { id: 'status-deployable', name: 'Ready to Deploy', deployable: true, pending: false, archived: false },
  })
  await prisma.statusLabel.create({
    data: { id: 'status-deployed', name: 'Deployed', deployable: false, pending: false, archived: false },
  })

  const admin = await prisma.user.create({
    data: {
      firstName: 'Test Admin',
      lastName: null,
      email: 'admin@test.com',
      username: 'admin',
      password: '$2b$10$dummyhashforseedonly',  // bcrypt dummy
      role: 'ADMIN',
      activated: true,
      companyId: company.id,
    },
  })

  const employee = await prisma.user.create({
    data: {
      firstName: 'Test Employee',
      lastName: null,
      email: 'employee@test.com',
      username: 'employee',
      password: '$2b$10$dummyhashforseedonly',
      role: 'EMPLOYEE',
      activated: true,
      companyId: company.id,
    },
  })

  return { adminId: admin.id, employeeId: employee.id, companyId: company.id }
}

/** Cleanup khi test suite kết thúc. */
export async function teardownDb(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
  }
  if (pgInstance) {
    await pgInstance.close()
    pgInstance = null
  }
}
```

---

### BƯỚC 3: Sửa `jest.config.ts`

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Match tất cả test: .test.ts (Node + integration) + .test.tsx (components)
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },

  // PGlite setup — chạy 1 lần trước tất cả test files
  globalSetup: '<rootDir>/tests/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/setup/global-teardown.ts',

  // Per-file setup — reset DB trước mỗi test
  setupFilesAfterEach: ['<rootDir>/tests/setup/before-each.ts'],

  collectCoverageFrom: [
    'src/lib/commands/**/*.ts',
    'src/lib/locking.ts',
    'src/lib/errors.ts',
    'src/lib/auth-guard.ts',
    'src/lib/rate-limit.ts',
    'src/app/actions/**/*.ts',     // ← mở rộng
    'src/components/RoleGate.tsx',   // ← mở rộng
    'src/components/Toast.tsx',     // ← mở rộng
    'src/components/ui/Modal.tsx',  // ← mở rộng
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  clearMocks: true,

  // Tăng timeout cho PGlite schema migration
  testTimeout: 30000,
};

export default config;
```

---

### BƯỚC 4: Tạo `tests/setup/global-setup.ts` + `global-teardown.ts`

```typescript
// tests/setup/global-setup.ts
import { getPg } from './pglite-setup'

export default async function () {
  // Trigger PGlite khởi tạo 1 lần trước tất cả test
  await getPg()
}
```

```typescript
// tests/setup/global-teardown.ts
import { teardownDb } from './pglite-setup'

export default async function () {
  await teardownDb()
}
```

---

### BƯỚC 5: Tạo `tests/setup/before-each.ts`

```typescript
import { resetDb, seedMinimal } from './pglite-setup'

beforeEach(async () => {
  await resetDb()
  await seedMinimal()
})
```

**Verify:**

```bash
npx jest tests/integration/_smoke.test.ts
# Expected: PASS (sau khi tạo file smoke ở Bước 6)
```

---

### BƯỚC 6: Tạo smoke test `tests/integration/_smoke.test.ts`

```typescript
import { getPrisma } from '../setup/pglite-setup'

describe('PGlite setup smoke test', () => {
  test('Prisma connect được với PGlite', async () => {
    const prisma = await getPrisma()
    const count = await prisma.user.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('resetDb + seedMinimal chạy được', async () => {
    const prisma = await getPrisma()
    await prisma.user.create({
      data: {
        firstName: 'Extra',
        lastName: null,
        email: 'extra@test.com',
        username: 'extra',
        role: 'EMPLOYEE',
        activated: true,
        companyId: (await prisma.company.findFirst())!.id,
      },
    })
    const before = await prisma.user.count()
    expect(before).toBeGreaterThan(2)

    // beforeEach đã reset + seed, nên giờ chỉ có 2 user
    const after = await prisma.user.count()
    expect(after).toBe(2)
  })
})
```

**Verify:**

```bash
npx jest tests/integration/_smoke.test.ts
# Expected: 2 tests PASS
```

---

## PHẦN 2: INTEGRATION TESTS — SERVER ACTIONS (E-2, E-3)

### BƯỚC 7: Tạo `tests/integration/asset.create.test.ts` (E-2)

**File mới.** ~120 dòng.

```typescript
/**
 * Integration test cho createAsset server action.
 *
 * Test với Prisma + PGlite thật + session giả.
 * Verify:
 *   - Happy path ADMIN: tạo asset thành công + ActionLog
 *   - Validation: missing required fields → CommandResult.ok=false
 *   - RBAC: EMPLOYEE bị block với code FORBIDDEN
 *   - FK: invalid categoryId → CommandResult.ok=false (FK constraint)
 */
import { createAsset } from '@/app/actions/asset'
import { getPrisma } from '../setup/pglite-setup'

// Mock next-auth — bypass session thật, inject session giả
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

const { getServerSession } = jest.requireMock('next-auth') as {
  getServerSession: jest.Mock
}

async function mockSession(userId: string, role: 'ADMIN' | 'EMPLOYEE') {
  getServerSession.mockResolvedValue({
    user: { id: userId, role, firstName: 'Test', lastName: null, email: `${role}@test.com` },
  })
}

describe('createAsset server action', () => {
  let adminId: string
  let employeeId: string

  beforeAll(async () => {
    const prisma = await getPrisma()
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    const employee = await prisma.user.findFirst({ where: { role: 'EMPLOYEE' } })
    if (!admin || !employee) throw new Error('Seed failed')
    adminId = admin.id
    employeeId = employee.id
  })

  test('ADMIN tạo asset thành công', async () => {
    await mockSession(adminId, 'ADMIN')
    const prisma = await getPrisma()
    const category = await prisma.category.create({
      data: { name: 'Laptop', companyId: (await prisma.company.findFirst())!.id },
    })

    const result = await createAsset({
      assetTag: 'LAP-001',
      name: 'MacBook Pro M2',
      categoryId: category.id,
      statusId: 'status-deployable',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.assetTag).toBe('LAP-001')
    }

    // Verify DB
    const asset = await prisma.asset.findUnique({ where: { assetTag: 'LAP-001' } })
    expect(asset).not.toBeNull()

    // Verify ActionLog
    const logs = await prisma.actionLog.findMany({ where: { itemId: asset!.id, actionType: 'CREATE' } })
    expect(logs).toHaveLength(1)
    expect(logs[0].userId).toBe(adminId)
  })

  test('EMPLOYEE bị block với code FORBIDDEN', async () => {
    await mockSession(employeeId, 'EMPLOYEE')
    const prisma = await getPrisma()
    const category = await prisma.category.findFirst()

    const result = await createAsset({
      assetTag: 'LAP-002',
      name: 'Should fail',
      categoryId: category!.id,
      statusId: 'status-deployable',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('FORBIDDEN')
    }

    // Verify DB KHÔNG có asset mới
    const asset = await prisma.asset.findUnique({ where: { assetTag: 'LAP-002' } })
    expect(asset).toBeNull()
  })

  test('Validation: missing assetTag → INVALID', async () => {
    await mockSession(adminId, 'ADMIN')
    const prisma = await getPrisma()
    const category = await prisma.category.findFirst()

    const result = await createAsset({
      assetTag: '',
      name: 'No tag',
      categoryId: category!.id,
      statusId: 'status-deployable',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.code).toBe('VALIDATION')
    }
  })

  test('FK constraint: invalid categoryId → INVALID', async () => {
    await mockSession(adminId, 'ADMIN')

    const result = await createAsset({
      assetTag: 'LAP-003',
      name: 'Invalid FK',
      categoryId: 'nonexistent-category',
      statusId: 'status-deployable',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      // FK error → Prisma throw → wrapper catch
      expect(['VALIDATION', 'UNKNOWN']).toContain(result.code)
    }
  })
})
```

**Verify:**

```bash
npx jest tests/integration/asset.create.test.ts
# Expected: 4 tests PASS
```

---

### BƯỚC 8: Tương tự tạo `tests/integration/asset.checkout.test.ts`, `asset.checkin.test.ts`

Pattern tương tự Bước 7 — Tier 2 tự viết. Mỗi file test 4 cases:
1. ADMIN checkout success + ActionLog CHECKOUT
2. EMPLOYEE bị block FORBIDDEN
3. Checkout asset status = deployed → INVALID_STATE
4. Checkout không tồn tại → NOT_FOUND

---

### BƯỚC 9: Tương tự cho license (`tests/integration/license.*.test.ts`)

Pattern tương tự — Tier 2 tự viết.

---

## PHẦN 3: RACE-CONDITION TEST (E-4)

### BƯỚC 10: Tạo `tests/integration/asset.race.test.ts`

**File mới.** ~80 dòng.

```typescript
/**
 * Race-condition test: 2 concurrent checkouts cùng 1 asset.
 *
 * Phase 1 hiện tại dùng app-level lock (in-memory Map). Test này verify:
 *   - 2 requests overlap (cùng 1 khung thời gian)
 *   - Chỉ 1 pass, 1 throw LockedError
 *
 * Phase 3 sẽ chuyển sang Postgres advisory lock — khi đó test vẫn pass
 * (Postgres advisory lock mạnh hơn in-memory lock).
 */
import { checkoutAssetCmd } from '@/app/actions/asset'
import { getPrisma } from '../setup/pglite-setup'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))
const { getServerSession } = jest.requireMock('next-auth') as { getServerSession: jest.Mock }

describe('Race condition: 2 concurrent checkouts', () => {
  test('chỉ 1 pass, 1 bị block', async () => {
    const prisma = await getPrisma()
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    const employee = await prisma.user.findFirst({ where: { role: 'EMPLOYEE' } })
    const category = await prisma.category.create({
      data: { name: 'Laptop', companyId: (await prisma.company.findFirst())!.id },
    })

    // Seed asset ở status deployable
    const asset = await prisma.asset.create({
      data: {
        assetTag: 'RACE-001',
        name: 'Race test asset',
        categoryId: category.id,
        statusId: 'status-deployable',
      },
    })

    getServerSession.mockResolvedValue({
      user: { id: admin!.id, role: 'ADMIN', firstName: 'A', lastName: null, email: 'a@b.com' },
    })

    // Fire 2 checkouts song song
    const [result1, result2] = await Promise.allSettled([
      checkoutAssetCmd({
        assetId: asset.id,
        targetUserId: admin!.id,
        notes: 'Request 1',
      }),
      checkoutAssetCmd({
        assetId: asset.id,
        targetUserId: employee!.id,
        notes: 'Request 2',
      }),
    ])

    const successes = [result1, result2].filter(r => r.status === 'fulfilled' && r.value.ok)
    const failures = [result1, result2].filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.ok))

    // Chỉ 1 pass
    expect(successes).toHaveLength(1)
    // 1 fail
    expect(failures).toHaveLength(1)

    // Verify DB: asset được assign đúng 1 lần (assignedUserId)
    const finalAsset = await prisma.asset.findUnique({ where: { id: asset.id } })
    expect(finalAsset!.assignedUserId).not.toBeNull()
    // ActionLog chỉ có 1 entry CHECKOUT
    const logs = await prisma.actionLog.findMany({ where: { itemId: asset.id, actionType: 'CHECKOUT' } })
    expect(logs).toHaveLength(1)
  })
})
```

**Verify:**

```bash
npx jest tests/integration/asset.race.test.ts
# Expected: 1 test PASS
```

**Lưu ý:** Nếu test fail (2 pass), có nghĩa `withRowLock` KHÔNG effective → bug nghiêm trọng, escalate ngay.

---

## PHẦN 4: COMPONENT TESTS (E-5)

### BƯỚC 11: Tạo `tests/components/RoleGate.test.tsx`

**File mới.** ~50 dòng.

```typescript
/**
 * Component test cho RoleGate — verify ẩn/hiện children theo role.
 *
 * Mock useSession từ next-auth/react.
 */
import { render, screen } from '@testing-library/react'
import RoleGate from '@/components/RoleGate'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

const { useSession } = jest.requireMock('next-auth/react') as { useSession: jest.Mock }

describe('RoleGate', () => {
  test('render children khi role match', () => {
    useSession.mockReturnValue({
      data: { user: { id: 'u1', role: 'ADMIN', firstName: 'A', lastName: null, email: 'a@b.com' } },
      status: 'authenticated',
    })

    render(
      <RoleGate allowedRoles={['ADMIN']}>
        <button>Admin only button</button>
      </RoleGate>
    )

    expect(screen.getByText('Admin only button')).toBeInTheDocument()
  })

  test('render fallback khi role không match', () => {
    useSession.mockReturnValue({
      data: { user: { id: 'u2', role: 'EMPLOYEE', firstName: 'E', lastName: null, email: 'e@f.com' } },
      status: 'authenticated',
    })

    render(
      <RoleGate allowedRoles={['ADMIN']} fallback={<span>Not allowed</span>}>
        <button>Admin only button</button>
      </RoleGate>
    )

    expect(screen.queryByText('Admin only button')).toBeNull()
    expect(screen.getByText('Not allowed')).toBeInTheDocument()
  })

  test('render fallback khi session = null (loading)', () => {
    useSession.mockReturnValue({ data: null, status: 'loading' })

    render(
      <RoleGate allowedRoles={['ADMIN']}>
        <button>Hidden during loading</button>
      </RoleGate>
    )

    expect(screen.queryByText('Hidden during loading')).toBeNull()
  })
})
```

**Verify:**

```bash
npx jest tests/components/RoleGate.test.tsx
# Expected: 3 tests PASS
```

---

### BƯỚC 12: Tương tự cho Toast, Modal

Pattern tương tự Bước 11 — Tier 2 tự viết. Mỗi file 3-5 tests.

---

## PHẦN 5: E2E TESTS VỚI PLAYWRIGHT (E-6)

### BƯỚC 13: Tạo `playwright.config.ts`

**File mới.** ~40 dòng.

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Start Next.js dev server trước khi chạy test
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
})
```

---

### BƯỚC 14: Tạo `tests/e2e/login.spec.ts`

**File mới.** ~50 dòng.

```typescript
import { test, expect } from '@playwright/test'

test.describe('Login flow', () => {
  test('ADMIN login thành công → redirect về /', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[name="email"]', 'admin@congty.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Đợi redirect
    await page.waitForURL('/')

    // Verify dashboard hiển thị
    await expect(page.locator('h2')).toContainText('Chào mừng')
    // Verify Header có role badge ADMIN
    await expect(page.locator('[data-testid="role-badge"]')).toContainText('ADMIN')
  })

  test('Sai password → hiển thị error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@congty.com')
    await page.fill('input[name="password"]', 'wrong-password')
    await page.click('button[type="submit"]')

    // Verify error toast/message
    await expect(page.locator('[role="alert"]')).toContainText(/sai|mật khẩu|invalid/i)
  })

  test('Anonymous truy cập /assets → redirect /login', async ({ page }) => {
    await page.goto('/assets')
    await page.waitForURL(/\/login/)
    expect(page.url()).toContain('callbackUrl=%2Fassets')
  })
})
```

---

### BƯỚC 15: Tạo `tests/e2e/asset-checkout.spec.ts`

**File mới.** ~80 dòng.

```typescript
import { test, expect } from '@playwright/test'

test.describe('Asset checkout flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@congty.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('ADMIN checkout asset thành công', async ({ page }) => {
    await page.goto('/assets')

    // Click nút "Cấp phát" trên asset đầu tiên
    await page.locator('[data-testid="checkout-btn"]').first().click()

    // Modal mở
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // Chọn target User
    await page.locator('select[name="targetUserId"]').selectOption({ index: 1 })

    // Submit
    await page.click('button:has-text("Xác nhận cấp phát")')

    // Toast success
    await expect(page.locator('[role="alert"]')).toContainText(/thành công/i)

    // Modal đóng
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })
})
```

---

### BƯỚC 16: Tạo `tests/e2e/rbac-403.spec.ts`

**File mới.** ~50 dòng.

```typescript
import { test, expect } from '@playwright/test'

test.describe('RBAC E2E', () => {
  test('EMPLOYEE KHÔNG thấy nút checkout', async ({ page }) => {
    // Login as employee
    await page.goto('/login')
    await page.fill('input[name="email"]', 'nhanvien@congty.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // Visit /assets
    await page.goto('/assets')

    // Verify KHÔNG có nút checkout
    await expect(page.locator('[data-testid="checkout-btn"]')).toHaveCount(0)

    // Verify KHÔNG có link Settings
    await expect(page.locator('a[href="/settings"]')).toHaveCount(0)
  })

  test('EMPLOYEE cố POST checkoutAssetCmd qua DevTools API → 403', async ({ page, request }) => {
    // Login as employee
    await page.goto('/login')
    await page.fill('input[name="email"]', 'nhanvien@congty.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    // Cố POST đến server action endpoint — should return error
    const cookies = await page.context().cookies()
    const response = await request.post('/', {
      headers: {
        'next-action': 'fake-action-id',  // giả lập server action
        cookie: cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
      data: { assetId: 'fake', targetUserId: 'fake' },
    })

    // Verify không 200 OK
    expect(response.status()).toBeGreaterThanOrEqual(400)
  })
})
```

**Verify:**

```bash
# Chạy Playwright (cần dev server chạy)
npm run dev &
npx playwright test tests/e2e/login.spec.ts
# Expected: 3 tests PASS

npx playwright test tests/e2e/asset-checkout.spec.ts
# Expected: 1 test PASS

npx playwright test tests/e2e/rbac-403.spec.ts
# Expected: 2 tests PASS
```

---

## PHẦN 6: BONUS (E-7 → E-10) — optional

### BƯỚC 17: Tạo `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Unit + Integration tests
        run: npx jest --coverage --maxWorkers=2
        env:
          CI: true

      - name: Upload coverage
        if: github.event_name == 'pull_request'
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npx playwright install --with-deps chromium

      - name: Build app
        run: npm run build
        env:
          NEXT_TELEMETRY_DISABLED: 1

      - name: Run E2E tests
        run: npx playwright test
        env:
          CI: true
```

**Verify:**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions for unit + E2E tests"
git push
# Check GitHub Actions tab — workflow chạy xanh
```

---

## BƯỚC 18: Final verify

```bash
cd "D:\IT-management"

# 1. tsc clean
npx tsc --noEmit 2>&1 | tail -10
# Expected: 0 errors

# 2. Jest all suites
npx jest --silent 2>&1 | tail -10
# Expected: 13+ suites PASS, 100+ tests PASS

# 3. Coverage report
npx jest --coverage 2>&1 | tail -25
# Expected: src/lib/commands/** > 90%, src/app/actions/** > 80%, src/components/{RoleGate,Toast,Modal}.tsx > 80%

# 4. Playwright E2E
npx playwright test 2>&1 | tail -10
# Expected: 10+ tests PASS

# 5. Build
npm run build 2>&1 | tail -5
# Expected: ✓ Compiled successfully
```

**Nếu tất cả PASS → Epic E PASS.**

---

## Phụ lục A: File KHÔNG patch

| File | Lý do |
|------|-------|
| `prisma/schema.prisma` | A1 đã đúng — PGlite dùng schema này |
| `prisma/seed.ts` | Test dùng `seedMinimal()` riêng |
| `src/lib/commands/*.ts` | Epic B đã có unit tests — integration test bổ sung |
| `src/lib/locking.ts` | Epic B đã có unit tests — race-condition test bổ sung |
| `src/lib/errors.ts` | Epic B đã test |
| `src/lib/auth-guard.ts` | Epic C+1 đã test |
| `src/lib/rate-limit.ts` | Epic D đã test |
| `src/app/actions/*.ts` | Test target — KHÔNG sửa code |
| `src/components/{RoleGate,Toast,Modal}.tsx` | Test target — KHÔNG sửa code |
| `src/proxy.ts` / `src/middleware.ts` | Test qua E2E |
| `src/lib/prisma.ts` | Có thể cần sửa nhỏ để inject PGlite — Tier 2 tự quyết |

---

## Phụ lục B: Lý do thiết kế chính

### B.1 Tại sao PGlite thay vì Postgres thật?

| PGlite | Postgres thật (Neon/Docker) |
|---|---|
| In-memory, chạy trong Node process | Cần network/Docker/CI infra |
| Schema migrate sync với prisma thật | Có thể drift |
| Tốc độ: 50ms/test | 200-500ms/test (network) |
| Chạy được trên free CI tier | Cần paid tier |

Phase 3 (khi có customer thật) → chuyển sang Neon + Docker để test realistic hơn.

### B.2 Tại sao Playwright thay vì Cypress?

| Playwright | Cypress |
|---|---|
| Multi-browser (Chromium, Firefox, WebKit) | Chỉ Chromium + Firefox |
| Auto-wait (không cần `cy.wait`) | Phải `cy.wait` manual |
| Tốt parallel | Khó parallel |
| Trace viewer built-in | Dashboard paid |
| Microsoft maintain, open source | Cypress company |

### B.3 Tại sao cần race-condition test?

Epic B đã note: app-level lock chỉ Phase 1 — KHÔNG thay thế được Postgres advisory lock. Nhưng test này vẫn valuable vì:
- Nếu `withRowLock` bị regress → bug rõ ràng
- Khi Phase 3 chuyển sang Postgres advisory lock → test vẫn pass
- Có regression test → refactor an toàn hơn

### B.4 Tại sao E2E test KHÔNG touch DB trực tiếp?

E2E phải verify flow user thật:
- Click button → server action → DB update → UI refresh

Nếu E2E touch DB trực tiếp → cheat, không phản ánh real flow.

---

## Phụ lục C: Common pitfalls

### C.1 PGlite không apply được schema

Triệu chứng: `relation "User" does not exist`.

**Fix:**
- Verify `prisma migrate diff --script` chạy đúng
- Phase 1 dùng Prisma 7 + `prisma migrate diff` — có thể cần flag khác. Tier 2 verify.

### C.2 E2E test fail do `data-testid` không tồn tại

Triệu chứng: `TimeoutError: locator('[data-testid="checkout-btn"]') not found`.

**Fix:** Tier 2 cần thêm `data-testid` vào Epic D components:
- `<button data-testid="checkout-btn">Cấp phát</button>`
- `<a data-testid="settings-link" href="/settings">Cài đặt</a>`
- `<span data-testid="role-badge">{role}</span>`

→ Bước 17 Epic E **PHẢI thêm `data-testid`** vào Epic D components. Có thể là Bonus step trước Bước 14.

### C.3 Playwright timeout

Triệu chứng: `Test timeout exceeded`.

**Fix:**
- Tăng `timeout` trong `playwright.config.ts`: `timeout: 60_000`
- Tăng `webServer.timeout`: `timeout: 120_000`

### C.4 Race-condition test flaky

Triệu chứng: Pass 9/10 lần, fail 1/10 do timing.

**Fix:**
- Verify 2 requests thật sự overlap (dùng `Promise.allSettled`)
- Nếu vẫn flaky → giảm số lượng test parallel, hoặc dùng `setImmediate` để force overlap

---

## Phụ lục D: Effort estimate

| Step | Effort |
|---|---|
| Bước 0: Pre-Audit | 30 phút |
| Bước 1-6: Setup PGlite (E-1) | 1 ngày |
| Bước 7-9: Server action integration tests (E-2, E-3) | 3 ngày |
| Bước 10: Race-condition test (E-4) | 0.5 ngày |
| Bước 11-12: Component tests (E-5) | 1 ngày |
| Bước 13-16: E2E tests (E-6) | 2 ngày |
| Bước 17-18: CI + verify (E-7) | 0.5 ngày |
| **Tổng MVP** | **~8 ngày** |
| Bonus E-8 → E-10 | +2.5 ngày |

---

## Phụ lục E: Sau Epic E xong — phase 2 còn gì?

| Epic | Scope |
|------|-------|
| **F** (Settings page) | 10 sub-pages admin config |
| **G** (Bulk operations) | CSV import/export, bulk checkout |
| **F+1** (Polish) | Loading states, error pages, 404/500 |

→ Sau Epic E, Tier 2 sẽ có ~5 tuần nữa để hoàn thành Phase 2 (E+F+G).

---

**HẾT MSEW-epic-E-test-coverage.md**

Tổng kết: 18 bước, ~25 file (20 mới + 5 sửa), ~3000 dòng test code, effort ~8-10 ngày. MVP test coverage từ 79 unit → 79 unit + 100+ integration + E2E + race-condition. Phase 2 MVP-ready sau epic này.