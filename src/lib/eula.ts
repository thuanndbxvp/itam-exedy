/**
 * EULA Acceptance utilities — Sprint C3.
 */
import { createHash } from 'crypto'

/**
 * Tính SHA-256 hash của EULA text → lưu vào `EulaAcceptance.version`.
 * Nếu admin edit EULA → hash đổi → user phải accept lại.
 */
export function eulaVersion(eulaText: string | null | undefined): string {
  if (!eulaText) return ''
  return createHash('sha256').update(eulaText).digest('hex').slice(0, 16)
}
