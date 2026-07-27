# ACCEPTANCE: B10-B13 - Security & Preferences Bundle

**Người lập:** Tier 2 (Coder, scaffolded)

## B10. Notification Preferences
- [x] B10_1. `/account/notifications` page với form chọn `emailDigestFrequency` (NEVER/DAILY/WEEKLY) + `muteUntil` (datetime).
- [x] B10_2. Server action `updateNotificationPrefsAction` upsert `UserPreference`.
- [x] B10_3. Nếu user chưa có UserPreference → tạo mới (default DAILY/SYSTEM) trước khi update.

## B11. UI Preferences (Appearance)
- [x] B11_1. `/account/appearance` page với 3 theme radio cards + locale select.
- [x] B11_2. Server action `updateAppearancePrefsAction` lưu `theme` + `locale`.
- [x] B11_3. Cookie `theme` set khi save → `<html>` apply class `dark` ngay từ SSR.

## B12. Security Panel
- [x] B12_1. `/account/security` thêm toggle "Bật 2FA intent" (optin).
- [x] B12_2. Server action `toggleTwoFactorOptinAction` toggle `User.twoFactorOptin`.
- [x] B12_3. UI hint ghi chú "OTP chưa được triển khai" (Phase B deferred).

## B13. Login History
- [x] B13_1. `/account/security` thêm card "Lịch sử đăng nhập" (top 20).
- [x] B13_2. Fetch từ `ActionLog` filter `userId = me` + `actionType = 'LOGIN'`.
- [x] B13_3. Nếu ActionLog không có LOGIN action (schema mismatch) → fallback text "Chưa có dữ liệu".