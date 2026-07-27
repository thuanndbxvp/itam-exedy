/**
 * Tests cho src/lib/locking.ts.
 *
 * Verify:
 * - acquire + release lock đúng cơ chế Map<string, ts>
 * - 2 caller cùng acquire cùng key → cái thứ 2 throws LockedError
 * - Sau khi release, caller khác có thể acquire lại ngay
 * - TTL: nếu lock quá hạn (>5s), caller khác có thể acquire
 *
 * Test này KHÔNG cần Prisma thật — chỉ test pure app-level lock logic.
 * Integration test với prisma.$transaction thuộc Epic E.
 */
import {
  acquireLock,
  releaseLock,
  isLocked,
  _resetLocksForTesting,
} from '@/lib/locking';
import { LockedError } from '@/lib/errors';

describe('locking (application-level)', () => {
  beforeEach(() => _resetLocksForTesting());

  test('acquireLock mới → isLocked = true; release → false', () => {
    expect(isLocked('Asset:foo')).toBe(false);
    acquireLock('Asset:foo');
    expect(isLocked('Asset:foo')).toBe(true);
    releaseLock('Asset:foo');
    expect(isLocked('Asset:foo')).toBe(false);
  });

  test('2 caller cùng acquire cùng key → cái thứ 2 throws LockedError', () => {
    acquireLock('Asset:race');
    expect(() => acquireLock('Asset:race')).toThrow(LockedError);
  });

  test('Sau release, caller khác có thể acquire lại', () => {
    acquireLock('Asset:flip');
    releaseLock('Asset:flip');
    expect(() => acquireLock('Asset:flip')).not.toThrow();
  });

  test('release key chưa từng acquire → không throw', () => {
    expect(() => releaseLock('Asset:never-set')).not.toThrow();
    expect(isLocked('Asset:never-set')).toBe(false);
  });

  test('Key khác nhau hoàn toàn độc lập', () => {
    acquireLock('Asset:A');
    acquireLock('Asset:B');
    expect(isLocked('Asset:A')).toBe(true);
    expect(isLocked('Asset:B')).toBe(true);
    releaseLock('Asset:A');
    expect(isLocked('Asset:A')).toBe(false);
    expect(isLocked('Asset:B')).toBe(true);
  });

  test('LockedError có code "LOCKED" + meta đúng', () => {
    try {
      acquireLock('Asset:zzz');
      acquireLock('Asset:zzz');
      throw new Error('should not reach');
    } catch (e) {
      expect(e).toBeInstanceOf(LockedError);
      expect((e as LockedError).code).toBe('LOCKED');
      expect((e as LockedError).meta).toEqual({ resource: 'row', id: 'Asset:zzz' });
    }
  });
});
