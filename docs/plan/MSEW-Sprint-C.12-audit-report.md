# MAKE SURE EVERYTHING WORKS (MSEW): Sprint C.12

## Checklist Kiểm thử (Test Cases)

### 1. Phân quyền và Menu
- [ ] Đăng nhập bằng tài khoản IT Staff hoặc Employee: Mở Sidebar, xác nhận KHÔNG thấy menu "Kiểm kê" ở dưới menu "Báo cáo".
- [ ] Đăng nhập bằng tài khoản Admin hoặc IT Manager: Xác nhận THẤY menu "Kiểm kê".

### 2. Giao diện trang Báo cáo
- [ ] Bấm vào menu "Kiểm kê", xác nhận hệ thống chuyển hướng sang trang `/reports/audit`.
- [ ] Xác nhận hiển thị đủ 3 thẻ thống kê (Quá hạn, Sắp đến hạn, An toàn).
- [ ] Xác nhận bên dưới có Bảng danh sách tài sản.

### 3. Logic dữ liệu
- [ ] Mở CSDL (Prisma Studio hoặc chỉnh sửa thủ công DB): Đổi `nextAuditDate` của tài sản A thành ngày hôm qua. Load lại trang báo cáo, xác nhận tài sản A lọt vào nhóm "Quá hạn".
- [ ] Đổi `nextAuditDate` của tài sản B thành 10 ngày nữa. Load lại trang báo cáo, xác nhận tài sản B lọt vào nhóm "Sắp đến hạn".
- [ ] Xác nhận bảng dữ liệu bên dưới có hiển thị tài sản A và B kèm theo người đang sử dụng (Nếu có).

### 4. Luồng xử lý công việc
- [ ] Bấm vào tên tài sản A trên bảng, xác nhận được chuyển sang trang Chi tiết tài sản.
- [ ] Bấm nút "Đánh dấu đã kiểm kê" trên trang chi tiết.
- [ ] Quay lại trang Báo cáo Kiểm kê, xác nhận tài sản A đã biến mất khỏi nhóm "Quá hạn" và số lượng "An toàn" tăng lên.
