# CONTEXT: B16-B17 Advanced Auth Bundle

**Người lập:** Tier 2 (Coder)

## Scope

Bổ sung 2 dòng chảy auth cốt lõi thiếu:

1. **B16**: Forgot password qua email — user nhập email → nhận link reset → set pass mới.
2. **B17**: 2FA TOTP — enrollment scan QR + verify OTP, login flow check 2FA.

## Phụ thuộc

- ✅ `sendEmail()` từ `src/lib/notifications/email.ts` đã có sẵn (SMTP UI-defined).
- ✅ `crypto.ts` có `encrypt/decrypt` AES-256-GCM — không cần viết lại.
- ✅ `User` model có sẵn `twoFactorSecret String? @db.Text` + `twoFactorEnrolled Boolean`.
- ✅ `User.twoFactorOptin` đã có (B12 toggle intent).
- ✅ `bcryptjs` đã có sẵn.

## Cần thêm

- `otplib` + `qrcode` packages (npm install).
- `PasswordResetToken` model (separate table — cleanup dễ hơn nhét vào User).
- API endpoints: `/api/auth/forgot-password`, `/api/auth/reset-password`.
- 2FA enrollment endpoints: `/api/auth/2fa/setup`, `/api/auth/2fa/verify`.
- Login flow update: check `twoFactorEnrolled` → challenge step.
- Login UI: thêm step 2 nếu 2FA bật.

## Effort estimate

- B16: M (1.5-2 ngày)
- B17: L (3-4 ngày, do touch login core)