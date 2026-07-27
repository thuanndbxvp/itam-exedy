# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC C+1 — RBAC (ROLE-BASED ACCESS CONTROL)

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-26
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · B ✅ · C ✅ · C+0.5 (rename proxy.ts) [optional, có thể chạy song song]
**Phạm vi:** Thêm **Role-Based Access Control** cho domain commands — chỉ `ADMIN` mới được gọi `checkoutAssetCmd` / `checkinAssetCmd` / `checkoutLicenseSeatCmd` / `checkinLicenseSeatCmd` / `createAssetCmd` / `createLicenseCmd` / `expireLicenseSeatCmd`
**Phạm vi LOẠI TRỪ:** KHÔNG phân quyền READ (list/show — ai cũng đọc được); KHÔNG tạo role mới (giữ 2 role ADMIN/EMPLOYEE); KHÔNG đụng schema/seed; KHÔNG đổi API signature

---

## 0. Tại sao Epic C+1 tồn tại — Audit code hiện tại

### Tier 1 đã verify trước khi viết MSEW

| Câu hỏi | Finding |
|---|---|
| Schema có Role enum? | ✅ `enum Role { ADMIN, EMPLOYEE }` (prisma/schema.prisma:16-19) |
| NextAuth session có `role`? | ✅ Có (next-auth.d.ts:14, 32) — A2 đã map `role` vào JWT |
| Có check role ở server action? | ❌ **KHÔNG** — `createAsset` / `checkoutAssetCmd` / `createLicense` không check role |
| Có check role ở middleware? | ❌ **KHÔNG** — middleware chỉ check `!!token` |
| Seed có user EMPLOYEE? | ✅ `nhanvien@congty.com` (role: EMPLOYEE) — prisma/seed.ts:221 |
| `Header.tsx` hiển thị role? | ✅ Có (Epic C đã thêm role badge) |

### 3 lỗ hổng RBAC hiện tại

| # | Lỗ hổng | Bằng chứng | Hậu quả |
|---|---------|------------|---------|
| 1 | EMPLOYEE login có thể gọi `checkoutAssetCmd` | `src/app/actions/asset.ts:96-121` không check role | Nhân viên tự cấp tài sản cho chính mình → không kiểm soát |
| 2 | EMPLOYEE login có thể gọi `createAssetCmd` | `src/app/actions/asset.ts:21-65` không check role | Nhân viên tự tạo tài sản → DB polluted |
| 3 | EMPLOYEE login có thể gọi `expireLicenseSeatCmd` | `src/app/actions/license.ts:127-146` không check role | Nhân viên tự đánh dấu license hết hạn → che giấu lạm dụng |

### Threat model

```
Attacker: Nhân viên công ty (authenticated EMPLOYEE)
Attack: Trong khi lướt app, mở DevTools → tab Network → gọi server action POST endpoint → createAssetCmd
Defense: Server action check role từ session → reject nếu không phải ADMIN
```

---

## 1. Quyết định của Planner (trả lời 4 câu hỏi Tier 2 có thể hỏi)

| Q | Câu hỏi | Quyết định | Lý do |
|---|---------|------------|-------|
| **Q1** | Check role ở server action (defense in depth) hay chỉ ở middleware? | **CẢ HAI** (defense in depth) | Middleware có thể miss route mới. Server action check là lớp bảo vệ thứ 2. |
| **Q2** | Throw error hay return `CommandResult<T>` với code `'FORBIDDEN'`? | **Throw `ForbiddenError` extends `DomainError`** | Code chuẩn hóa, server action wrapper `runCommand` đã catch → return `{ ok: false, code: 'FORBIDDEN', ... }`. |
| **Q3** | Helper `requireRole(session, 'ADMIN')` ở đâu? | **`src/lib/auth-guard.ts`** (đã có sẵn) | Tier 2 đã tạo `src/lib/auth-guard.ts` ở Epic C. Thêm `requireRole` ở đây. |
| **Q4** | API signature có đổi không? | **KHÔNG ĐỔI** | Frontend không cần biết RBAC. Error code `'FORBIDDEN'` tự handle ở Epic D (toast). |

---

## 2. Quyết định mới về Role permissions

Phase 1 MVP — bảng phân quyền:

| Action | ADMIN | EMPLOYEE |
|---|---|---|
| **READ** (list, show, dashboard) | ✅ | ✅ |
| `createAsset`, `createLicense` | ✅ | ❌ |
| `checkoutAssetToUser`, `checkoutAssetToLocation` | ✅ | ❌ |
| `checkinAsset` | ✅ | ❌ |
| `checkoutLicenseSeatToUser` | ✅ | ❌ |
| `checkinLicenseSeat` | ✅ | ❌ |
| `expireLicenseSeat` | ✅ | ❌ |
| **CHECKIN riêng cho EMPLOYEE** (tự trả tài sản) | ✅ | ❌ (Phase 2) |

**Phase 2 sẽ có thêm:**
- Self-check-out (EMPLOYEE tự request asset)
- Self-check-in (EMPLOYEE tự trả asset mình đang giữ)
- Approval workflow (admin duyệt request)

---

## 3. Tiêu chí nghiệm thu Epic C+1

### BẮT BUỘC

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| R-1 | `npx tsc --noEmit` **PASS** (0 errors) | Shell |
| R-2 | `npx jest` **PASS** (5 suites, 39+ tests) | Shell |
| R-3 | Test mới: `tests/auth-guard.test.ts` có test `requireRole` cho 4 case | `npx jest tests/auth-guard.test.ts` |
| R-4 | **EMPLOYEE** login → gọi `checkoutAssetCmd` → trả `{ ok: false, code: 'FORBIDDEN' }` và DB KHÔNG đổi | Manual curl + Prisma Studio |
| R-5 | **ADMIN** login → gọi `checkoutAssetCmd` → vẫn hoạt động bình thường | Manual |
| R-6 | Server action check role ở đầu hàm (sau `getServerSession`, trước business logic) | Code review |
| R-7 | Helper `requireRole` đặt ở `src/lib/auth-guard.ts` (cùng file với `isAuthorized`) | Code review |
| R-8 | Header role badge vẫn hoạt động (Epic C đã có) | Manual |

### KHÔNG BẮT BUỘC (Phase 2)

- ~~UI ẩn nút "Cấp phát" với EMPLOYEE~~ → Epic D
- ~~403 page riêng~~ → Epic D
- ~~Audit log riêng cho security events~~ → Epic E+

---

## 4. Files thay đổi

| File | Loại | Số dòng (ước tính) |
|------|------|-------------------|
| `src/lib/auth-guard.ts` | Sửa + thêm | +25 dòng (thêm `requireRole`, `ForbiddenError`) |
| `src/lib/errors.ts` | Sửa + thêm | +15 dòng (thêm `ForbiddenError extends DomainError`) |
| `src/app/actions/asset.ts` | Sửa | +8 dòng (4 hàm × 2 dòng check role) |
| `src/app/actions/license.ts` | Sửa | +10 dòng (5 hàm × 2 dòng check role) |
| `tests/auth-guard.test.ts` | Mới | ~60 dòng (test `requireRole` + `ForbiddenError`) |

**Tổng:** 5 file (3 sửa + 2 mới), ~120 dòng code.

---

## 5. Bối cảnh tham chiếu

| Nguồn | Mục đích |
|--------|----------|
| `prisma/schema.prisma` dòng 16-19 | `enum Role { ADMIN, EMPLOYEE }` |
| `src/types/next-auth.d.ts` | `Session.user.role: "ADMIN" \| "EMPLOYEE"` đã có |
| `src/lib/auth.ts` | session callback đã map `role` vào JWT |
| `src/lib/auth-guard.ts` (Epic C) | Có `isAuthorized(token)` — thêm `requireRole` |
| `src/lib/errors.ts` (Epic B) | Có `DomainError` base class — thêm `ForbiddenError` |
| `src/app/actions/asset.ts` (Epic B) | 4 server actions |
| `src/app/actions/license.ts` (Epic B) | 5 server actions (sau rename) |
| `prisma/seed.ts` | User `nhanvien@congty.com` có role EMPLOYEE |

---

## 6. Quy ước (Tier 2 tuân thủ)

1. **Check role ở đầu server action**, sau `getServerSession` + `getActorUserId`, **trước** mọi business logic.
2. **Throw `ForbiddenError`** (không return error object) — pattern thống nhất với `NotFoundError` / `InvalidStateError` Epic B.
3. **`runCommand` wrapper đã có sẵn** ở `src/app/actions/asset.ts:71-88` và `src/app/actions/license.ts:22-39` — bắt `ForbiddenError` → return `{ ok: false, code: 'FORBIDDEN', ... }` tự động.
4. **Helper `requireRole(session, 'ADMIN')` PHẢI async** vì gọi `getServerSession()` bên trong (theo pattern có sẵn).
5. **Header.tsx KHÔNG cần đổi** — role badge đã có từ Epic C.

---

## BƯỚC 0: Pre-Audit

```bash
cd "D:\IT-management"

npx tsc --noEmit 2>&1 | head -10
# Expected: 0 errors

npx jest --silent 2>&1 | tail -5
# Expected: 5 suites PASS, 39+ tests
```

---

## BƯỚC 1: Thêm `ForbiddenError` vào `src/lib/errors.ts`

**File sửa.** Thêm class mới (Phase 1: chỉ 1 class).

```typescript
// Thêm vào src/lib/errors.ts sau LockedError class (khoảng dòng 71):

/**
 * User không có quyền thực hiện action (RBAC).
 * Example: EMPLOYEE cố gọi `checkoutAssetCmd` → throw ForbiddenError.
 *
 * Phase 1: chỉ dùng cho role check (ADMIN-only actions).
 * Phase 2: mở rộng cho resource-level permissions (vd: user chỉ checkin được asset CỦA MÌNH).
 */
export class ForbiddenError extends DomainError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super('FORBIDDEN', message, meta);
    this.name = 'ForbiddenError';
  }
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "errors.ts" || echo "✅ No errors in errors.ts"
```

---

## BƯỚC 2: Thêm `requireRole` vào `src/lib/auth-guard.ts`

**File sửa.** Thêm 2 hàm mới.

```typescript
// Thêm vào src/lib/auth-guard.ts (sau isAuthorized):

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ForbiddenError } from '@/lib/errors';

/**
 * Type alias cho role — sync với src/types/next-auth.d.ts Session.user.role.
 * Phase 1: chỉ 2 role. Phase 2 sẽ mở rộng.
 */
export type Role = 'ADMIN' | 'EMPLOYEE';

/**
 * Check user hiện tại có role cho phép không.
 * Throw ForbiddenError nếu KHÔNG — caller (server action) sẽ catch → return CommandResult.
 *
 * @param allowedRoles - 1 hoặc nhiều role được phép (vd: ['ADMIN'] hoặc ['ADMIN', 'EMPLOYEE'])
 * @throws ForbiddenError nếu session không có hoặc role không match
 *
 * Ví dụ:
 *   await requireRole(['ADMIN'])  // chỉ ADMIN
 *   await requireRole(['ADMIN', 'EMPLOYEE'])  // cả 2
 */
export async function requireRole(allowedRoles: Role[]): Promise<{ id: string; role: Role }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.role) {
    throw new ForbiddenError(
      'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.',
      { allowedRoles }
    );
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new ForbiddenError(
      `Bạn không có quyền thực hiện hành động này. Yêu cầu role: ${allowedRoles.join(' hoặc ')} — Role hiện tại: ${session.user.role}.`,
      { allowedRoles, currentRole: session.user.role, userId: session.user.id }
    );
  }

  return { id: session.user.id, role: session.user.role };
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "auth-guard.ts" || echo "✅ No errors in auth-guard.ts"
```

---

## BƯỚC 3: Sửa `src/app/actions/asset.ts` (thêm check role cho 4 commands)

**File sửa.** Thêm `requireRole(['ADMIN'])` ở đầu 4 server actions.

```typescript
// Thêm import (sau các import hiện có):
import { requireRole } from '@/lib/auth-guard';

// Sửa hàm createAsset — thêm SAU dòng `const actorId = await getActorUserId(...);`:
export async function createAsset(data: { ... }): Promise<CommandResult<{ id: string; assetTag: string }>> {
  return runCommand(async () => {
    if (!data.assetTag?.trim() || !data.name?.trim() || !data.statusId) {
      throw new DomainError('VALIDATION', '...', { ... });
    }

    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    // RBAC: chỉ ADMIN mới được tạo asset
    await requireRole(['ADMIN']);

    // ... existing code (prisma.asset.create, actionLog, revalidatePath)
  }, 'createAsset');
}

// Sửa tương tự cho checkoutAssetCmd, checkinAssetCmd, checkoutAssetToLocationCmd:
// Thêm `await requireRole(['ADMIN']);` ngay sau dòng `const actorId = await getActorUserId(...)` trong mỗi hàm.
```

**Chi tiết từng hàm:**

```typescript
export async function checkoutAssetCmd(params: { ... }): Promise<CommandResult<{ id: string; assetTag: string }>> {
  return runCommand(async () => {
    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    // RBAC: chỉ ADMIN mới được checkout asset cho user
    await requireRole(['ADMIN']);

    const result = await withRowLock('Asset', params.assetId, (tx) =>
      checkoutAssetToUser(tx, { ... })
    );

    revalidatePath('/assets');
    return { id: result.id, assetTag: result.assetTag };
  }, 'checkoutAssetCmd');
}

export async function checkinAssetCmd(params: { ... }): Promise<CommandResult<{ id: string }>> {
  return runCommand(async () => {
    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    // RBAC: chỉ ADMIN mới được thu hồi asset
    await requireRole(['ADMIN']);

    const result = await withRowLock('Asset', params.assetId, (tx) =>
      checkinAsset(tx, { ... })
    );

    revalidatePath('/assets');
    return { id: result.id };
  }, 'checkinAssetCmd');
}

export async function checkoutAssetToLocationCmd(params: { ... }): Promise<CommandResult<{ id: string }>> {
  return runCommand(async () => {
    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    // RBAC: chỉ ADMIN mới được checkout asset cho location
    await requireRole(['ADMIN']);

    const result = await withRowLock('Asset', params.assetId, (tx) =>
      checkoutAssetToLocation(tx, { ... })
    );

    revalidatePath('/assets');
    return { id: result.id };
  }, 'checkoutAssetToLocationCmd');
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "actions/asset.ts" || echo "✅ No errors in actions/asset.ts"
```

---

## BƯỚC 4: Sửa `src/app/actions/license.ts` (thêm check role cho 5 commands)

**File sửa.** Tương tự asset.

```typescript
// Thêm import (sau các import hiện có):
import { requireRole } from '@/lib/auth-guard';

// Sửa createLicense — thêm SAU dòng `const actorId = await getActorUserId(...)`:
export async function createLicense(data: { ... }): Promise<CommandResult<{ id: string; name: string; seatsCount: number }>> {
  return runCommand(async () => {
    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    // RBAC: chỉ ADMIN mới được tạo license
    await requireRole(['ADMIN']);

    const license = await prisma.$transaction((tx) =>
      createLicenseWithSeats(tx, { ... })
    );

    revalidatePath('/licenses');
    return { id: license.id, name: license.name, seatsCount: license.seats.length };
  }, 'createLicense');
}

// Sửa tương tự cho checkoutLicenseSeatCmd, checkinLicenseSeatCmd, expireLicenseSeatCmd:
// Thêm `await requireRole(['ADMIN']);` ở đầu mỗi hàm (sau getActorUserId).
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "actions/license.ts" || echo "✅ No errors in actions/license.ts"
```

---

## BƯỚC 5: Tạo `tests/auth-guard.test.ts` (test `requireRole` + `ForbiddenError`)

**File mới.** ~60 dòng.

Strategy: mock `getServerSession` từ `next-auth` để test các case:

```typescript
/**
 * Test cho src/lib/auth-guard.ts.
 *
 * Test `requireRole` logic — RBAC cho server actions.
 * Mock `getServerSession` từ next-auth/auth để kiểm soát session.user.role.
 */
import { requireRole } from '@/lib/auth-guard';
import { ForbiddenError } from '@/lib/errors';

// Mock next-auth getServerSession
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

const { getServerSession } = jest.requireMock('next-auth') as {
  getServerSession: jest.Mock;
};

describe('requireRole', () => {
  beforeEach(() => {
    getServerSession.mockReset();
  });

  test('throw ForbiddenError khi session = null', async () => {
    getServerSession.mockResolvedValue(null);

    await expect(requireRole(['ADMIN'])).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('throw ForbiddenError khi session.user = null', async () => {
    getServerSession.mockResolvedValue({ user: null });

    await expect(requireRole(['ADMIN'])).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('throw ForbiddenError khi session.user.role = EMPLOYEE, allowedRoles = [ADMIN]', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'u1', role: 'EMPLOYEE', firstName: 'A', lastName: 'B', email: 'a@b.com' },
    });

    await expect(requireRole(['ADMIN'])).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('PASS khi session.user.role = ADMIN, allowedRoles = [ADMIN]', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'u1', role: 'ADMIN', firstName: 'A', lastName: 'B', email: 'a@b.com' },
    });

    const result = await requireRole(['ADMIN']);
    expect(result.id).toBe('u1');
    expect(result.role).toBe('ADMIN');
  });

  test('PASS khi allowedRoles = [ADMIN, EMPLOYEE] và role = EMPLOYEE', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'u2', role: 'EMPLOYEE', firstName: 'C', lastName: 'D', email: 'c@d.com' },
    });

    const result = await requireRole(['ADMIN', 'EMPLOYEE']);
    expect(result.role).toBe('EMPLOYEE');
  });

  test('throw ForbiddenError có code = FORBIDDEN', async () => {
    getServerSession.mockResolvedValue({ user: null });

    try {
      await requireRole(['ADMIN']);
      throw new Error('should not reach');
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenError);
      expect((e as ForbiddenError).code).toBe('FORBIDDEN');
    }
  });

  test('throw ForbiddenError có meta đúng (allowedRoles, currentRole)', async () => {
    getServerSession.mockResolvedValue({
      user: { id: 'u3', role: 'EMPLOYEE', firstName: 'E', lastName: 'F', email: 'e@f.com' },
    });

    try {
      await requireRole(['ADMIN']);
      throw new Error('should not reach');
    } catch (e) {
      const err = e as ForbiddenError;
      expect(err.meta).toMatchObject({
        allowedRoles: ['ADMIN'],
        currentRole: 'EMPLOYEE',
        userId: 'u3',
      });
    }
  });
});
```

**Verify:**

```bash
npx jest tests/auth-guard.test.ts
# Expected: 7 tests PASS
```

---

## BƯỚC 6: Verify toàn diện

```bash
cd "D:\IT-management"

# 1. tsc clean
npx tsc --noEmit 2>&1 | tail -10
# Expected: 0 errors

# 2. Jest all suites
npx jest --silent 2>&1 | tail -10
# Expected: 5 suites PASS, 39+ tests PASS (7 mới + 39 cũ = 46 tests)

# 3. Manual smoke test với EMPLOYEE account
# Tạo script test/tháng hoặc dùng curl:
#   - Login as nhanvien@congty.com
#   - Get session cookie
#   - POST đến /api/... (hoặc gọi server action) với checkoutAssetCmd
#   - Expect: { ok: false, code: 'FORBIDDEN', message: '...' }

# 4. Manual smoke test với ADMIN account
#   - Login as admin@congty.com
#   - GET session
#   - Role badge hiển thị ADMIN
#   - Checkout hoạt động bình thường
```

**Nếu tất cả PASS → Epic C+1 PASS.**

---

## Phụ lục A: File KHÔNG patch

| File | Lý do |
|------|-------|
| `prisma/schema.prisma` | Role enum đã có |
| `prisma/seed.ts` | Admin/Employee seeded đúng |
| `src/middleware.ts` / `src/proxy.ts` | Đã gate route ở Epic C — check role ở action là defense in depth |
| `src/lib/auth.ts` | Session callback đã map role |
| `src/types/next-auth.d.ts` | `Session.user.role` đã có |
| `src/lib/audit.ts` | `getActorUserId` đã đúng |
| `src/lib/commands/*.ts` | Pure command — KHÔNG check role (chỉ check ở wrapper) |
| `src/lib/locking.ts` | Row lock — không liên quan RBAC |
| `src/components/Header.tsx` | Role badge đã có |
| `src/app/login/page.tsx` | Login form không cần đổi |
| `src/app/layout.tsx` | SessionProvider đã có |
| `src/app/page.tsx` (Dashboard) | EPIC D sẽ ẩn nút với EMPLOYEE |
| `src/app/assets/page.tsx` | EPIC D sẽ ẩn nút checkout |
| `src/app/licenses/page.tsx` | EPIC D sẽ ẩn nút checkout seat |

---

## Phụ lục B: Lý do thiết kế chính

### B.1 Tại sao check role ở SERVER ACTION chứ không phải chỉ middleware?

Middleware check `!!token` (Epic C) — chỉ gate authenticated. Nếu chỉ check ở middleware:

| Scenario | Middleware check | Server action check |
|---|---|---|
| `/admin/api/users` (Future) | ❌ Vẫn pass nếu EMPLOYEE | ✅ Block |
| Public API next to private | ❌ Mis-config → bypass | ✅ Block |
| Server action POST từ DevTools | ❌ Middleware không cover | ✅ Block |

→ **Defense in depth**: Middleware (route level) + Server action (action level) = 2 lớp bảo vệ.

### B.2 Tại sao throw `ForbiddenError` thay vì return object?

Pattern thống nhất với `NotFoundError`, `InvalidStateError` Epic B:

```typescript
// Pure command (Epic B):
if (!user.activated) throw new InvalidStateError('User chưa kích hoạt.');

// Server action wrapper (Epic B):
await runCommand(async () => {
  // ... business logic tự throw
}, 'createAsset');
// runCommand catch → return { ok: false, code: 'INVALID_STATE', message: ... }
```

→ RBAC check cũng tuân pattern này: throw ở đầu, wrapper catch → client UI nhận `code: 'FORBIDDEN'`.

### B.3 Tại sao `requireRole` async?

`getServerSession()` là async (NextAuth v4 API). Pattern thống nhất với `getActorUserId` đã có.

### B.4 Tại sao KHÔNG check role ở pure command (`src/lib/commands/`)?

Pure command nhận `actorId` làm param — không có kiến thức về session. Nếu check role ở pure command:

- Cần truyền `actorRole` vào params → API phình to
- Pure command khó test (mock thêm role)
- Pure command có thể bị gọi từ context khác (vd: cron job, API public) → role check ở pure command sẽ sai

→ **Đặt role check ở server action wrapper** (giáp ranh giới giữa HTTP request và business logic).

---

## Phụ lục C: Common pitfalls

### C.1 `getServerSession` mock fail trong Jest

Triệu chứng: `Cannot find module 'next-auth'` hoặc `getServerSession is not a function`.

**Fix:** Mock đúng path. NextAuth v4 export `getServerSession` từ `next-auth/legacy` hoặc `next-auth`. Tier 2 cần verify file `next-auth.d.ts` đang mock đúng path.

Trong MSEW này tôi mock `next-auth` — nếu Tier 2 dùng path khác, sửa lại:

```typescript
jest.mock('next-auth/legacy', () => ({
  getServerSession: jest.fn(),
}));
```

### C.2 Test fail vì `requireRole` import `authOptions` từ `@/lib/auth`

`authOptions` import Prisma — Jest có thể chậm hoặc fail.

**Fix:** Mock `@/lib/auth`:

```typescript
jest.mock('@/lib/auth', () => ({
  authOptions: {}, // mock rỗng
}));
```

### C.3 EMPLOYEE login thật vẫn gọi được action

Triệu chứng: Test pass trong Jest nhưng manual test với EMPLOYEE account thật vẫn thành công.

**Fix:**
1. Verify `requireRole` đã được gọi trong action (search "requireRole" trong file)
2. Verify session cookie có `role: 'EMPLOYEE'` (DevTools → Application → Cookies → next-auth.session-token → decode JWT)
3. Restart dev server để Next.js compile lại

---

## Phụ lục D: Effort estimate

| Step | Effort |
|---|---|
| Bước 0: Pre-Audit | 1 phút |
| Bước 1: Thêm ForbiddenError | 2 phút |
| Bước 2: Thêm requireRole | 3 phút |
| Bước 3: Sửa actions/asset.ts | 5 phút |
| Bước 4: Sửa actions/license.ts | 5 phút |
| Bước 5: Tests auth-guard.test.ts | 10 phút |
| Bước 6: Verify | 5 phút |
| **Tổng** | **~30 phút** |

---

## Phụ lục E: Sau khi Epic C+1 xong — lệnh tiếp theo

Sếp chạy 1 trong 2:

```bash
# Option A: Epic D UI (ẩn nút checkout với EMPLOYEE)
/code epic-D-ui-checkout-flow

# Option B: Epic C+0.5 cleanup (rename middleware.ts → proxy.ts - epic Bonus)
/code epic-C+0.5-cleanup-middleware
```

→ Tôi sẽ xuất MSEW tương ứng sau khi sếp chọn.

---

**HẾT MSEW-epic-C+1-rbac.md**

Tổng kết: 5 file thay đổi (3 sửa + 2 mới), ~120 dòng code, 7 tests mới, defense in depth (middleware + server action).