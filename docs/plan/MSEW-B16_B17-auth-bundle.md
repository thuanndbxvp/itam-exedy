# MSEW: B16-B17 - Advanced Auth Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Xây dựng luồng Quên mật khẩu qua Email và Xác thực 2 bước (2FA TOTP).

## B16. Forgot password email flow
1. **Lưu ý:** Code infrastructure cho vụ gửi Email (`sendEmail` và hàm mã hoá `crypto.ts`) đã được viết sẵn trong thư mục `src/lib/email`.
2. **Database:** Cần bảng `ResetPasswordToken` hoặc nhét tạm token vào cột của User nếu lười.
3. **UI Trang Login:** Thêm nút "Quên mật khẩu". Bấm vào hiện form nhập Email.
4. **Luồng Email:** Xử lý Route sinh Token ngẫu nhiên (lưu DB), và dùng `sendEmail` gửi 1 link chứa param `?token=XYZ` tới user.
5. **UI Trang Đặt lại Pass:** Trang `/reset-password` bắt token từ URL. Yêu cầu nhập Pass mới. Mã hoá pass (Bcrypt) và lưu vào bảng User, xóa token.

## B17. 2FA TOTP enrollment
1. **Thư viện:** Khuyên dùng `otplib` (để sinh secret key) và `qrcode` (để render mã QR). Cài qua npm.
2. **Database:** Schema User cần thêm cột `twoFactorSecret` (chuỗi) và cờ `twoFactorEnabled` (boolean). Lưu ý cần 1 command Migration nhỏ.
3. **UI Cài đặt:** Tại trang Cài đặt Hồ sơ, thêm mục "Xác thực 2 bước". Bấm bật -> Render mã QR (gọi API sinh Secret rồi trả về Data URI). User quét bằng Google Authenticator và nhập mã 6 số để xác nhận. API kiểm tra mã, nếu đúng thì bật cờ `twoFactorEnabled = true` lưu vào DB.
4. **UI Login:** Sửa luồng NextAuth credential login: Sau khi nhập đúng Pass, check cờ `twoFactorEnabled`. Nếu true -> Render màn hình thứ 2 bắt nhập mã 6 số. Nếu sai từ chối cho vào.
