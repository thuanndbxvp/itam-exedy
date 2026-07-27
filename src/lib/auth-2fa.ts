/**
 * 2FA TOTP helpers — Sprint B17.
 *
 * Dùng `otplib` (functional API) sinh secret + verify OTP.
 *
 * Flow:
 *   1. setup() → generate secret, return { secret, otpauthUri, qrCodeDataUri }
 *   2. UI quét QR bằng Google Authenticator + nhập 6 số
 *   3. verify(secret, code) → bool (true nếu OTP hợp lệ)
 *
 * Secret được LƯU plain trong DB (chưa mã hoá - Phase B18).
 * Khi disable → clear secret.
 *
 * Phase B18: encrypt secret bằng AES-256-GCM từ `@/lib/crypto` trước khi lưu DB.
 */
import { generateSecret, verify, generateURI } from 'otplib'
import QRCode from 'qrcode'

// Window: cho phép OTP ±30s skew (mặc định otplib step=30s).
// Không set default — otplib đã có default 30s step; dùng verify() với options.

export interface TwoFactorSecret {
  /** Plain secret base32 (chỉ trả về cho client 1 lần khi setup). */
  secret: string
  /** otpauth:// URI để render QR */
  otpauthUri: string
  /** Data URI PNG QR code */
  qrCodeDataUri: string
}

/**
 * Sinh secret + QR code cho user.
 * Không lưu gì vào DB — caller phải tự gọi prisma.user.update sau khi verify.
 */
export async function generate2FASecret(userEmail: string): Promise<TwoFactorSecret> {
  const secret = generateSecret()
  const issuer = 'IT Asset Mgmt'
  const otpauthUri = generateURI({ strategy: 'totp', label: userEmail, issuer, secret })
  const qrCodeDataUri = await QRCode.toDataURL(otpauthUri, { width: 240, margin: 1 })
  return { secret, otpauthUri, qrCodeDataUri }
}

/**
 * Verify OTP code (6 digits) against secret.
 * Returns boolean.
 */
export function verify2FACode(secret: string, code: string): boolean {
  try {
    const result = verify({ strategy: 'totp', token: code.trim(), secret })
    return Boolean(result)
  } catch {
    return false
  }
}

/**
 * Sinh 10 backup codes (mỗi code 8 chars alphanumeric).
 * Backup codes dùng để bypass OTP khi mất điện thoại.
 * Lưu ý: chưa implement UI backup-code flow (chỉ generate để Phase sau).
 */
export function generateBackupCodes(count = 10, length = 8): string[] {
  const codes: string[] = []
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // bỏ I, L, O, 0, 1 tránh nhầm
  for (let i = 0; i < count; i++) {
    let code = ''
    for (let j = 0; j < length; j++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    codes.push(code)
  }
  return codes
}
