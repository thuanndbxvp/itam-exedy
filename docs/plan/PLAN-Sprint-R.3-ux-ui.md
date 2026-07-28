# PLAN: Sprint R.3 - UX/UI Refactor

## 1. Lý do cần thiết (Context)
- **UX Smell:** Menu "Báo cáo" hiện tại có dạng dropdown (lồng nhau) chứa "Tổng quan" và "Chi phí IT". Điều này làm tốn thao tác click. Hơn nữa, khối User Profile bị lặp lại ở cả Sidebar và Header gây lãng phí không gian Sidebar.
- **Thẩm mỹ (UI):** Nhóm cài đặt danh mục đang dùng chung một icon `LayoutGrid` gây nhàm chán. Tiêu đề các nhóm chức năng (Group Headers) nằm quá sát với menu con, thiếu đường phân cách khiến thanh Sidebar trở nên khó nhìn, trôi tuột.

## 2. Giải pháp Kiến trúc
1. **Trải phẳng Menu:** Tách "Chi phí IT" thành menu ngang hàng với "Báo cáo". Đổi icon đặc trưng cho các menu danh mục.
2. **Dọn dẹp Sidebar:** 
   - Xóa bỏ khối hiển thị thông tin User (Avatar, Tên, Role) và nút Đăng xuất (Logout) ở cột trái.
   - Thêm khoảng trống (`mt-5`), đổi màu chữ nhạt hơn (`text-slate-500`) và kẻ vạch trên (`border-t`) cho các Group Headers để tạo sự phân tầng rõ rệt.

## 3. Danh sách File bị ảnh hưởng
- `src/components/Sidebar.tsx`
