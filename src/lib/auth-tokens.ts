/**
 * Reset password token utilities — Sprint B16.
 *
 * Token flow:
 *   1. Generate 32 random bytes → base64url encode → RAW token (gửi qua email).
 *   2. SHA-256 hash → lưu DB (`tokenHash`). DB không bao giờ giữ raw token.
 *   3. Verify: hash raw token lại, so sánh với `tokenHash` (constant-time).
 *
 * TTL: 1 giờ, single use.
 */
import { createHash, randomBytes, timingSafeEqual } from 'crypto'

export const TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Sinh raw token (32 bytes → 43 chars base64url, không padding).
 * Token này sẽ được embed vào URL email.
 */
export function generateRawToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Hash raw token → hex string SHA-256 để lưu DB.
 */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

/**
 * Constant-time so sánh 2 hex strings.
 * Dùng để verify raw token với DB tokenHash — chống timing attack.
 */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    const bufA = Buffer.from(a, 'hex')
    const bufB = Buffer.from(b, 'hex')
    if (bufA.length !== bufB.length) return false
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * Compute expiresAt = now + TTL.
 */
export function tokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + TOKEN_TTL_MS)
}

/**
 * Check token có hợp lệ không (chưa dùng, chưa hết hạn).
 */
export function isTokenValid(token: { usedAt: Date | null; expiresAt: Date }, now: Date = new Date()): boolean {
  if (token.usedAt) return false
  return token.expiresAt > now
}
