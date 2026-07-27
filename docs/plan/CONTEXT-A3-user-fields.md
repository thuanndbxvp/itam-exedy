# CONTEXT: A3 - User form bổ sung fields

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Liên kết:** MSEW-A3-user-fields.md, ACCEPTANCE-A3-user-fields.md
**Mục tiêu:** Cập nhật API và Form người dùng để hỗ trợ đầy đủ hơn 20+ trường thông tin (Identity, Contact, Org, Flags) có sẵn trong cơ sở dữ liệu.

## Background

Mặc dù schema Database (`prisma/schema.prisma`) đã có hơn 30 trường cho bảng `User`, nhưng UI (`EditUserForm.tsx` và `NewUserForm.tsx`) cũng như API (`/api/settings/users/[id]/route.ts`) hiện tại chỉ xử lý 7 trường cơ bản (firstName, lastName, email, role, jobTitle, departmentId, customRoleId). Điều này khiến người quản trị không thể nhập đầy đủ hồ sơ nhân sự (SĐT, Địa chỉ, Trạng thái hoạt động, v.v.).

## Scope (MVP 1.5 ngày)

**Bao gồm:**
- Sửa `src/app/api/settings/users/[id]/route.ts` để mở rộng whitelist nhận thêm các trường.
- Thêm cơ chế validation cho username (unique), employeeNum (unique).
- Nâng cấp `EditUserForm.tsx` và `NewUserForm.tsx` để render giao diện nhập liệu phân nhóm (Tabs hoặc Sections).
- Sửa `UsersTable.tsx` để hiển thị thêm một số cột quan trọng như Avatar, Số điện thoại.

**Không bao gồm (deferred):**
- Tính năng tự động gửi email chào mừng khi tạo User (làm ở Epic H).
- Tính năng cắt xén hình ảnh (crop) khi upload avatar.

## Impact & Risks

**Impact:**
- Touches 4 files (API, Forms, Table).
- Tăng giá trị sử dụng hệ thống ngay lập tức cho bộ phận HR/IT.

**Risks:**
- **R1:** Vô tình expose field `password` hoặc `twoFactorSecret` ở API GET/PUT. Cần kiểm soát gắt gao whitelist.
- **R2:** Lỗi Unique constraint khi user nhập trùng `username` hoặc `employeeNum`. Cần xử lý lỗi graceful từ Prisma sang UI.
