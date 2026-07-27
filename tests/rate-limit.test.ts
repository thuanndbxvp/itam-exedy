/**
 * Test cho src/lib/rate-limit.ts — Epic D Security Bonus.
 *
 * Pure function test, KHÔNG cần React. Test:
 *  - Lần đầu tiên → allowed.
 *  - Khi count > max → blocked.
 *  - Sau window reset → lại allowed.
 *  - Key khác nhau độc lập.
 *  - 2 lần liên tiếp KHÔNG vượt max → đều allowed.
 *
 * Dùng fake timers (`jest.useFakeTimers()`) để không phụ thuộc Date.now() thật.
 */
import {
  checkRateLimit,
  _resetRateLimitForTesting,
} from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetRateLimitForTesting();
  });

  test('lần đầu với key mới → allowed + remaining = max-1', () => {
    const r = checkRateLimit({ key: 'a', max: 5, windowMs: 60_000 });
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(4);
  });

  test('5 lần liên tiếp cùng key → cả 5 đều allowed', () => {
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit({ key: 'b', max: 5, windowMs: 60_000 });
      expect(r.allowed).toBe(true);
    }
  });

  test('lần thứ 6 cùng key → blocked', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit({ key: 'c', max: 5, windowMs: 60_000 });
    }
    const sixth = checkRateLimit({ key: 'c', max: 5, windowMs: 60_000 });
    expect(sixth.allowed).toBe(false);
    expect(sixth.remaining).toBe(0);
  });

  test('sau khi hết window → bucket reset, lại allowed', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-26T10:00:00Z'));

    for (let i = 0; i < 5; i++) {
      checkRateLimit({ key: 'd', max: 5, windowMs: 60_000 });
    }
    expect(checkRateLimit({ key: 'd', max: 5, windowMs: 60_000 }).allowed).toBe(false);

    // Tới 1 phút sau → bucket hết hạn → reset
    jest.setSystemTime(new Date('2026-07-26T10:01:00Z').getTime());
    const afterReset = checkRateLimit({ key: 'd', max: 5, windowMs: 60_000 });
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(4);

    jest.useRealTimers();
  });

  test('key khác nhau hoàn toàn độc lập', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit({ key: 'e1', max: 5, windowMs: 60_000 });
    }
    expect(checkRateLimit({ key: 'e1', max: 5, windowMs: 60_000 }).allowed).toBe(false);
    // Key khác → KHÔNG bị ảnh hưởng
    expect(checkRateLimit({ key: 'e2', max: 5, windowMs: 60_000 }).allowed).toBe(true);
  });

  test('resetAt trả về timestamp tương lai', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-26T10:00:00Z').getTime());

    const r = checkRateLimit({ key: 'f', max: 5, windowMs: 60_000 });
    expect(r.resetAt).toBeGreaterThan(Date.now());
    // resetAt = now + windowMs
    expect(r.resetAt - Date.now()).toBe(60_000);

    jest.useRealTimers();
  });

  test('resetRateLimitForTesting xóa tất cả bucket', () => {
    for (let i = 0; i < 6; i++) {
      checkRateLimit({ key: 'g', max: 5, windowMs: 60_000 });
    }
    expect(checkRateLimit({ key: 'g', max: 5, windowMs: 60_000 }).allowed).toBe(false);
    _resetRateLimitForTesting();
    expect(checkRateLimit({ key: 'g', max: 5, windowMs: 60_000 }).allowed).toBe(true);
  });
});