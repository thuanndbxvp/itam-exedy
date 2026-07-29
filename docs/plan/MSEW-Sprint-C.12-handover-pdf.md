# MAKE SURE EVERYTHING WORKS (MSEW): Sprint C.12

## Checklist Kiểm thử (Test Cases)

### 1. In Biên bản PDF
- [ ] Cấp phát máy X cho User Y.
- [ ] Vào lịch sử, bấm nút "In Biên bản".
- [ ] Trình duyệt phải render ra file PDF có đầy đủ Tên máy X, Tên người Y, Ngày cấp, và ô chữ ký.
- [ ] CRITICAL: Font chữ tiếng Việt không bị lỗi (VD: không bị mất dấu hay biến thành hình vuông).

### 2. Luồng E-Sign
- [ ] Đăng nhập bằng tài khoản User Y.
- [ ] Vào trang Tài sản của tôi (My Assets).
- [ ] Bấm nút Xác nhận nhận máy X.
- [ ] Admin vào xem lại Lịch sử máy X, phải thấy log ghi "User Y đã xác nhận tiếp quản thiết bị vào ngày...".
