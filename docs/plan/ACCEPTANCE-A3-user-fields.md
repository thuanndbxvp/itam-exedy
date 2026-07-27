# ACCEPTANCE: A3 - User form bổ sung fields

**Người lập:** Tier 1 (Planner)

## Functional Acceptance

```
[ ] F1. Form Edit User / New User hiển thị đầy đủ ~20 fields (phân thành 4 nhóm: Identity, Contact, Org, Flags).
[ ] F2. Sửa thử một trường như `phone` hoặc `city` → Bấm Lưu → Báo thành công và dữ liệu được cập nhật.
[ ] F3. Bật/tắt cờ `activated` → Lưu lại → Có tác dụng chặn/cho phép user login (logic login có thể test sau).
[ ] F4. Nhập trùng `username` hoặc `employeeNum` → Lưu lại → API trả về lỗi và hiển thị thông báo lỗi trên UI.
[ ] F5. Bảng UsersTable hiển thị thêm cột Avatar (ảnh hoặc icon mặc định) và cột EmployeeNum.
```

## Security & API

```
[ ] S1. API endpoint `/api/settings/users/[id]/route.ts` tuyệt đối không chấp nhận field `password` hoặc `twoFactorSecret`.
[ ] S2. API trả về payload cũng không bao giờ expose `password` hash ra UI.
[ ] S3. Thay đổi `role` và `customRoleId` vẫn giữ nguyên logic yêu cầu quyền `users.manage_roles` (như cũ).
```
