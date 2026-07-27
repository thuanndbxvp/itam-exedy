import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { LockedError } from './errors';

/**
 * Application-level row-lock (in-memory Map với TTL).
 *
 * Lý do dùng App-level lock thay vì Postgres `SELECT ... FOR UPDATE`:
 * 1. Epic B scale MVP — ít concurrent writes, không cần DB lock overhead.
 * 2. PostgreSQL connection pooler (Neon) có thể giữ session qua nhiều query →
 *    lock Postgres row không giải quyết được race-condition giữa các Node.js process
 *    (vd: dev mode HMR + 2 cold starts).
 * 3. App-level Map chỉ áp dụng CHO CÙNG 1 Node.js process.
 *    → Cảnh báo: nếu scale ra nhiều instance, Epic E+ phải chuyển sang Redis lock.
 *
 * Cơ chế:
 * - `acquire(key)` → set `locks[key] = now` nếu chưa có hoặc đã hết TTL (5s).
 * - `release(key)` → xóa entry. LUÔN chạy trong `finally {}`.
 * - `withLock(key, fn)` → acquire → chạy `fn()` trong Prisma `$transaction`
 *   → release ở finally.
 *
 * Lock chỉ block trong CÙNG process. Cross-process (vd: 2 dev servers) → KHÔNG block
 * → DB transaction vẫn giữ state nhất quán (Postgres serializable).
 */

const LOCK_TTL_MS = 5_000;
const locks = new Map<string, number>();

/**
 * Thử acquire lock — nếu lock còn hiệu lực (do caller khác đang giữ) → throw LockedError.
 */
export function acquireLock(key: string): void {
  const existing = locks.get(key);
  const now = Date.now();
  if (existing && now - existing < LOCK_TTL_MS) {
    throw new LockedError('row', key);
  }
  locks.set(key, now);
}

/**
 * Giải phóng lock. An toàn khi gọi với key không tồn tại.
 */
export function releaseLock(key: string): void {
  locks.delete(key);
}

/**
 * Inspect state của lock (debug only).
 */
export function isLocked(key: string): boolean {
  const existing = locks.get(key);
  if (!existing) return false;
  return Date.now() - existing < LOCK_TTL_MS;
}

/**
 * Helper chạy 1 callback trong transaction có row-level lock.
 *
 * @param entityName - 'Asset' | 'LicenseSeat' — chỉ cho phép 2 entity này (literal type)
 * @param id - id của row cần lock
 * @param fn - async callback nhận `tx` (Prisma TransactionClient) và trả về result
 * @returns result của callback
 *
 * Ví dụ:
 *   await withRowLock('Asset', assetId, async (tx) => {
 *     const asset = await tx.asset.findUnique({ where: { id: assetId } });
 *     if (!asset) throw new NotFoundError('Asset', assetId);
 *     return tx.asset.update({ where: { id: assetId }, data: { assignedUserId } });
 *   });
 *
 * Lưu ý:
 * - Lock acquire/release ở application-level (Map<string, ts>).
 * - Transaction Prisma đảm bảo atomicity nếu caller throw → rollback.
 * - Nếu caller throw `DomainError` → transaction rollback, lock vẫn release
 *   (vì `releaseLock` nằm trong `finally {}`).
 */
export async function withRowLock<T>(
  entityName: 'Asset' | 'LicenseSeat',
  id: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  const key = `${entityName}:${id}`;
  acquireLock(key);
  try {
    return await prisma.$transaction(async (tx) => fn(tx));
  } finally {
    releaseLock(key);
  }
}

/**
 * Test-only helper — xóa toàn bộ lock state (dùng trong Jest beforeEach).
 */
export function _resetLocksForTesting(): void {
  locks.clear();
}
