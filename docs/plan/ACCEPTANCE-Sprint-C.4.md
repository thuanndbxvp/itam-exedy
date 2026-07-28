# Tiêu chí Nghiệm thu (ACCEPTANCE): Sprint C.4 - Nâng cấp UX & Security

## 1. Tiêu chuẩn Chức năng (Functional Criteria)
- [ ] Tính năng Xóa tài sản ở cả Danh sách và Chi tiết phải có form nhập mật khẩu. Nếu nhập sai mật khẩu sẽ báo lỗi 403. Nếu đúng, tài sản bị soft-delete và sinh ra 1 record `ActionLog` ghi nhận sự kiện này.
- [ ] Bất kỳ thao tác Lưu/Cập nhật tài sản thành công nào cũng phải hiện 1 Toast Notification màu xanh lá thay vì chỉ âm thầm chuyển trang.
- [ ] Không còn bất kỳ hàm `alert()` nào được sử dụng trong codebase (Đã chuyển thành Toast error/success).
- [ ] Không còn bất kỳ hàm `confirm()` nào được sử dụng trong codebase (Đã chuyển thành Custom Modal UI).
- [ ] Form "Vị trí" phải được hiển thị thành 2 cột dàn đều trên Desktop.
- [ ] Các icon Tooltips `?` hiển thị đúng ở form Khấu hao và form Vị trí, hover vào phải nổi text giải thích.
- [ ] Cột ở bảng tài sản hiển thị đúng là "Người/Vị trí/Thiết bị giữ". 
- [ ] Block User Profile ở Sidebar trái đã hoàn toàn bị loại bỏ.

## 2. Tiêu chuẩn Phi chức năng (Non-functional)
- **Hiệu năng:** Việc load `<Toaster />` ở RootLayout không làm giảm hiệu năng FCP của ứng dụng.
- **Bảo mật:** Không lưu trữ mật khẩu tạm thời ở bất kỳ đâu ngoài Local State (`useState`) của Component.
- **Trải nghiệm (UX):** Tooltip không bị che khuất bởi z-index của các Modal hay Element khác.

## 3. Mục tiêu Test Coverage
- Cấu hình TypeScript phải Pass 100%: Lệnh `npx tsc --noEmit` không trả ra bất kỳ warning hay error nào.

## 4. Các bước Manual Verification (Windows)
(Dành cho Tầng 3 Auditor tự chạy kiểm tra)
```powershell
# Bước 1: Khởi động app
npm run dev

# Bước 2: Test bảo mật
# 2.1: Truy cập trang Danh sách tài sản -> Chọn 1 tài sản -> Bấm nút Xóa (Thùng rác)
# 2.2: Modal hiện lên -> Nhập sai mật khẩu -> Xác nhận báo lỗi.
# 2.3: Nhập đúng mật khẩu đăng nhập -> Xác nhận tài sản biến mất (Soft-delete).

# Bước 3: Test Toast
# 3.1: Truy cập Tạo tài sản -> Lưu -> Thấy Toast hiện lên.

# Bước 4: Kiểm tra Codebase (Không còn alert/confirm)
# 4.1: Chạy lệnh tìm kiếm
git grep "alert("
git grep "confirm("
# Nếu không ra kết quả -> ĐẠT!

# Bước 5: Build Check
npx tsc --noEmit
```
