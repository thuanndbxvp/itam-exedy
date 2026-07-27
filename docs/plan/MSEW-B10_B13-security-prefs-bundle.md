# MSEW: B10-B13 - Security & Preferences Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Hoàn thiện bảng Cài đặt Thông báo, Luồng gửi mã OTP, Quản lý thiết bị đăng nhập và Lịch sử nhân sự.

## B10. Notification preferences per-user
1. **Lưu ý:** Bắt buộc phải chạy **Sprint D** (Tạo bảng `UserPreference` trong DB) trước khi code chức năng này.
2. **UI:** Tạo trang `/settings/profile/notifications`.
3. **Tính năng:** Có các công tắc (Toggle) để User bật/tắt việc nhận Email khi: "Được gán tài sản", "Tài sản sắp hết hạn", "Báo cáo hàng tuần". Gọi API update vào bảng `UserPreference`.

## B11. Email/Phone update OTP
1. **Ngữ cảnh:** Khi User muốn đổi SĐT hoặc Email trong trang Hồ sơ cá nhân.
2. **Tính năng:** Không cho phép lưu trực tiếp. Khi nhập SĐT/Email mới, bấm Lưu sẽ hiện 1 Modal yêu cầu nhập mã OTP (Mã này được gửi qua hàm `sendEmail` hiện có ở file `src/lib/email/crypto.ts`).
3. **Database:** Có thể lưu tạm OTP vào cache hoặc tạo 1 bảng nhỏ `OtpToken`. Nhập đúng 6 số mới thực thi `prisma.user.update`.

## B12. Active sessions management
1. **Ngữ cảnh:** Giống như Facebook, cho phép xem mình đang đăng nhập ở các thiết bị nào.
2. **Tính năng:** Thêm trang `/settings/profile/sessions`.
3. **Note:** Vốn dĩ NextAuth có bảng `Session` trong DB schema. Lấy danh sách các session có `userId = current_user`.
4. **Action:** Hiện nút "Đăng xuất khỏi thiết bị này" (Xóa record session trong DB).

## B13. Per-user history timeline
1. **UI:** Tại trang chi tiết nhân sự `/settings/users/[id]`, thêm tab "Lịch sử hệ thống" (Timeline).
2. **Data:** Truy vấn bảng `ActionLog` với điều kiện `targetUserId = userId` hoặc `actorId = userId`. Render danh sách giống y hệt trang Audit Log nhưng được fill sẵn điều kiện lọc.
