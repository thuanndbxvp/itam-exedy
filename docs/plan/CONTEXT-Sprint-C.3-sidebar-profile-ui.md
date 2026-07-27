# CONTEXT: Sprint C.3 - Sidebar & Profile Redesign

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder - React/UI)

## Vấn đề hiện tại
- **Sidebar chính:** Đang nhồi nhét quá nhiều Menu vào 1 dropdown mang tên "Cài đặt". Điều này gây ra UX tồi tệ vì người dùng phải cuộn dài, và sai lệch về logic nghiệp vụ (ví dụ: Cấu hình danh mục tài sản lại bị nhét chung với cài đặt Email hệ thống).
- **Trang Profile:** Bị kẹp bởi 2 cột menu (1 cột Sidebar chính màu đen, 1 cột Sidebar phụ màu trắng). Điều này bóp nghẹt diện tích hiển thị nội dung, thao tác cực kỳ khó chịu.

## Giải pháp triển khai
1. Sắp xếp lại mảng `navigation` trong `Sidebar.tsx` dựa theo đúng luồng ERP (Enterprise Resource Planning) chuẩn, nhóm thành 5 Header: Tổng quan, Tài sản, IT Ops, Nhân sự, Hệ thống.
2. Xóa sổ cột menu phụ ở trang Account, chuyển nó lên trên (Top Navbar/Tabs), giúp giao diện Profile rộng mở như Github/Facebook.

## Rủi ro & Lưu ý
- Khi di chuyển các trang `/settings/xyz` ra khỏi "Settings dropdown", đường dẫn URL **TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỔI**. Việc thay đổi chỉ nằm ở mặt hiển thị UI trên Sidebar.
- Việc tính toán trạng thái "Active" của menu cần xem lại để highlight chính xác thẻ đang chọn.
