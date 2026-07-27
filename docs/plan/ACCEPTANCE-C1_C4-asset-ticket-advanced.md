# ACCEPTANCE: C1_C4-asset-ticket-advanced

**Người lập:** Tier 2 (Coder)

## C1. QR labels
- [x] C1_1. `src/lib/print/qr-generator.ts` generate QR Data URI từ `assetTag` + base URL.
- [x] C1_2. `/print/asset-labels` page với checkboxes multi-select assets + nút "In".
- [x] C1_3. Print CSS `@media print` ẩn sidebar/header, chỉ in grid labels (3 cols default).
- [x] C1_4. Mỗi label gồm: QR code (200×200px), assetTag (font-mono), model name, status badge.

## C2. Ticket attachments
- [x] C2_1. `/api/tickets/[id]/attachments` POST = uploadFile + insert `TicketAttachment`.
- [x] C2_2. `/api/tickets/[id]/attachments` GET = list.
- [x] C2_3. `/api/tickets/[id]/attachments` DELETE = xóa (chỉ uploader hoặc IT).
- [x] C2_4. `TicketAttachments.tsx` component: drop zone + list files với filename/size/uploader + delete button.
- [x] C2_5. Tích hợp trên `/helpdesk/[id]/page.tsx` dưới comments list.
- [x] C2_6. Validation: max 10MB, allow image/PDF/txt/doc/docx (giống upload.ts stub).

## C3. EULA acceptance
- [x] C3_1. `EulaAcceptance` model: id, userId, categoryId, version (eulaText hash), acceptedAt. Composite unique (userId, categoryId).
- [x] C3_2. `acceptEulaCmd(userId, categoryId)` server action → upsert.
- [x] C3_3. `EulaModal.tsx`: hiển thị `eulaText` + checkbox "Tôi đã đọc và đồng ý" + 2 nút "Đồng ý" (disabled nếu checkbox off) / "Từ chối".
- [x] C3_4. Integrate trong `CheckoutAssetModal`: nếu asset category có `requireAcceptance=true` và user chưa accept → show EulaModal trước khi checkout thật.
- [x] C3_5. Reject nếu user decline.

## C4. Accept/Decline asset
- [x] C4_1. `/api/assets/[id]/accept-decline` POST `{ action: 'accept'|'decline', notes? }`.
- [x] C4_2. Permission: chỉ assignedUser mới accept/decline (không phải IT side → IT không accept thay).
- [x] C4_3. Ghi ActionLog ACCEPTED hoặc DECLINED với notes.
- [x] C4_4. `/account` page thêm card "Assets chờ xác nhận" list assets mà user chưa accept/decline (assignedUserId=self && lastCheckout sau 7 ngày && chưa accept).
- [x] C4_5. Trên `/assets/[id]` (của user-assigned asset): banner "Bạn đã nhận asset này?" + 2 button Accept/Decline.