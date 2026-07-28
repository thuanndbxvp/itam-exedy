# PLAN: Sprint C.6 - Asset-centric Tickets (Dành riêng cho IT)

## 1. Mục tiêu (Context)
Hiện tại, Helpdesk được thiết kế theo hướng người dùng báo lỗi (User-centric): một người chỉ được tạo ticket cho thiết bị mình sở hữu. Tuy nhiên, phòng IT cần một cơ chế tạo Ticket (giống Work Order / Task bảo trì) cho **BẤT KỲ** thiết bị hoặc phần mềm nào trong công ty để theo dõi tiến độ công việc, mà không cần mượn danh nghĩa hay ép buộc người dùng khác làm Reporter.

## 2. Giải pháp Kiến trúc
1. **Mở khóa API:** Bỏ qua quy tắc `canReportForAsset` nếu `session.user.role` thuộc khối IT. IT Staff đóng vai trò là Reporter cho Ticket bảo trì nội bộ.
2. **API Tìm kiếm:** Xây dựng endpoint `/api/helpdesk/search-assets` lấy tham số `?q=` để tìm kiếm mọi tài sản/license dựa trên tên và mã (Asset Tag), trả về giới hạn 20 kết quả.
3. **Giao diện Tương thích:** Trong `src/app/helpdesk/new/page.tsx`:
   - Xác định quyền người dùng đang xem trang.
   - Nếu là Employee: Giữ nguyên thẻ `<select>` tĩnh gọi từ `my-assets`.
   - Nếu là IT: Thay thế `<select>` bằng **Autocomplete Async (Search input)** kết nối với `search-assets`.

## 3. Các file bị ảnh hưởng
- `src/app/api/tickets/route.ts`
- `src/app/api/helpdesk/search-assets/route.ts` (Mới)
- `src/app/helpdesk/new/page.tsx`
