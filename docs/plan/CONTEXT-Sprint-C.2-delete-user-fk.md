# CONTEXT: Sprint C.2 - Delete User FK Fix

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Xử lý tận gốc lỗi P2003 (Foreign Key Constraint) chặn đứng việc Admin xóa user khỏi hệ thống.

## Quyết định của Planner
Sau khi review chi tiết nguyên nhân ở `bug-report-delete-user-fk-constraint.md`, tôi quyết định triển khai **Approach D (Hybrid) kết hợp Approach B (Cascade FK)**:
1. Sửa schema database để các khóa ngoại trỏ về User chuyển thành `SetNull` (Tránh block DB Level).
2. Xây dựng logic Xóa mềm (Soft-delete) ẩn danh PII để ưu tiên giữ lịch sử audit.

Sự kết hợp này vừa đảm bảo tuân thủ GDPR, giữ được Audit Log, vừa cho phép Admin xóa cứng hoàn toàn nếu muốn dọn rác hệ thống (khi đó các bản ghi cũ sẽ tự động set NULL field userId).

## Scope
1. Sửa file `prisma/schema.prisma` và migrate.
2. Nâng cấp API `DELETE /api/settings/users/[id]`.
3. Filter soft-deleted user ở Backend.
4. UI graceful degradation: Các trang có hiển thị Tên người dùng phải handle trường hợp `null`.

## Impact & Risks
- **Impact:** Gỡ bỏ block khó chịu nhất ở phân hệ Admin.
- **Risks:** Khi schema thành Nullable, bất cứ chỗ nào ở code UI hoặc API đang access dạng `ticket.reporter.firstName` sẽ bị TypeScript báo lỗi (object is possibly null) hoặc Runtime crash. Tier 2 phải update lại kiểu dữ liệu và UI cẩn thận.
