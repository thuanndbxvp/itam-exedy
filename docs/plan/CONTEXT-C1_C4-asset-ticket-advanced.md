# CONTEXT: C1_C4-asset-ticket-advanced

**Người lập:** Tier 2 (Coder)

## Scope

Mở rộng platform với 4 tính năng Sprint C:

1. **C1 Print QR labels**: In mã QR cho assets (assetTag → scan URL).
2. **C2 Ticket attachments**: Upload file kèm ticket comment.
3. **C3 EULA acceptance**: Modal chấp nhận EULA trước khi checkout asset thuộc category yêu cầu.
4. **C4 Accept/Decline**: User xác nhận "đã nhận" hoặc "từ chối" asset IT cấp phát.

## Phụ thuộc & reuse

- ✅ `qrcode` (B17).
- ✅ `TicketAttachment` model + `lib/upload.ts`.
- ✅ `Category.eulaText` + `requireAcceptance` (B1).
- ✅ `ActionType.ACCEPTED/DECLINED`.
- ✅ NextAuth `getServerSession()` cho auth.

## Schema delta

- C3 cần: `EulaAcceptance { id, userId, categoryId, acceptedAt, version }` (version = eulaText hash).
- C1, C2, C4: zero migration.