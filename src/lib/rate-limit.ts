/**
 * Rate limiter in-memory — sliding window per key.
 *
 * Epic D Security đã dùng API này cho NextAuth + Epic F (Epic E Audit).
 * user-panel dùng lại cùng API. Phase 5 sẽ thay bằng Redis.
 *
 * Public API (match tests/rate-limit.test.ts):
 *   checkRateLimit({ key, max, windowMs }) → { allowed, remaining, resetAt }
 *   _resetRateLimitForTesting() — chỉ dùng cho Jest
 */

interface CheckInput {
  /** Bucket key — vd `password-change:${userId}` */
  key: string
  /** Max allowed events per window. */
  max: number
  /** Window size in ms. */
  windowMs: number
}

interface CheckResult {
  allowed: boolean
  /** Remaining quota (0 nếu !allowed). */
  remaining: number
  /** Timestamp khi bucket reset (ms epoch). */
  resetAt: number
}

const buckets = new Map<string, number[]>()

/**
 * Check + record 1 hit cho `key`. Sliding window.
 * Lazy cleanup: filter mỗi call.
 */
export function checkRateLimit(input: CheckInput): CheckResult {
  const { key, max, windowMs } = input
  const now = Date.now()
  const since = now - windowMs

  const existing = buckets.get(key) ?? []
  const recent = existing.filter((t) => t > since)

  if (recent.length >= max) {
    // Blocked. resetAt = oldest timestamp + windowMs
    const resetAt = (recent[0] ?? now) + windowMs
    buckets.set(key, recent)
    return { allowed: false, remaining: 0, resetAt }
  }

  recent.push(now)
  buckets.set(key, recent)
  return {
    allowed: true,
    remaining: max - recent.length,
    resetAt: (recent[0] ?? now) + windowMs,
  }
}

/** Test helper — clear all buckets. */
export function _resetRateLimitForTesting(): void {
  buckets.clear()
}