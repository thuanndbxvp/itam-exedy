# CONTEXT: C7_C9-integration-enterprise

**Người lập:** Tier 2

## Scope
3 enterprise integration features (Sprint C):
- **C7**: External API tokens — public read-only API for assets.
- **C8**: Email template editor — admin-controlled subject + body templates.
- **C9**: Slack notification channels — outbound notifications to Slack webhooks.

## Phụ thuộc & reuse

- ✅ `sendEmail()` (`src/lib/notifications/email.ts`) — used by C8.
- ✅ `notify()` (`src/lib/tickets/notifications`) — extended by C9.
- ✅ `decrypt()` (`src/lib/crypto.ts`) — for C9 if encrypted webhook URL.

## Schema delta

- **C7**: `ApiToken { id, name, tokenPrefix, tokenHash, scopes string[], lastUsedAt, expiresAt, createdById, createdAt, revokedAt }`.
- **C8**: `EmailTemplate { key (unique), subject, htmlBody, updatedAt, updatedById }`.
- **C9**: `NotificationChannel { id, name, kind (SLACK|WEBHOOK), url (encrypted? — defer), enabled, lastDeliveryAt, lastDeliveryError, createdAt }`.

All 3 scripts idempotent.