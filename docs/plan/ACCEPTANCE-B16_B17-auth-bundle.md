# ACCEPTANCE: B16-B17 Advanced Auth Bundle

**Người lập:** Tier 2 (Coder)

## B16. Forgot password
- [x] B16_1. `PasswordResetToken` model: id, userId, tokenHash (unique), expiresAt, usedAt. Cascade delete với User.
- [x] B16_2. `/api/auth/forgot-password` POST {email} — luôn trả 200 (không leak email tồn tại hay không).
- [x] B16_3. Email chứa link `https://<host>/reset-password?token=<raw>` — token 32 bytes base64url.
- [x] B16_4. `/reset-password` page — verify token → form nhập pass mới (2 lần) → bcrypt hash → update User.password + invalidate token.
- [x] B16_5. Rate limit: 3 requests/email/15 min.
- [x] B16_6. Login page có link "Quên mật khẩu?" → form inline.
- [x] B16_7. Token TTL 1 hour, single use, hết hạn auto redirect về forgot.

## B17. 2FA TOTP
- [x] B17_1. Install `otplib` + `qrcode`.
- [x] B17_2. `/api/auth/2fa/setup` POST — generate secret, return `{secret, otpauthUri, qrCodeDataUri}`. KHÔNG enable flag.
- [x] B17_3. `/api/auth/2fa/verify` POST {code} — verify OTP against stored secret, enable flag nếu đúng.
- [x] B17_4. `/api/auth/2fa/disable` POST {password} — verify pass, set `twoFactorEnrolled=false`, clear secret.
- [x] B17_5. Security page UI: tab "Xác thực 2 bước" — hiển thị QR, ô nhập 6 số, button enable/disable.
- [x] B17_6. Login flow update: sau bcrypt OK, nếu `twoFactorEnrolled=true` → trả về flag `require2FA` thay vì session. UI bước 2 nhập OTP mới tạo session.
- [x] B17_7. Bcrypt cost 10. TOTP window: 1 (allow 30s skew).