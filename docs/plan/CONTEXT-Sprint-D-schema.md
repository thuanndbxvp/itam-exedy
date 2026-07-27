# CONTEXT: Sprint D - UserPreference Schema Migration

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Liên kết:** MSEW-Sprint-D-schema.md, ACCEPTANCE-Sprint-D-schema.md
**Mục tiêu:** Cập nhật cơ sở dữ liệu để hỗ trợ tính năng Cấu hình cá nhân (User Preferences), đặc biệt là cài đặt tần suất nhận Email thông báo. Đây là Blocker bắt buộc phải làm trước khi code tính năng Thông báo (B10).

## Background & Scope

Hệ thống sắp tới (Sprint B10) sẽ yêu cầu gửi email thông báo định kỳ (Daily Digest, Weekly Digest) hoặc mute thông báo tạm thời cho từng nhân sự. Tuy nhiên, DB hiện tại chưa có chỗ lưu trữ các cấu hình này của User.

**Bao gồm:**
- Sửa file lõi `prisma/schema.prisma`: Thêm model `UserPreference`.
- Khai báo quan hệ (Relation) 1-1 giữa `User` và `UserPreference` với tuỳ chọn `onDelete: Cascade`.
- Chạy lệnh migration của Prisma để update database cục bộ.
- Viết một script seed (hoặc lệnh script nhỏ) để insert các dòng cấu hình mặc định (vd: `emailDigestFrequency = DAILY`) cho **tất cả** các User đã tồn tại trong Database, tránh lỗi crash khi truy vấn.

## Impact & Risks

**Impact:**
- Đụng chạm trực tiếp tới DB Schema (rất nhạy cảm).
- Ảnh hưởng đến toàn bộ User trong hệ thống.

**Risks:**
- **R1:** Migration thất bại nếu dữ liệu cũ bị xung đột. (Cách phòng ngừa: Test trên local kỹ).
- **R2:** Lỗi mất dữ liệu nếu thiết lập sai cờ Cascade delete. Cần đảm bảo xoá User thì xoá Preference, nhưng TUYỆT ĐỐI KHÔNG làm ngược lại.
- **R3:** Lỗi "Cannot return null" trong NextAuth hoặc các truy vấn Prisma cũ nếu script Seed chạy không triệt để cho 100% user.
