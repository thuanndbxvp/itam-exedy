# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC B — DOMAIN COMMANDS (CHECKOUT/CHECKIN TRANSACTIONAL)

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-26
**Epic phụ thuộc:** A1 ✅ PASS · A2 ✅ PASS (`tsc --noEmit` exit 0)
**Phạm vi:** Rewrite/refactor **6 file** trong `src/` để đưa checkout/checkin từ "primitive update + log rời" → "transactional command với invariants + audit + counter"
**Phạm vi LOẠI TRỪ:** KHÔNG đụng `prisma/` (đã verified A1); KHÔNG sửa UI form/list/show (để cho Epic D); KHÔNG bật middleware auth (để cho Epic C).

---

## 0. Tại sao Epic B tồn tại — Audit code hiện tại (sau A2)

Tier 1 đã đọc code A2 hiện tại và phát hiện **5 lỗ hổng nghiêm trọng** chưa ai giải:

| # | Lỗ hổng | Bằng chứng | Hậu quả | Invariant bị vi phạm |
|---|---------|------------|---------|----------------------|
| 1 | `checkoutAsset` KHÔNG có `prisma.$transaction` — `update asset` xong mới `create actionLog` | `src/app/actions/asset.ts:51-69` | Nếu `actionLog.create` fail (FK Restrict, network, DB timeout) → asset đã assign nhưng log không ghi → audit gap | #5 (audit toàn bộ hành động) |
| 2 | `checkoutAsset` không check `status.deployable` trước khi assign | `src/app/actions/asset.ts:51-58` | Admin có thể cấp phát asset "Báo hỏng" cho user → tài sản hỏng vào tay nhân viên | #1 (status meta-type là bắt buộc) |
| 3 | `checkoutAsset` không tăng `checkoutCounter` / cập nhật `lastCheckout` | `src/app/actions/asset.ts:51-58` | Counter lệch → báo cáo "đã cấp bao nhiêu lần" sai, `Asset.lastCheckout` null mãi | (Snipe-IT business rule) |
| 4 | `checkoutAsset` KHÔNG dùng row-level lock → 2 admin race condition | `src/app/actions/asset.ts:51` | Admin A và Admin B cùng checkout 1 asset → conflict không phát hiện (cùng SELECT, cùng UPDATE, ai update sau thắng — log chỉ ghi 1 record) | Snipe-IT INV-3 |
| 5 | `License` chưa có `checkoutLicenseSeat` / `checkinLicenseSeat` commands | (chưa tồn tại) | Giấy phép phần mềm không thể assign cho user/asset | #4 (license seat assignment invariant) |

→ **Epic B là MUST, không phải nice-to-have.** Không có B thì MVP "chạy được" nhưng không đáng tin (audit gap, race condition, có thể cấp asset hỏng cho user).

---

## 1. Quyết định của Planner (trả lời 4 câu hỏi Tier 2 có thể hỏi)

| Q | Câu hỏi | Quyết định | Lý do |
|---|---------|------------|-------|
| **Q1** | Dùng Prisma `$transaction` (interactive) hay `prisma.$transaction([...])` (batch)? | **Interactive transaction `$transaction(async tx => {...})`** | Cần SELECT FOR UPDATE + check invariant + UPDATE + CREATE log trong **cùng 1 transaction** → chỉ interactive mới làm được. Batch không hỗ trợ row-level lock. |
| **Q2** | Dùng `await tx.$queryRaw\`SELECT ... FOR UPDATE\`` thuần Postgres hay Prisma extension? | **`SELECT ... FOR UPDATE` raw SQL** (chạy trong `tx`) | Prisma 7 KHÔNG có API first-class cho `lockForUpdate` — phải raw. Bọc trong `try/catch`, nếu lock fail → throw 409 Conflict. Tier 2 dùng `Prisma.sql\`...\`` template tag để chống SQL injection (không có user input trong WHERE id = ?, nên an toàn). |
| **Q3** | Có nên tạo abstraction `CommandBus`/`CommandHandler` cho checkout/checkin? | **KHÔNG — để raw function ở Phase 1** | MVP chỉ có 4 commands (checkoutAsset, checkinAsset, checkoutLicenseSeat, checkinLicenseSeat). Pattern abstraction chỉ có lợi từ 8+ commands. Epic D (UI polish) sẽ quyết định có cần CommandBus không. |
| **Q4** | `expectedCheckin` set khi nào? Auto-compute từ `warrantyMonths` hay form bắt buộc? | **Optional — form cấp phát cho nhập, null OK** | Snipe-IT cho phép null. Đơn giản hơn: chỉ accept `expectedCheckin?: string \| null` ở `checkoutAsset` signature, nếu null thì `null`. Sau Epic D sẽ có UI date picker. |

---

## 2. Tiêu chí nghiệm thu Epic B

### BẮT BUỘC (Acceptance Criteria)

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| B-1 | `npx tsc --noEmit` **PASS** (exit 0, 0 errors) | Shell |
| B-2 | `npx tsx scripts/test-checkout.ts` (script Tier 2 tự viết) chạy thành công — test transaction rollback khi invariant fail | Shell |
| B-3 | Manual test via DevTools console: gọi `checkoutAsset(invalid-status-asset, userId)` → trả error, KHÔNG có row nào được update trong DB | Verify bằng Prisma Studio |
| B-4 | `prisma.actionLog` sau 2 lần checkout thật của 2 user khác nhau trên 1 asset có 2 row với `targetType='USER'`, `targetId` đúng user id | SQL query |
| B-5 | `prisma.asset.checkoutCounter` tăng đúng số lần checkout | SQL query |

### KHÔNG BẮT BUỘC (cho Epic B — sẽ làm ở epic sau)

- ~~Test concurrent checkout với 2 curl song song~~ → Làm ở Epic E (Test epic)
- ~~Migration UI để nhập `expectedCheckin`~~ → Epic D (UI polish)
- ~~License `expirationDate` / `terminationDate` validation khi checkout~~ → Epic B+1 (License lifecycle)

---

## 3. Files thay đổi

| File | Loại | Số dòng (ước tính) |
|------|------|-------------------|
| `src/app/actions/asset.ts` | Rewrite | ~200 dòng (3 commands transactional) |
| `src/app/actions/license.ts` | Rewrite + mở rộng | ~280 dòng (4 commands: createLicense + checkoutLicenseSeat + checkinLicenseSeat + audit) |
| `src/lib/errors.ts` (MỚI) | New | ~80 dòng (custom error classes cho Conflict/InvalidState/NotFound) |
| `src/lib/locking.ts` (MỚI) | New | ~50 dòng (helper `withAssetLock(tx, assetId, fn)`) |
| `src/lib/commands/asset.ts` (MỚI) | New | ~250 dòng (logic thuần, dễ unit-test; chỉ export pure functions) |
| `src/lib/commands/license.ts` (MỚI) | New | ~200 dòng (logic thuần, dễ unit-test) |
| `scripts/test-checkout.ts` (MỚI) | New (manual test) | ~120 dòng (Tier 2 tự chạy để verify B-2/B-3) |

**Tổng:** 6 file sửa/thêm mới + 1 file test, không quá 1200 dòng.

---

## 4. Bối cảnh tham chiếu

| Nguồn | Mục đích |
|--------|----------|
| `docs/plan/PLAN-CLONE-FROM-SNIPEIT.md` §4.2 (Epic B) | Quyết định gốc: "checkout/checkin commands transactional" |
| `docs/plan/PLAN-epic-A-schema.md` | Schema 14 model + enum + CHECK constraint (A1 verified PASS) |
| `prisma/schema.prisma` | Ground truth — đặc biệt chú ý `Asset.checkoutCounter/checkinCounter/lastCheckout/lastCheckin`, `StatusLabel.deployable/pending/archived`, `LicenseSeat.assignedUserId/assignedAssetId`, `Asset.assignedUserId/assignedLocationId/assignedAssetId` + CHECK constraint |
| `prisma/seed.ts` | Đã có `lap001` (status Deployable) + `lap002` (status Deployable) + 5 LicenseSeats của Office 365 — DÙNG ĐỂ TEST |
| `src/lib/audit.ts` (A2) | Helper `getActorUserId()` đã có sẵn — TÁI SỬ DỤNG |
| `src/app/actions/asset.ts` (A2) | Code hiện tại — SẼ REWRITE |
| `src/app/actions/license.ts` (A2) | Code hiện tại — SẼ REWRITE |

---

## 5. Quy ước/Convention chung (Tier 2 BẮT BUỘC tuân thủ)

1. **Mọi command phải trả `Promise<T>` với `T = Entity`** (không throw raw error ra Client Component). Server action sẽ bọc `try { return await cmd() } catch (e) { if (e instanceof XxxError) return { ok: false, code: e.code, message: e.message }; return { ok: false, code: 'UNKNOWN', message: ... } }`.
2. **Custom error class** ở `src/lib/errors.ts`:
   - `NotFoundError extends Error { code = 'NOT_FOUND' }`
   - `InvalidStateError extends Error { code = 'INVALID_STATE' }` (vd: asset không deployable)
   - `ConflictError extends Error { code = 'CONFLICT' }` (vd: row lock fail)
3. **Tất cả server action 'use server' PHẢI giữ `'use server'` directive ở đầu file**. Tier 2 KHÔNG tách file thành 2 phần (server-action wrapper + pure-command) nếu không cần — A2 đã có pattern `actions/asset.ts` gọi `lib/audit.ts` import thẳng, cứ theo pattern đó.
4. **Pure-command ở `src/lib/commands/*.ts`**: nhận `tx: Prisma.TransactionClient` làm tham số đầu tiên (KHÔNG import `prisma` instance toàn cục). Caller (server action) sẽ mở transaction và truyền `tx` xuống.
5. **Mọi command PHẢI log ActionLog** (kể cả khi fail thì log ghi `actionType: AUDIT` với `notes: "FAILED: ..."` — nhưng bằng cách nào? → Phase 2. Hiện tại nếu fail giữa chừng thì transaction rollback hết → không cần log fail riêng).
6. **`revalidatePath`** theo đúng entity: `revalidatePath('/assets')` cho asset commands, `revalidatePath('/licenses')` cho license commands.

---

## BƯỚC 0: Pre-Audit (Tier 2 BẮT BUỘC chạy đầu tiên)

```bash
cd "D:\IT-management"
npx tsc --noEmit 2>&1 | head -50
```

**Expected:** PASS (0 errors). Epic A2 đã chứng minh điều này.

---

## BƯỚC 1: Tạo `src/lib/errors.ts` (custom error classes)

**File mới.** 80 dòng. Tại sao cần: server action cần trả error code cho client UI (Epic D sẽ dùng) thay vì throw string. Custom class giúp discriminate union type ở TypeScript.

```typescript
/**
 * Custom error classes cho domain commands.
 * Phase 1: giữ 1 file nhỏ, KHÔNG dùng thư viện ngoài (errors, http-errors, etc.).
 * Phase 2 (nếu cần REST API cho mobile) sẽ map sang HTTP status code.
 */

export class DomainError extends Error {
  readonly code: string;
  readonly meta?: Record<string, unknown>;

  constructor(code: string, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.meta = meta;
  }
}

export class NotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super('NOT_FOUND', `${entityName} với id "${id}" không tồn tại`, { entityName, id });
    this.name = 'NotFoundError';
  }
}

export class InvalidStateError extends DomainError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super('INVALID_STATE', message, meta);
    this.name = 'InvalidStateError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string, meta?: Record<string, unknown>) {
    super('CONFLICT', message, meta);
    this.name = 'ConflictError';
  }
}

/**
 * Union type guard cho client component ép kiểu (Epic D sẽ dùng).
 */
export type CommandResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "errors.ts" || echo "✅ No errors in errors.ts"
```

---

## BƯỚC 2: Tạo `src/lib/locking.ts` (row-level lock helper)

**File mới.** 50 dòng. Tại sao cần: ẩn `Prisma.sql\`SELECT ... FOR UPDATE\`` + $queryRaw syntax sau 1 helper type-safe.

```typescript
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { ConflictError } from './errors';

/**
 * Helper chạy 1 callback trong transaction có row-level lock.
 *
 * @param entityName - 'Asset' | 'LicenseSeat' — dùng để viết SQL `SELECT ... FOR UPDATE FROM "Asset"`
 * @param id - id của row cần lock
 * @param fn - async callback nhận `tx` và trả về result
 * @returns result của callback
 *
 * Lưu ý:
 * - Postgres `SELECT ... FOR UPDATE` block các transaction khác cũng SELECT FOR UPDATE row đó
 *   → ngăn race condition khi 2 admin cùng checkout 1 asset.
 * - Lock chỉ giải phóng khi transaction COMMIT hoặc ROLLBACK.
 * - Nếu lock timeout (>2s) → Prisma throw P2034 (transaction conflict) — bọc lại thành ConflictError.
 *
 * Ví dụ:
 *   await withRowLock('Asset', assetId, async (tx) => {
 *     const asset = await tx.asset.findUnique({ where: { id: assetId } });
 *     return tx.asset.update({ where: { id: assetId }, data: { assignedUserId } });
 *   });
 */
export async function withRowLock<T>(
  entityName: 'Asset' | 'LicenseSeat',
  id: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      // SELECT FOR UPDATE — Postgres sẽ lock row này cho tới khi transaction kết thúc.
      // Dùng Prisma.sql template tag để chống injection (id là String do cuid(), an toàn).
      const result = await tx.$queryRaw(Prisma.sql`
        SELECT id FROM ${Prisma.raw(`"${entityName}"`)}
        WHERE id = ${id}
        FOR UPDATE
      `);

      // Defensive: nếu row không tồn tại → trả null để caller throw NotFoundError
      if (Array.isArray(result) && result.length === 0) {
        // KHÔNG throw trong transaction — chỉ return null, caller sẽ kiểm tra.
        return fn(tx).then((data) => {
          // Edge case: row không tồn tại nhưng caller vẫn gọi tiếp → mark bằng cách throw sau khi tx đóng
          // Tuy nhiên để code đơn giản, caller PHẢI tự check existence trước khi call withRowLock
          return data;
        });
      }

      return fn(tx);
    });
  } catch (e: unknown) {
    // Prisma P2034 = WriteConflict/TransactionConflict (lock timeout)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2034') {
      throw new ConflictError(
        'Không thể khóa tài nguyên — đang có thao tác khác. Vui lòng thử lại sau vài giây.',
        { entityName, id }
      );
    }
    throw e;
  }
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "locking.ts" || echo "✅ No errors in locking.ts"
```

**Expected:** Tier 2 có thể gặp 1-2 warning về cách dùng `Prisma.raw` — chấp nhận được vì `entityName` hardcoded từ function signature, không phải user input.

---

## BƯỚC 3: Tạo `src/lib/commands/asset.ts` (pure command logic)

**File mới.** ~250 dòng. Tại sao tách riêng: 100% pure functions, không có `'use server'`, dễ unit-test (Epic E sẽ viết Jest test).

```typescript
import { Prisma } from '@prisma/client';
import { NotFoundError, InvalidStateError } from '../errors';

type Tx = Prisma.TransactionClient;

/**
 * Checkout 1 Asset cho 1 User.
 * Invariants áp dụng:
 *  - #1: Status phải deployable (archived/pending/broken → refuse)
 *  - #2: Asset hiện KHÔNG được assign cho 1 target khác (đã có assignedUserId/LocationId/AssetId → refuse)
 *  - #3: tăng Asset.checkoutCounter và cập nhật lastCheckout
 *  - Audit: ghi ActionLog CHECKOUT với targetType=USER
 *
 * @throws NotFoundError nếu asset hoặc user không tồn tại
 * @throws InvalidStateError nếu asset không deployable / đã được gán
 */
export async function checkoutAssetToUser(
  tx: Tx,
  params: {
    assetId: string;
    targetUserId: string;
    actorId: string;
    notes?: string;
    expectedCheckin?: Date | null;
  }
) {
  const { assetId, targetUserId, actorId, notes, expectedCheckin } = params;

  // Lock đã được withRowLock set — giờ đọc row fresh
  const asset = await tx.asset.findUnique({
    where: { id: assetId },
    include: { status: true },
  });
  if (!asset) throw new NotFoundError('Asset', assetId);

  // Invariant #2: Asset hiện đang được gán → không checkout được
  if (asset.assignedUserId || asset.assignedLocationId || asset.assignedAssetId) {
    throw new InvalidStateError(
      `Asset "${asset.assetTag}" đang được gán cho target khác. Hãy thu hồi trước khi cấp phát lại.`,
      { assetTag: asset.assetTag }
    );
  }

  // Invariant #1: Status phải deployable
  if (!asset.status.deployable || asset.status.archived || asset.status.pending) {
    throw new InvalidStateError(
      `Asset "${asset.assetTag}" có trạng thái "${asset.status.name}" — không thể cấp phát. ` +
        `Chỉ asset có trạng thái "Sẵn sàng cấp phát" (deployable=true) mới được cấp.`,
      { assetTag: asset.assetTag, statusName: asset.status.name }
    );
  }

  // Validate target user tồn tại + activated
  const user = await tx.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, activated: true, firstName: true, lastName: true },
  });
  if (!user) throw new NotFoundError('User', targetUserId);
  if (!user.activated) {
    throw new InvalidStateError(`User "${user.firstName} ${user.lastName ?? ''}" chưa được kích hoạt — không thể cấp tài sản.`);
  }

  // UPDATE asset — set 3 FK (chỉ 1 cái là non-null, 2 cái kia null để CHECK constraint pass)
  const updated = await tx.asset.update({
    where: { id: assetId },
    data: {
      assignedUserId: targetUserId,
      assignedLocationId: null,
      assignedAssetId: null,
      lastCheckout: new Date(),
      expectedCheckin: expectedCheckin ?? null,
      checkoutCounter: { increment: 1 },
    },
    include: { status: true, assignedUser: true },
  });

  // CREATE ActionLog
  await tx.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemType: 'ASSET',
      itemId: assetId,
      targetType: 'USER',
      targetId: targetUserId,
      userId: actorId,
      notes: notes || `Cấp phát asset "${asset.assetTag}" cho user "${user.firstName} ${user.lastName ?? ''}"`,
    },
  });

  return updated;
}

/**
 * Checkin 1 Asset (thu hồi về kho).
 * Invariants:
 *  - Asset PHẢI đang được gán cho 1 target (nếu không → refuse, tránh checkin lung tung)
 *  - Set cả 3 FK về null
 *  - Tăng checkinCounter, cập nhật lastCheckin
 *  - Audit: ActionLog CHECKIN
 */
export async function checkinAsset(
  tx: Tx,
  params: {
    assetId: string;
    actorId: string;
    notes?: string;
  }
) {
  const { assetId, actorId, notes } = params;

  const asset = await tx.asset.findUnique({
    where: { id: assetId },
    include: {
      assignedUser: { select: { firstName: true, lastName: true } },
      assignedLocation: { select: { name: true } },
      assignedAsset: { select: { assetTag: true } },
    },
  });
  if (!asset) throw new NotFoundError('Asset', assetId);

  // PHẢI đang được gán
  const currentAssignee =
    asset.assignedUser
      ? `User "${asset.assignedUser.firstName} ${asset.assignedUser.lastName ?? ''}"`
      : asset.assignedLocation
      ? `Location "${asset.assignedLocation.name}"`
      : asset.assignedAsset
      ? `Asset "${asset.assignedAsset.assetTag}"`
      : null;

  if (!currentAssignee) {
    throw new InvalidStateError(
      `Asset "${asset.assetTag}" hiện không được gán cho ai — không cần thu hồi.`
    );
  }

  // UPDATE
  const updated = await tx.asset.update({
    where: { id: assetId },
    data: {
      assignedUserId: null,
      assignedLocationId: null,
      assignedAssetId: null,
      lastCheckin: new Date(),
      checkinCounter: { increment: 1 },
    },
    include: { status: true },
  });

  // ActionLog
  await tx.actionLog.create({
    data: {
      actionType: 'CHECKIN',
      itemType: 'ASSET',
      itemId: assetId,
      userId: actorId,
      notes: notes || `Thu hồi asset "${asset.assetTag}" từ ${currentAssignee}`,
    },
  });

  return updated;
}

/**
 * Checkout Asset cho Location (thay vì User).
 * Dùng cho case "cấp phát cho phòng ban chung".
 */
export async function checkoutAssetToLocation(
  tx: Tx,
  params: {
    assetId: string;
    targetLocationId: string;
    actorId: string;
    notes?: string;
  }
) {
  const { assetId, targetLocationId, actorId, notes } = params;

  const asset = await tx.asset.findUnique({
    where: { id: assetId },
    include: { status: true },
  });
  if (!asset) throw new NotFoundError('Asset', assetId);
  if (asset.assignedUserId || asset.assignedLocationId || asset.assignedAssetId) {
    throw new InvalidStateError(`Asset "${asset.assetTag}" đang được gán — phải thu hồi trước.`);
  }
  if (!asset.status.deployable || asset.status.archived || asset.status.pending) {
    throw new InvalidStateError(`Asset "${asset.assetTag}" không deployable (status=${asset.status.name}).`);
  }

  const loc = await tx.location.findUnique({ where: { id: targetLocationId } });
  if (!loc) throw new NotFoundError('Location', targetLocationId);

  const updated = await tx.asset.update({
    where: { id: assetId },
    data: {
      assignedLocationId: targetLocationId,
      assignedUserId: null,
      assignedAssetId: null,
      lastCheckout: new Date(),
      checkoutCounter: { increment: 1 },
    },
    include: { status: true, assignedLocation: true },
  });

  await tx.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemType: 'ASSET',
      itemId: assetId,
      targetType: 'LOCATION',
      targetId: targetLocationId,
      userId: actorId,
      notes: notes || `Cấp phát asset "${asset.assetTag}" cho location "${loc.name}"`,
    },
  });

  return updated;
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "commands/asset.ts" || echo "✅ No errors in commands/asset.ts"
```

---

## BƯỚC 4: Tạo `src/lib/commands/license.ts` (pure command logic cho LicenseSeat)

**File mới.** ~200 dòng. Tương tự asset nhưng cho LicenseSeat.

```typescript
import { Prisma } from '@prisma/client';
import { NotFoundError, InvalidStateError } from '../errors';

type Tx = Prisma.TransactionClient;

/**
 * Checkout 1 LicenseSeat cho 1 User.
 * Invariants:
 *  - #4: LicenseSeat chỉ được assign cho User HOẶC Asset (không cả 2 — CHECK constraint)
 *  - License phải còn hạn (expirationDate > now) HOẶC nếu reassignable=true thì OK cả khi expired
 *  - Audit: ActionLog CHECKOUT với itemType=LICENSE_SEAT, targetType=USER
 */
export async function checkoutLicenseSeatToUser(
  tx: Tx,
  params: {
    seatId: string;
    targetUserId: string;
    actorId: string;
    notes?: string;
  }
) {
  const { seatId, targetUserId, actorId, notes } = params;

  const seat = await tx.licenseSeat.findUnique({
    where: { id: seatId },
    include: {
      license: true,
      assignedUser: { select: { firstName: true, lastName: true } },
      assignedAsset: { select: { assetTag: true } },
    },
  });
  if (!seat) throw new NotFoundError('LicenseSeat', seatId);
  if (seat.assignedUserId || seat.assignedAssetId) {
    const current = seat.assignedUser
      ? `user "${seat.assignedUser.firstName} ${seat.assignedUser.lastName ?? ''}"`
      : `asset "${seat.assignedAsset?.assetTag}"`;
    throw new InvalidStateError(`Seat #${seat.id.slice(-6)} đã được gán cho ${current} — thu hồi trước.`);
  }

  // Validate License chưa hết hạn
  if (seat.license.expirationDate && seat.license.expirationDate < new Date() && !seat.license.reassignable) {
    throw new InvalidStateError(
      `License "${seat.license.name}" đã hết hạn và KHÔNG reassignable — không thể cấp seat mới.`
    );
  }

  const user = await tx.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, activated: true, firstName: true, lastName: true },
  });
  if (!user) throw new NotFoundError('User', targetUserId);
  if (!user.activated) {
    throw new InvalidStateError(`User "${user.firstName} ${user.lastName ?? ''}" chưa kích hoạt.`);
  }

  const updated = await tx.licenseSeat.update({
    where: { id: seatId },
    data: {
      assignedUserId: targetUserId,
      assignedAssetId: null,
    },
    include: {
      license: true,
      assignedUser: true,
    },
  });

  await tx.actionLog.create({
    data: {
      actionType: 'CHECKOUT',
      itemType: 'LICENSE_SEAT',
      itemId: seatId,
      targetType: 'USER',
      targetId: targetUserId,
      userId: actorId,
      notes: notes || `Cấp phát LicenseSeat của "${seat.license.name}" cho user "${user.firstName} ${user.lastName ?? ''}"`,
    },
  });

  return updated;
}

/**
 * Checkin LicenseSeat (giải phóng seat về pool).
 * Set cả 2 FK nullable về null.
 */
export async function checkinLicenseSeat(
  tx: Tx,
  params: {
    seatId: string;
    actorId: string;
    notes?: string;
  }
) {
  const { seatId, actorId, notes } = params;

  const seat = await tx.licenseSeat.findUnique({
    where: { id: seatId },
    include: {
      license: true,
      assignedUser: { select: { firstName: true, lastName: true } },
      assignedAsset: { select: { assetTag: true } },
    },
  });
  if (!seat) throw new NotFoundError('LicenseSeat', seatId);

  const currentAssignee = seat.assignedUser
    ? `user "${seat.assignedUser.firstName} ${seat.assignedUser.lastName ?? ''}"`
    : seat.assignedAsset
    ? `asset "${seat.assignedAsset.assetTag}"`
    : null;

  if (!currentAssignee) {
    throw new InvalidStateError(`Seat #${seat.id.slice(-6)} đang trống — không cần thu hồi.`);
  }

  const updated = await tx.licenseSeat.update({
    where: { id: seatId },
    data: {
      assignedUserId: null,
      assignedAssetId: null,
    },
    include: { license: true },
  });

  await tx.actionLog.create({
    data: {
      actionType: 'CHECKIN',
      itemType: 'LICENSE_SEAT',
      itemId: seatId,
      userId: actorId,
      notes: notes || `Thu hồi LicenseSeat (${seat.license.name}) từ ${currentAssignee}`,
    },
  });

  return updated;
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "commands/license.ts" || echo "✅ No errors in commands/license.ts"
```

---

## BƯỚC 5: Rewrite `src/app/actions/asset.ts` (3 commands transactional)

**File rewrite.** ~200 dòng.

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActorUserId } from '@/lib/audit';
import { withRowLock } from '@/lib/locking';
import {
  checkoutAssetToUser,
  checkinAsset,
  checkoutAssetToLocation,
} from '@/lib/commands/asset';
import { DomainError } from '@/lib/errors';
import type { CommandResult } from '@/lib/errors';

/**
 * Server action wrapper cho `checkoutAssetToUser`.
 *
 * Pattern: wrapper mở row-lock + transaction, command thuần xử lý business logic.
 * Catch DomainError → trả về discriminated union để client component dùng (Epic D sẽ render toast).
 */
export async function checkoutAssetCmd(params: {
  assetId: string;
  targetUserId: string;
  notes?: string;
  expectedCheckin?: string; // ISO string từ form; convert sang Date
}): Promise<CommandResult<{ id: string; assetTag: string }>> {
  try {
    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('Asset', params.assetId, (tx) =>
      checkoutAssetToUser(tx, {
        assetId: params.assetId,
        targetUserId: params.targetUserId,
        actorId,
        notes: params.notes,
        expectedCheckin: params.expectedCheckin ? new Date(params.expectedCheckin) : null,
      })
    );

    revalidatePath('/assets');
    return { ok: true, data: { id: result.id, assetTag: result.assetTag } };
  } catch (e) {
    if (e instanceof DomainError) {
      return { ok: false, code: e.code, message: e.message };
    }
    console.error('[checkoutAssetCmd] UNKNOWN ERROR', e);
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi hệ thống không xác định. Vui lòng thử lại.' };
  }
}

export async function checkinAssetCmd(params: {
  assetId: string;
  notes?: string;
}): Promise<CommandResult<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('Asset', params.assetId, (tx) =>
      checkinAsset(tx, {
        assetId: params.assetId,
        actorId,
        notes: params.notes,
      })
    );

    revalidatePath('/assets');
    return { ok: true, data: { id: result.id } };
  } catch (e) {
    if (e instanceof DomainError) {
      return { ok: false, code: e.code, message: e.message };
    }
    console.error('[checkinAssetCmd] UNKNOWN ERROR', e);
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi hệ thống không xác định. Vui lòng thử lại.' };
  }
}

export async function checkoutAssetToLocationCmd(params: {
  assetId: string;
  targetLocationId: string;
  notes?: string;
}): Promise<CommandResult<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('Asset', params.assetId, (tx) =>
      checkoutAssetToLocation(tx, {
        assetId: params.assetId,
        targetLocationId: params.targetLocationId,
        actorId,
        notes: params.notes,
      })
    );

    revalidatePath('/assets');
    return { ok: true, data: { id: result.id } };
  } catch (e) {
    if (e instanceof DomainError) {
      return { ok: false, code: e.code, message: e.message };
    }
    console.error('[checkoutAssetToLocationCmd] UNKNOWN ERROR', e);
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi hệ thống không xác định. Vui lòng thử lại.' };
  }
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "actions/asset.ts" || echo "✅ No errors in actions/asset.ts"
```

---

## BƯỚC 6: Rewrite `src/app/actions/license.ts` (4 commands)

**File rewrite + mở rộng.** ~280 dòng. Giữ `createLicense` từ A2 + thêm 3 commands checkout/checkin seat.

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActorUserId } from '@/lib/audit';
import { withRowLock } from '@/lib/locking';
import { checkoutLicenseSeatToUser, checkinLicenseSeat } from '@/lib/commands/license';
import { DomainError } from '@/lib/errors';
import type { CommandResult } from '@/lib/errors';
import prisma from '@/lib/prisma';

/**
 * Create License + nested seats (GIỮ NGUYÊN từ A2 — đã đúng).
 */
export async function createLicense(data: {
  name: string;
  productKey?: string;
  seatsTotal: number;
}): Promise<CommandResult<{ id: string; name: string; seatsCount: number }>> {
  try {
    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const seatCount = Math.max(1, Math.floor(data.seatsTotal ?? 1));

    const license = await prisma.license.create({
      data: {
        name: data.name,
        productKey: data.productKey ?? null,
        seats: {
          create: Array.from({ length: seatCount }).map(() => ({
            notes: 'Auto-created seat',
          })),
        },
      },
      include: { seats: true },
    });

    await prisma.actionLog.create({
      data: {
        actionType: 'CREATE',
        itemType: 'LICENSE',
        itemId: license.id,
        userId: actorId,
        notes: `Tạo mới bản quyền (${seatCount} seats)`,
      },
    });

    revalidatePath('/licenses');
    return { ok: true, data: { id: license.id, name: license.name, seatsCount: license.seats.length } };
  } catch (e) {
    if (e instanceof DomainError) return { ok: false, code: e.code, message: e.message };
    console.error('[createLicense] UNKNOWN ERROR', e);
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi hệ thống không xác định.' };
  }
}

export async function checkoutLicenseSeatCmd(params: {
  seatId: string;
  targetUserId: string;
  notes?: string;
}): Promise<CommandResult<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('LicenseSeat', params.seatId, (tx) =>
      checkoutLicenseSeatToUser(tx, {
        seatId: params.seatId,
        targetUserId: params.targetUserId,
        actorId,
        notes: params.notes,
      })
    );

    revalidatePath('/licenses');
    return { ok: true, data: { id: result.id } };
  } catch (e) {
    if (e instanceof DomainError) return { ok: false, code: e.code, message: e.message };
    console.error('[checkoutLicenseSeatCmd] UNKNOWN ERROR', e);
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi hệ thống không xác định.' };
  }
}

export async function checkinLicenseSeatCmd(params: {
  seatId: string;
  notes?: string;
}): Promise<CommandResult<{ id: string }>> {
  try {
    const session = await getServerSession(authOptions);
    const actorId = await getActorUserId(session?.user?.id ?? null);

    const result = await withRowLock('LicenseSeat', params.seatId, (tx) =>
      checkinLicenseSeat(tx, {
        seatId: params.seatId,
        actorId,
        notes: params.notes,
      })
    );

    revalidatePath('/licenses');
    return { ok: true, data: { id: result.id } };
  } catch (e) {
    if (e instanceof DomainError) return { ok: false, code: e.code, message: e.message };
    console.error('[checkinLicenseSeatCmd] UNKNOWN ERROR', e);
    return { ok: false, code: 'UNKNOWN', message: 'Lỗi hệ thống không xác định.' };
  }
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "actions/license.ts" || echo "✅ No errors in actions/license.ts"
```

---

## BƯỚC 7: Tạo `scripts/test-checkout.ts` (manual test cho B-2/B-3)

**File mới.** ~120 dòng. Chạy thẳng với `npx tsx scripts/test-checkout.ts`. Script này dùng data đã seed (lap001 = deployable, admin/nhanvien users).

```typescript
/**
 * Manual test cho domain commands Phase 1.
 *
 * Verify:
 *   B-2: Transaction rollback khi invariant fail — assert DB state không thay đổi.
 *   B-3: Invalid status → error, không có row nào update.
 *
 * Chạy: npx tsx scripts/test-checkout.ts
 *
 * Prerequisites: `npx tsx prisma/seed.ts` đã chạy (có lap001, lap002, admin, nhanvien, 5 Office 365 seats).
 */

import { PrismaClient } from '@prisma/client';
import { withRowLock } from '../src/lib/locking';
import { checkoutAssetToUser, checkinAsset } from '../src/lib/commands/asset';

const prisma = new PrismaClient();

async function getTestFixtures() {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@congty.com' } });
  const nhanvien = await prisma.user.findUnique({ where: { email: 'nhanvien@congty.com' } });
  const lap001 = await prisma.asset.findUnique({ where: { assetTag: 'LAP-001' }, include: { status: true } });
  if (!admin || !nhanvien || !lap001) {
    throw new Error('Seed chưa chạy. Chạy `npx tsx prisma/seed.ts` trước.');
  }
  return { admin, nhanvien, lap001 };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function testCheckoutSuccess() {
  console.log('\n--- TEST 1: Checkout thành công ---');
  const { admin, nhanvien, lap001 } = await getTestFixtures();

  // Reset về trạng thái rỗng trước
  await prisma.asset.update({
    where: { id: lap001.id },
    data: { assignedUserId: null, assignedLocationId: null, assignedAssetId: null },
  });

  const result = await withRowLock('Asset', lap001.id, (tx) =>
    checkoutAssetToUser(tx, {
      assetId: lap001.id,
      targetUserId: nhanvien.id,
      actorId: admin.id,
      notes: 'Test checkout',
    })
  );

  assert(result.assignedUserId === nhanvien.id, 'Asset đã được gán cho nhanvien');
  assert(result.checkoutCounter === 1, 'checkoutCounter = 1');
  assert(result.lastCheckout !== null, 'lastCheckout đã được set');

  const log = await prisma.actionLog.findFirst({
    where: { itemId: lap001.id, actionType: 'CHECKOUT' },
    orderBy: { createdAt: 'desc' },
  });
  assert(log !== null, 'ActionLog CHECKOUT đã được ghi');
  assert(log?.targetId === nhanvien.id, 'ActionLog target = nhanvien.id');
}

async function testCheckoutInvalidState() {
  console.log('\n--- TEST 2: Checkout asset đã được gán → InvalidStateError ---');
  const { nhanvien, lap001 } = await getTestFixtures();

  // Setup: lap001 hiện đang gán cho nhanvien (từ TEST 1)
  // → checkout lần nữa phải fail
  let threw = false;
  try {
    await withRowLock('Asset', lap001.id, (tx) =>
      checkoutAssetToUser(tx, {
        assetId: lap001.id,
        targetUserId: nhanvien.id,
        actorId: nhanvien.id,
      })
    );
  } catch (e: unknown) {
    threw = true;
    if (e instanceof Error) {
      console.log(`  Error message: ${e.message}`);
      assert(e.message.includes('đang được gán'), 'Error message đúng');
    }
  }
  assert(threw, 'Đã throw error như mong đợi');

  // Verify: counter KHÔNG tăng (rollback)
  const asset = await prisma.asset.findUnique({ where: { id: lap001.id } });
  assert(asset?.checkoutCounter === 1, 'checkoutCounter vẫn = 1 (rollback OK)');
}

async function testCheckin() {
  console.log('\n--- TEST 3: Checkin thành công ---');
  const { admin, lap001 } = await getTestFixtures();

  const result = await withRowLock('Asset', lap001.id, (tx) =>
    checkinAsset(tx, {
      assetId: lap001.id,
      actorId: admin.id,
      notes: 'Test checkin',
    })
  );

  assert(result.assignedUserId === null, 'Asset đã được giải phóng');
  assert(result.assignedLocationId === null, 'Location FK = null');
  assert(result.assignedAssetId === null, 'Asset FK = null');
  assert(result.checkinCounter === 1, 'checkinCounter = 1');

  const checkinLog = await prisma.actionLog.findFirst({
    where: { itemId: lap001.id, actionType: 'CHECKIN' },
    orderBy: { createdAt: 'desc' },
  });
  assert(checkinLog !== null, 'ActionLog CHECKIN đã được ghi');
}

async function testCheckinEmptyAsset() {
  console.log('\n--- TEST 4: Checkin asset trống → InvalidStateError ---');
  const { admin, lap001 } = await getTestFixtures();

  // lap001 hiện trống (sau TEST 3)
  let threw = false;
  try {
    await withRowLock('Asset', lap001.id, (tx) =>
      checkinAsset(tx, {
        assetId: lap001.id,
        actorId: admin.id,
      })
    );
  } catch {
    threw = true;
  }
  assert(threw, 'Checkin asset trống → throw');
}

async function main() {
  try {
    await testCheckoutSuccess();
    await testCheckoutInvalidState();
    await testCheckin();
    await testCheckinEmptyAsset();
    console.log('\n🎉 Tất cả 4 tests PASS — Epic B invariants đều đúng!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('TEST FAILED:', e);
  process.exit(1);
});
```

**Verify chạy:**

```bash
npx tsx scripts/test-checkout.ts
```

**Expected output:**

```
✅ PASS: Asset đã được gán cho nhanvien
✅ PASS: checkoutCounter = 1
✅ PASS: lastCheckout đã được set
✅ PASS: ActionLog CHECKOUT đã được ghi
✅ PASS: ActionLog target = nhanvien.id
--- TEST 2: Checkout asset đã được gán → InvalidStateError ---
✅ PASS: Error message đúng
✅ PASS: Đã throw error như mong đợi
✅ PASS: checkoutCounter vẫn = 1 (rollback OK)
[... 4 tests PASS ...]
🎉 Tất cả 4 tests PASS — Epic B invariants đều đúng!
```

---

## BƯỚC 8: Final verify

```bash
npx tsc --noEmit 2>&1 | tail -20
```

**Expected:** 0 errors.

Nếu 0 errors → Epic B PASS. Tier 2 báo cáo sếp kèm output test suite.

---

## Phụ lục A: File KHÔNG patch (Tier 2 xác nhận KHÔNG đụng)

| File | Lý do |
|------|-------|
| `prisma/schema.prisma` | A1 đã verified PASS, KHÔNG cần thêm field |
| `prisma/seed.ts` | Đã seed đủ data test |
| `src/lib/prisma.ts` | Adapter PrismaPg đã chuẩn |
| `src/lib/audit.ts` | `getActorUserId()` đã đúng, tái sử dụng |
| `src/lib/auth.ts` | A2 đã đúng |
| `src/types/next-auth.d.ts` | A2 đã đúng |
| `src/app/page.tsx` | Dashboard — Epic D sẽ refine |
| `src/app/assets/page.tsx` | List view — Epic D sẽ thêm nút Checkout |
| `src/app/licenses/page.tsx` | List view — Epic D sẽ thêm nút Checkout Seat |
| `src/app/assets/new/page.tsx`, `src/app/licenses/new/page.tsx` | Form tạo — Epic D sẽ thêm UI chọn target |

---

## Phụ lục B: Lý do thiết kế chính

### B.1 Tại sao tách `commands/` khỏi `actions/`?

| `commands/asset.ts` (pure) | `actions/asset.ts` (server-action wrapper) |
|---------------------------|-------------------------------------------|
| Không có `'use server'` | Có `'use server'` |
| Không gọi `getServerSession()` | Gọi session, get actorId |
| Nhận `tx` làm tham số đầu tiên | Mở transaction + truyền `tx` |
| Không bắt error → throw | Bắt → return `CommandResult` |
| Không gọi `revalidatePath` | Gọi `revalidatePath('/assets')` |
| Unit-testable bằng Jest + mock `tx` | Phải chạy trong Next.js runtime |

→ Tier E (test epic) sẽ viết Jest test cho `commands/` cực nhanh (mock `tx` là xong).

### B.2 Tại sao dùng raw SQL `SELECT ... FOR UPDATE` thay vì Prisma field-level lock?

Prisma 7 KHÔNG có API `prisma.asset.lockForUpdate(id)` first-class. Cách work-around duy nhất là raw `$queryRaw`. Tier 2 dùng `Prisma.sql` template tag → an toàn (chỉ 1 chỗ có string interpolation là `entityName` hardcoded từ TS literal `'Asset' | 'LicenseSeat'` — KHÔNG phải user input).

### B.3 Tại sao bỏ `checkoutAsset` cũ (không có transaction)?

A2 code hiện tại (`src/app/actions/asset.ts:51-69`):

```typescript
const asset = await prisma.asset.update(...)  // (1) update asset OK
await prisma.actionLog.create(...)              // (2) log — NẾU FAIL ở đây → asset đã assign nhưng log KHÔNG có
return asset  // → caller thấy OK, user đã nhận asset nhưng audit trail bị gap
```

Sau Epic B: cả 2 trong cùng 1 transaction → nếu log fail thì asset cũng rollback → state luôn nhất quán.

### B.4 N+1 query không sao ở Phase 1

`commands/asset.ts` có nhiều `findUnique` (asset, user). Phase 1 chỉ 1 lệnh `checkoutAsset` 1 lần → performance OK. Phase 3 nếu batch checkout 100 assets sẽ tối ưu `findUnique({ where: { id: { in: ids } } })`.

---

## Phụ lục C: Sau khi Epic B xong — lệnh tiếp theo

Sếp chạy:

```bash
/code epic-C-auth-middleware
```

→ Tier 1 sẽ xuất MSEW-epic-C-auth-middleware.md: bật NextAuth middleware check session cho `/assets`, `/licenses`, `/admin`.

---

## Phụ lục D: Test concurrency (Tier 2 BONUS — không bắt buộc)

Nếu Tier 2 có thời gian, test 2 admin cùng checkout 1 asset cùng lúc:

```typescript
// scripts/test-concurrent-checkout.ts (OPTIONAL — Tier 2 tự quyết)
const [a, b] = await Promise.all([
  withRowLock('Asset', id, tx => checkoutAssetToUser(tx, { targetUserId: userA.id, ... })),
  withRowLock('Asset', id, tx => checkoutAssetToUser(tx, { targetUserId: userB.id, ... })),
]);
// Expected: 1 trong 2 throw ConflictError, 1 success
```

Phase 2 sẽ viết test đầy đủ + đo thời gian lock acquisition.

---

**HẾT MSEW-epic-B-domain-commands.md**

Tổng kết: 7 file mới/sửa, ~1200 dòng code, 3 commands transactional (asset + license), 4 unit tests manual.
