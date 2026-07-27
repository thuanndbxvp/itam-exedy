# SKILL-ROUTING: B16-B17 Advanced Auth Bundle

**Người lập:** Tier 2 (Coder)

| Bước | Task | Skill | Lý do |
|------|------|-------|--------|
| 1 | Install otplib + qrcode | `bash` | npm install |
| 2 | PasswordResetToken schema + SQL migration | `prisma` | New table |
| 3 | Forgot password API + email template | `backend-engineer` | Email flow |
| 4 | Reset password UI + page | `frontend-engineer` | Form |
| 5 | 2FA setup/verify API | `security-engineer` | Crypto |
| 6 | Update login flow + 2FA challenge UI | `fullstack` | Touch auth core |

## Verification

- Unit tests for password token expiry
- TOTP secret generation entropy check
- Login with 2FA enabled requires valid OTP
- Login without 2FA bypasses OTP step