# CONTEXT: B10-B13 - Security & Preferences Bundle

**Người lập:** Tier 1 (Planner) + Tier 2 scaffolded

## Scope

Sprint B (theo audit) gồm B1-B17 với B10 = Notification Preferences, là blocker đã được giải quyết bởi Sprint D (UserPreference schema). Bundle B10-B13 lấp các trang còn lại của Account Panel:

1. **B10 — Notification Preferences**: User chọn tần suất email digest + mute thông báo.
2. **B11 — Appearance**: Theme (System/Light/Dark) + locale.
3. **B12 — Security panel**: bật/tắt 2FA intent (optin), đổi MK (đã có Phase A), xem thông tin tài khoản (đã có).
4. **B13 — Login History**: hiển thị 20 logins gần nhất của user từ ActionLog.

## Phụ thuộc

- `UserPreference` model (Sprint D) đã có sẵn — không cần migrate.
- `ActionLog` đã ghi `LOGIN` action (verify khi implement).
- NextAuth session là source-of-truth cho active sessions — KHÔNG cần bảng `UserSession` mới (skipped).