# MAKE SURE EVERYTHING WORKS (MSEW): Sprint C.11

## Checklist Kiểm thử (Test Cases)

### 1. Auto Workflow Sync
- [ ] Tạo một phiếu sửa chữa mới cho Asset X.
- [ ] Kiểm tra Asset X đã tự động bị đổi trạng thái thành "Đang sửa chữa" (hoặc không khả dụng) chưa.
- [ ] Cập nhật phiếu sửa chữa đó thành "Hoàn thành".
- [ ] Kiểm tra Asset X đã quay về trạng thái "Sẵn sàng cấp phát" (Deployable) chưa.

### 2. Health Score Engine
- [ ] Tạo Asset A: Mới mua hôm nay, chưa sửa chữa. Điểm phải = 100 (Màu Xanh).
- [ ] Tạo Asset B: Mua cách đây 6 năm, áp dụng khấu hao 3 năm (đã hết khấu hao). Điểm phải < 50 (Màu Đỏ - Đề xuất thay thế).
- [ ] Tạo Asset C: Sửa chữa 5 lần, tổng tiền sửa = 50% tiền mua. Điểm phải bị trừ tương ứng (Màu Vàng/Đỏ).

### 3. Virtual Inventory
- [ ] Truy cập trang `/assets`.
- [ ] Bấm nút lọc nhanh "Kho khả dụng" -> Bảng chỉ hiển thị những thiết bị có thể đem đi cấp phát ngay lập tức.
- [ ] Bấm nút "Đang đi sửa" -> Bảng chỉ hiển thị thiết bị đang nằm ở vendor.
