# MSEW: C1-C4 - Asset & Ticket Advanced Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Nâng cấp tính năng nâng cao cho quá trình giao nhận tài sản và quy trình hỗ trợ IT (Tickets).

## C1. QR code / Barcode label print
1. **Thư viện:** Khuyên dùng `react-qr-code` hoặc `qrcode.react` để tạo QR, và `react-barcode` để tạo mã vạch. `react-to-print` để in.
2. **UI:** Tại trang chi tiết Asset (`/assets/[id]`) và danh sách Asset, thêm nút "In nhãn dán" (Print Label).
3. **Flow:** Bấm vào mở ra Modal hiển thị QR Code (chứa link URL tới Asset đó) kèm theo Mã tài sản (Asset Tag). Bấm nút "In" sẽ render ra khổ giấy nhỏ (định dạng máy in tem nhãn).

## C2. Ticket attachments upload
1. **Schema:** Database Ticket hiện chưa có mảng attachments. Cần thêm cột `attachments String[]` hoặc tạo bảng con `TicketAttachment`.
2. **Storage:** Có thể lưu file lên S3, Cloudinary hoặc dùng tạm thư mục `/public/uploads/tickets` (Dùng API Route POST xử lý Form Data).
3. **UI:** Sửa trang tạo/sửa Ticket và Chat box (phản hồi Ticket). Thêm nút đính kèm (Clip icon). Hiển thị danh sách file đính kèm dưới dạng thẻ nhỏ để download.

## C3 & C4. EULA acceptance flow & Accept/Decline asset
1. **Ngữ cảnh:** Khi Admin gán (checkout) 1 Laptop cho Nhân sự, Nhân sự phải đăng nhập vào hệ thống, đọc nội quy (EULA) và bấm "Tôi chấp nhận" hoặc "Từ chối".
2. **Schema:** Bảng `ActionLog` hoặc `CheckoutRecord` cần thêm cờ trạng thái `accepted` (boolean/null).
3. **UI Dashboard:** Ở trang Dashboard của Employee, thêm Widget: "Tài sản chờ xác nhận". Nếu có tài sản mới được giao, hiển thị cảnh báo đỏ bắt buộc phải click vào.
4. **Flow Modal:** Modal hiện ra nội dung EULA. Có 2 nút to:
   - "Chấp nhận": Update DB, gửi email báo Admin là User đã nhận.
   - "Từ chối": Nhập lý do (máy hỏng vỡ, sai loại...), update DB, trả tài sản lại kho, gửi báo cáo cho Admin.
