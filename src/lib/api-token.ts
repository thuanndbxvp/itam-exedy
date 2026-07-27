/**
 * API Token helpers — Sprint C7.
 *
 * Format: `tk_<prefix>.<secret>` (52 chars total).
 *  - `prefix`: 8 hex chars (giúp debug UI; identify token trong log).
 *  - `.`: literal separator
 *  - `secret`: 32 random bytes base64url (~43 chars).
 *
 * DB lưu SHA-256 hash, không lưu raw.
 * Constant-time comparison để chống timing attack.
 */
import { createHash, randomBytes, timingSafeEqual } from 'crypto'

export const API_TOKEN_SCOPES = [
  'assets.read',
  'licenses.read',
  'users.read',
  'tickets.read',
] as const
export type ApiTokenScope = (typeof API_TOKEN_SCOPES)[number]

const TOKEN_PREFIX_LABEL = 'tk'
const PREFIX_LEN = 4 // 4 random bytes → 8 hex chars

export interface NewRawToken {
  /** Raw token (chỉ show ONCE). */
  raw: string
  /** First segment — hiển thị trong UI (8 hex). */
  prefix: string
  /** SHA-256 hash → lưu DB. */
  hash: string
}

/**
 * Sinh raw token + prefix + hash.
 */
export function generateApiToken(): NewRawToken {
  const prefix = randomBytes(PREFIX_LEN).toString('hex')
  const secret = randomBytes(32).toString('base64url')
  const raw = `${TOKEN_PREFIX_LABEL}_${prefix}.${secret}`
  const hash = hashToken(raw)
  return { raw, prefix, hash }
}

/**
 * SHA-256 hex digest của raw token.
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

/**
 * Constant-time compare 2 hex hash.
 */
export function safeEqualHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
  } catch {
    return false
  }
}

/**
 * Validate scopes là subset của known scopes.
 */
export function validateScopes(scopes: unknown): ApiTokenScope[] {
  if (!Array.isArray(scopes)) return []
  return scopes.filter((s): s is ApiTokenScope =>
    API_TOKEN_SCOPES.includes(s as ApiTokenScope)
  )
}
