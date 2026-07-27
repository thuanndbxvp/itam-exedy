/**
 * 2FA pending cookie — Sprint B17.
 *
 * Luồng login 2 bước:
 *  1. User nhập email + password → /api/auth/login (custom)
 *  2. Nếu 2FA enrolled → set cookie "2fa_pending" = "<userId>.<hmac>"
 *     + trả { require2FA: true, userId }. KHÔNG tạo session.
 *     Nếu !enrolled → tạo NextAuth session như bình thường.
 *  3. Client show OTP step, user nhập 6 số → /api/auth/login/2fa (custom)
 *     verify OTP + cookie → tạo NextAuth Credentials sign-in.
 *
 * Cookie design:
 *  - HTTP-only, SameSite=Lax, Secure (production)
 *  - TTL 5 phút (kịch bản user chậm)
 *  - HMAC để chống tamper
 */
import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.NEXTAUTH_SECRET ?? 'change-me-in-prod'
const COOKIE_NAME = '2fa_pending'
const TTL_MS = 5 * 60 * 1000
const HMAC_LEN = 32 // hex of HMAC = 64 chars

export interface Pending2FA {
  userId: string
  expiresAt: number // ms epoch
}

function sign(payload: string): string {
  return createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, HMAC_LEN * 2)
}

function verifySig(payload: string, sig: string): boolean {
  const expected = sign(payload)
  if (expected.length !== sig.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  } catch {
    return false
  }
}

/**
 * Build cookie value: `<userId>.<expiryMs>.<hmac>`
 */
export function encodePendingCookie(userId: string, now: number = Date.now()): string {
  const expiresAt = now + TTL_MS
  const payload = `${userId}.${expiresAt}`
  const sig = sign(payload)
  return `${userId}.${expiresAt}.${sig}`
}

/**
 * Parse + validate cookie. Trả về null nếu invalid/expired.
 */
export function decodePendingCookie(raw: string | undefined | null): Pending2FA | null {
  if (!raw) return null
  const parts = raw.split('.')
  if (parts.length !== 3) return null
  const [userId, expiryStr, sig] = parts
  if (!userId || !expiryStr || !sig) return null
  const expiresAt = Number(expiryStr)
  if (!Number.isFinite(expiresAt)) return null
  if (Date.now() > expiresAt) return null
  if (!verifySig(`${userId}.${expiresAt}`, sig)) return null
  return { userId, expiresAt }
}

/**
 * Tên cookie constant.
 */
export const PENDING_COOKIE_NAME = COOKIE_NAME
export const PENDING_COOKIE_TTL_S = Math.floor(TTL_MS / 1000)
