# MSEW: B14-B15 - CSV Data Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Xây dựng hệ thống Import/Export dữ liệu hàng loạt bằng file CSV cho các bảng: License, User, Ticket, Maintenance.

## B14. CSV Import cho License/User
1. **Thư viện:** Khuyên dùng `papaparse` hoặc thư viện csv-parser nhẹ nhàng trên server.
2. **UI:** Tạo trang chung `/settings/import` hoặc Modal tại trang `/users` và `/licenses`. Cung cấp file CSV mẫu cho người dùng tải về.
3. **Luồng xử lý:** 
   - Parse file -> Validate từng row (kiểm tra thiếu field bắt buộc).
   - Insert vào Database thông qua `prisma.user.createMany` hoặc `prisma.license.createMany`.
   - Trả về thông báo: "Thành công X dòng, Thất bại Y dòng".

## B15. CSV Export cho License/User/Ticket/Maintenance
1. **Tính năng:** Đã có nút Export ở bảng License (vừa làm xong ở A8). Giờ chỉ việc nhân bản nút này sang các bảng Users, Tickets, Maintenances.
2. **API:** Viết các Endpoint `GET /api/[module]/export` tương tự như `/api/licenses/export`. Query lấy data, parse sang text CSV và trả về HTTP Header `Content-Disposition: attachment; filename="..."`.
