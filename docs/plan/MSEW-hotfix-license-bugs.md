# MSEW: Hotfix License Bugs

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Vá 2 lỗi liên quan đến Bản quyền (Lịch sử không hiện Log cấp phát, và Chặn lỗi 1 thiết bị cài 2 lần cùng 1 phần mềm).

## BƯỚC 1: Sửa bug thiếu Log cấp phát trong Lịch sử Bản quyền
1. Mở file `src/components/licenses/LicenseHistoryTimeline.tsx` (hoặc nơi gọi dữ liệu Timeline).
2. Hiện tại nó đang lấy log bằng query `where: { itemType: 'LICENSE', itemId: licenseId }`. 
3. Cần sửa lại query để lấy CẢ log của `LICENSE` VÀ log của `LICENSE_SEAT` (gợi ý: lấy toàn bộ ID của các Seat thuộc bản quyền này, rồi filter `{ in: [licenseId, ...seatIds] }`). Điều này giúp Tab Lịch sử hiển thị được các hành động Cấp phát/Thu hồi (Checkout/Checkin).

## BƯỚC 2: Chặn lỗi 1 Tài sản/Nhân sự nhận 2 Seat của cùng 1 Bản quyền
1. **Frontend (UI CheckoutSeatModal.tsx):** 
   - Khi API gọi về danh sách User/Asset để cho người dùng chọn, hãy tìm những Người/Thiết bị ĐÃ SỞ HỮU một Seat khác của chính `licenseId` này.
   - Thêm cờ `disabled: true` cho option đó. Trên giao diện Select/Dropdown, làm mờ nó đi, cấm người dùng click vào.
2. **Backend (src/lib/commands/license.ts - hàm checkoutLicenseSeat):**
   - Vẫn phải thêm logic query kiểm tra xem `targetUserId` / `targetAssetId` đã có Seat cùng `licenseId` chưa. 
   - Nếu có rồi thì `throw new InvalidStateError("Đã được cấp phát phần mềm này rồi")` để làm khóa bảo vệ thứ 2, chống tool chọc API.

## Kiểm thử
- Vào 1 bản quyền bất kỳ (vd: Office 365), cấp 1 Seat cho Nguyễn Văn A.
- Quay ra Tab Lịch sử xem có hiện dòng "Cấp phát cho Nguyễn Văn A" không.
- Bấm cấp tiếp Seat thứ 2, mở Dropdown tìm tên Nguyễn Văn A xem có bị làm mờ (disabled) đi không. Thử dùng tool POST thẳng lên API xem có bị ném lỗi không.
