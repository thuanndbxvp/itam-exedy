# MSEW: B10-B13 - Security & Preferences Bundle

**Người lập:** Tier 1 (Planner) + Tier 2 scaffolded

**Mục tiêu:** Hoàn thiện self-service Account Panel (B10-B13) — nối tiếp Sprint D (UserPreference schema).

## B10. Notification Preferences
1. **Schema:** Đã có sẵn `UserPreference` (Sprint D) với `emailDigestFrequency` + `muteUntil`.
2. **UI:** Tạo `/account/notifications/page.tsx` cho user chọn:
   - Email Digest Frequency: `NEVER` | `DAILY` | `WEEKLY` (enum đã có).
   - Mute until (datetime picker) — tạm tắt mọi thông báo.
3. **API:** Server action `updateNotificationPrefsAction` + `getMyNotificationPrefs()`.

## B11. UI Preferences (Theme + Locale)
1. **Schema:** `UserPreference.theme` (SYSTEM/LIGHT/DARK) + `locale`.
2. **UI:** `/account/appearance` page chọn theme (radio cards) + locale (select).
3. **Server action:** `updateAppearancePrefsAction`.
4. **Runtime:** Apply theme vào `<html class="dark">` + cookie `theme` để Next.js không flicker (sửa root layout).

## B12. Security Info + Active Sessions
1. **Schema:** User có sẵn `passwordChangedAt`, `twoFactorEnrolled`, `twoFactorOptin`.
2. **Hiện có:** `/account/security` page + SecurityInfoCard (read-only).
3. **Bổ sung:**
   - Bật/tắt `twoFactorOptin` (UI toggle) — backend hiện không thật sự issue OTP (out-of-scope này), chỉ lưu flag `twoFactorEnrolled=true` + `twoFactorOptin=true` để user kích hoạt "intent".
   - Active sessions list — show các session đang hoạt động (cần bảng `Session` hoặc `UserSession` — schema CHƯA có → tạo mới? hoặc skip, ghi chú trong WORKFLOW-STATUS).

## B13. Login History / Audit Trail cho User
1. **Source:** `ActionLog` table đã ghi `LOGIN` action (kiểm tra lại seed action types).
2. **Hiển thị:** Card "Lịch sử đăng nhập gần đây" trong `/account/security` — fetch 20 records gần nhất có `userId = me` + `actionType = 'LOGIN'`.

## Acceptance tổng
- 4 pages mới: `/account/notifications`, `/account/appearance`, `/account/security` (B13 thêm vào), `/account/profile` (đã có).
- 3 server actions mới: `updateNotificationPrefs`, `updateAppearancePrefs`, `toggleTwoFactorOptin`.
- 1 API route mới: `/api/me/preferences` (GET).
- Theme switch thực sự áp dụng (cookie + DOM class).