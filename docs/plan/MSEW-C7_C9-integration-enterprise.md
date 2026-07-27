# MSEW: C7_C9-integration-enterprise

**Người lập:** Tier 1
**Assignee:** Tier 2

## Phạm vi MVP cho 3 tính năng enterprise

| ID | Feature | Scope MVP (gọn lại) |
|----|---------|---------------------|
| C7 | Webhooks / API tokens | `ApiToken` table + REST API `/api/v1/assets` GET (read-only) authenticated by Bearer token. UI quản lý token trong `/settings/api-tokens` với show-once raw token + revoke. Không bao gồm HMAC signing đầy đủ (defer), CHỈ plaintext token SHA-256 hash. |
| C8 | Email templates editor | `EmailTemplate` table: key (enum: TICKET_ASSIGNED, PASSWORD_RESET, ASSET_CHECKOUT, …) + subject + htmlBody. Admin UI `/settings/email-templates` edit/preview; modify `sendEmail` callers → render template trước khi gửi. |
| C9 | Slack notification channels | `NotificationChannel` table: kind=SLACK, webhook URL. Hook into `notify()` helper — khi có event, POST vào Slack webhook. UI `/settings/notification-channels` để admin CRUD Slack webhook. |

**NF (non-functional):**
- Reuse `sendEmail`, `decrypt` từ B12 / Sprint A.
- Rate limit mỗi API token (in-memory, key = token prefix).
- Audit log tất cả API calls + email template edits + webhook deliveries.

## Effort thực tế (down-scope)

| ID | Original | Adjusted |
|----|----------|----------|
| C7 | 4-5 days | 1.5 days (read-only API + token UI) |
| C8 | 3 days | 1.5 days (3-4 templates + edit UI) |
| C9 | 4 days | 1 day (Slack only, hooked into notify()) |
| **Σ** | **11-12 days** | **~4 days** |