# Tiêu chí Nghiệm thu (ACCEPTANCE): UI Overhaul

## 1. Tiêu chuẩn Chức năng
- [ ] Giao diện (Layout) thay đổi hoàn toàn: Xuất hiện Sidebar màu tối bên trái và thanh tìm kiếm Header ở trên cùng.
- [ ] Truy cập `/` (Trang chủ) hiển thị thành công Dashboard với 3 Card đếm số lượng tài sản (Tổng, Sử dụng, Hỏng).
- [ ] Giao diện `/assets` và `/assets/new` không bị vỡ bố cục khi nằm bên trong main wrapper.

## 2. Tiêu chuẩn Phi chức năng
- **Aesthetics (Thẩm mỹ):** Đúng tiêu chí Premium. Form phải có góc bo tròn lớn (`rounded-2xl`), shadow mượt mà (`shadow-sm`), font chữ sắc nét.
- **Responsive:** Sidebar tự động ẩn/hiện hoặc chuyển thành hamburger menu trên màn hình điện thoại (Tầng 2 có thể xử lý phần responsive này hoặc tạm bỏ qua nếu chỉ tập trung Desktop MVP).

## 3. Các bước Manual Verification
```powershell
npm run dev
# Mở localhost:3000 -> Phải thấy Dashboard mới.
# Chuyển qua localhost:3000/assets -> Bảng danh sách phải nằm gọn trong khung nền xám nhạt (bg-gray-50).
```
