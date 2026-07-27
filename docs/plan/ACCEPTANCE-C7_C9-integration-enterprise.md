# ACCEPTANCE: C7_C9-integration-enterprise

**Người lập:** Tier 2

## C7. API tokens
- [x] C7_1. `ApiToken` model + SQL migration.
- [x] C7_2. `/settings/api-tokens` page: list tokens (name, prefix, scopes, lastUsedAt, revokedAt) + nút Create New.
- [x] C7_3. Modal create: nhập name + scopes → returns raw token ONCE (không lưu DB).
- [x] C7_4. Modal revoke confirmation → set revokedAt = now().
- [x] C7_5. `/api/v1/assets` GET với `Authorization: Bearer <token>` → trả danh sách assets (subset, read-only).
- [x] C7_6. Helper `lib/api-token.ts` — verify(token) → { valid, scopes }, constant-time compare.
- [x] C7_7. Audit log mỗi external API call.

## C8. Email templates editor
- [x] C8_1. `EmailTemplate` table với key enum (TICKET_ASSIGNED, PASSWORD_RESET, ASSET_CHECKOUT).
- [x] C8_2. Seed script insert 3 default templates (HTML có sẵn cho PASSWORD_RESET, …).
- [x] C8_3. `renderEmailTemplate(key, vars)` helper — substitute `{{varName}}` → values.
- [x] C8_4. `sendEmail()` wrapper mới `sendTemplateEmail(key, vars, to)` dùng renderEmailTemplate + sendEmail.
- [x] C8_5. `/settings/email-templates` page: list + edit form (subject + htmlBody).
- [x] C8_6. Preview pane show rendered output với sample vars.

## C9. Slack notification channels
- [x] C9_1. `NotificationChannel` table với kind=SLACK, url, enabled.
- [x] C9_2. `/api/notification-channels` CRUD.
- [x] C9_3. `/settings/notification-channels` page list + edit form.
- [x] C9_4. Update `notify()` helper (tickets + assets) → enqueue gửi Slack message async (không block).
- [x] C9_5. Test button trong UI: nhập "ping" → verify Slack connection.
- [x] C9_6. Update `lastDeliveryAt` / `lastDeliveryError` sau mỗi attempt.