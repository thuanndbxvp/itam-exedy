# MSEW: A6-A7-A10 - Helpdesk & System Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Thi công 3 tính năng liên quan đến Helpdesk và dọn dẹp hệ thống.

## Các bước thực thi chi tiết (Dành cho Tier 2)

### BƯỚC 1: A7 - Helpdesk Team CRUD
*Khuyến nghị làm cái này trước để có data cho bộ lọc Ticket.*
1. **API:** Dựng các API `GET`, `POST`, `PUT`, `DELETE` cho thư mục `/api/settings/helpdesk-teams`.
   - Payload POST/PUT cần xử lý việc tạo `name`, `description`, và mảng `userIds` để liên kết User vào Team.
2. **UI:** Tạo trang `src/app/settings/helpdesk-teams/page.tsx`.
   - Bảng danh sách các Team kèm số lượng thành viên.
   - Form Modal để Thêm/Sửa Team (dùng Multi-select dropdown để chọn nhân sự).

### BƯỚC 2: A6 - Ticket Filter (Helpdesk)
1. **Filter Component:** Tạo `src/components/helpdesk/TicketFilterBar.tsx` (Client component).
   - Chứa các dropdown: Trạng thái (New, In Progress, Resolved...), Mức độ ưu tiên (Low, Medium, High), Team (gọi API fetch danh sách Team ở bước 1), và Assignee.
   - Khi change giá trị, đẩy query string lên URL (ví dụ: `?teamId=123&priority=HIGH`).
2. **Server Logic:** Sửa `src/app/helpdesk/page.tsx` (hoặc page list Ticket tương ứng).
   - Đọc `searchParams`.
   - Build biến `where` truyền vào `prisma.ticket.findMany({ where: ... })`.
   - Nhúng `<TicketFilterBar />` lên phía trên bảng danh sách.

### BƯỚC 3: A10 - Audit Log Consolidate
1. Mở báo cáo Audit (`audit-report-features-missing-ui.md`), tra cứu phần A10 để biết đích xác file nào đang bị duplicate. (Thường là có 1 trang `/audit-log` ở root và 1 trang `/settings/audit-log`).
2. Xóa bỏ hoàn toàn cái thư mục rác không dùng đến.
3. Sửa lại `src/components/Sidebar.tsx`, đảm bảo link Lịch sử hệ thống chỉ trỏ đúng về `/settings/audit-log`.

### Kiểm thử tổng hợp
- Chạy `tsc` để kiểm tra lỗi build.
- Tạo thử 1 Team Helpdesk, add 2 user vào.
- Vào trang Ticket, lọc thử theo Team vừa tạo xem có ra kết quả đúng không.
- Bấm vào link Audit Log trên Sidebar xem có lỗi 404 không (đảm bảo đã trỏ đúng route).
