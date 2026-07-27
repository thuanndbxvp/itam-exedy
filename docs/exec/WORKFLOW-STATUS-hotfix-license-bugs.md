# WORKFLOW-STATUS: Hotfix License Bugs

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)

## Trạng thái hiện tại
`[x] DONE` (hotfix đã được xử lý đan xen với Sprint A.5)

## Lịch sử cập nhật
- **[2026-07-28]** Tier 2 commit `fab595c` — fix/license-hotfix.
- **[2026-07-28]** Tier 2 commit `4c78e91` — Sprint A.5 Part 1 (BUG #1 history filter đã được fix tại đây).

## Kết quả
- **BUG #1 — Thiếu log cấp phát trong License history**: ✅ DONE trong `4c78e91`. Filter mở rộng include `LICENSE_SEAT` logs với `itemId IN seatIds`.
- **BUG #2 — 1 target nhận 2 seat cùng licenseId**: ✅ DONE trong `fab595c`.
  - Backend `checkoutLicenseSeat` throw `InvalidStateError` khi phát hiện duplicate.
  - Frontend `CheckoutSeatModal` nhận prop `licenseId`, fetch `/api/licenses/[id]/targets`, render `<option disabled>` cho user/asset đã có bản quyền.
- **Tests thủ công** (cần làm):
  - Vào 1 license bất kỳ (vd: Office 365) → cấp 1 seat cho Nguyễn Văn A.
  - Tab Lịch sử → hiện dòng "Cấp phát cho Nguyễn Văn A".
  - Bấm "Cấp Seat" lần nữa → dropdown User làm mờ option "Nguyễn Văn A (đã có bản quyền)".
  - Dùng `curl POST /api/licenses/checkout-seat` thẳng với cùng `targetUserId` → 500 / `INVALID_STATE`.
