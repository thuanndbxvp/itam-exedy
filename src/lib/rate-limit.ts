/**
 * Simple in-memory rate-limit cho Next.js API routes.
 *
 * Phase 1: dùng Map in-memory → chỉ work trong 1 Node.js process.
 * Phase 2: chuyển sang Redis (Upstash) khi scale multi-instance.
 *
 * Cú pháp giống `next-rate-limit` API để dễ migrate Phase 2.
 *
 * Ví dụ:
 *   const result = checkRateLimit({ key: `login:${ip}`, max: 5, windowMs: 60_000 })
 *   if (!result.allowed) return new Response('Too Many Requests', { status: 429 })
 */
interface RateLimitConfig {
  key: string                  // unique key (vd: IP + endpoint)
  max: number                  // số request tối đa
  windowMs: number             // thời gian (ms)
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number              // timestamp ms khi reset
}

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/**
 * Check rate-limit cho 1 key.
 *
 * Logic:
 *  - Nếu key chưa có bucket hoặc bucket hết hạn → reset count=1, allowed.
 *  - Nếu bucket còn hạn → tăng count.
 *  - Nếu count > max → blocked (allowed=false).
 *  - Cleanup: lazy — bucket tự bị ghi đè khi reset.
 */
export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const { key, max, windowMs } = config
  const now = Date.now()
  const existing = buckets.get(key)

  // Bucket hết hạn hoặc chưa tồn tại → reset
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs }
  }

  // Bucket còn hạn + count++
  existing.count += 1
  buckets.set(key, existing)

  if (existing.count > max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  return {
    allowed: true,
    remaining: max - existing.count,
    resetAt: existing.resetAt,
  }
}

/**
 * Test-only helper: xóa tất cả bucket.
 * KHÔNG export trong production code — chỉ test file mới dùng.
 */
export function _resetRateLimitForTesting() {
  buckets.clear()
}