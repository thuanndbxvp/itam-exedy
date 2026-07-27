/**
 * Mã hóa/giải mã SMTP password bằng AES-256-GCM.
 * Key lấy từ NEXTAUTH_SECRET (đã có sẵn).
 *
 * Phase 3 sẽ chuyển sang key riêng (ENCRYPTION_KEY).
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SALT = 'snipeit-smtp-password-v1' // salt cố định cho key derivation

/**
 * Derive 32-byte key từ secret + salt bằng scrypt.
 */
function deriveKey(secret: string): Buffer {
  return scryptSync(secret, SALT, 32)
}

function getKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET chưa được set — không thể mã hóa SMTP password.')
  }
  return deriveKey(secret)
}

/**
 * Encrypt plain text → base64 string (iv:tag:ciphertext).
 */
export function encrypt(plain: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // Format: base64(iv).base64(tag).base64(ciphertext)
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`
}

/**
 * Decrypt base64 string → plain text.
 * Trả về null nếu input không hợp lệ (không throw).
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (!ciphertext) return null

  const key = getKey()
  const parts = ciphertext.split('.')
  if (parts.length !== 3) return null

  try {
    const [ivB64, tagB64, encB64] = parts
    const iv = Buffer.from(ivB64, 'base64')
    const tag = Buffer.from(tagB64, 'base64')
    const enc = Buffer.from(encB64, 'base64')

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([decipher.update(enc), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}