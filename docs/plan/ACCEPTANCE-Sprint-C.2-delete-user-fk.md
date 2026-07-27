# ACCEPTANCE: Sprint C.2 - Delete User FK Fix

**Người lập:** Tier 1 (Planner)

## Functional Acceptance

```
[ ] C2_1. Bấm xóa 1 User trên giao diện mặc định sẽ gọi API soft-delete. User biến mất khỏi danh sách người dùng nhưng trong DB vẫn còn record với `deletedAt != null`.
[ ] C2_2. Tài khoản sau khi bị soft-delete không thể đăng nhập vào hệ thống.
[ ] C2_3. API có tham số `force=true`. Gọi API qua curl/postman với force=true xóa sạch user khỏi DB. Các ticket, comment do user đó tạo không bị lỗi mất mà field userID chuyển thành null.
[ ] C2_4. Giao diện trang chi tiết Ticket (chứa comment của user đã xóa cứng) vẫn load lên bình thường, Tên người dùng hiển thị là `[Đã bị xóa]` hoặc tương đương.
```

## Non-Functional
```
[ ] NF1. Chạy `npx tsc --noEmit` không báo lỗi ở bất kỳ file nào do ảnh hưởng của việc nullable schema.
[ ] NF2. Thông tin nhạy cảm của user (PII) phải được anonymize (làm mờ/đổi giá trị) khi soft-delete.
```
