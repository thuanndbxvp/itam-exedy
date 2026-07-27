# MSEW: C1_C4-asset-ticket-advanced

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)

## Sprint scope

4 Sprint C features, scoped to MVP):

| ID | Feature | Scope MVP | Effort (realistic) |
|----|---------|-----------|-------------------|
| C1 | Asset QR/barcode labels | Print page `/print/asset-labels` với QR generator từ `asset.assetTag`, batch select + print CSS @media | M (1.5 ngày) |
| C2 | Ticket attachments | API upload + UI trên ticket detail page; reuse `lib/upload.ts` (ticket-attachment type đã có) | M (1.5 ngày) |
| C3 | EULA acceptance modal | Category có `eulaText` + `requireAcceptance` (đã có ở B1). Show modal khi checkout asset nếu user chưa accept category này. Track via bảng `EulaAcceptance` (NEW) | M (1.5 ngày) |
| C4 | Asset accept/decline | IT_STAFF checkout asset cho user → user nhận notification có 2 nút "Nhận" / "Từ chối". User action ghi audit log `ActionType.ACCEPTED/DECLINED` | M (1 ngày) |

**NF:** không touch Epic H notification core. Reuse existing primitives.

## Phụ thuộc

- C1: `qrcode` package đã có sẵn (B17 install).
- C2: `TicketAttachment` model + `lib/upload.ts` đã có sẵn.
- C3: `Category.eulaText` + `Category.requireAcceptance` đã có (B1).
- C4: `ActionType.ACCEPTED/DECLINED` đã có sẵn.

## Deliverables

1. `/print/asset-labels` page + `lib/print/qr-generator.ts` (C1).
2. `/api/tickets/[id]/attachments` GET/POST/DELETE + `TicketAttachments.tsx` (C2).
3. `EulaAcceptance` model + `eulaAcceptCmd` + `EulaModal.tsx` trigger trong checkout flow (C3).
4. `/api/assets/[id]/accept-decline` POST + `AssetAcceptanceCard.tsx` trên `/account` (C4).