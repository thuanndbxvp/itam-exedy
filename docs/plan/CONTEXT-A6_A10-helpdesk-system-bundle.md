# CONTEXT: A6-A7-A10 - Helpdesk & System Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Liên kết:** MSEW-A6_A10-helpdesk-system-bundle.md, v.v.
**Mục tiêu:** Gộp 3 task cuối cùng của Sprint A thành một Bundle để tối ưu hóa context switch. Trọng tâm là hoàn thiện hệ thống Helpdesk và Dọn dẹp trang Audit Log.

## Background & Scope

Bundle này sẽ khép lại toàn bộ Sprint A với 3 tính năng:
1. **[A6] Ticket Filter:** Bảng danh sách Ticket (Yêu cầu hỗ trợ) hiện tại chỉ liệt kê chay. Cần có bộ lọc đa năng (Lọc theo Mức độ ưu tiên, Người xử lý, Team, Trạng thái SLA) bằng URL params.
2. **[A7] Helpdesk Team CRUD:** Database đã có bảng `HelpdeskTeam` nhưng không có giao diện quản lý. Cần tạo trang để Thêm/Sửa/Xóa Team, và quản lý thành viên (Users) trong mỗi Team.
3. **[A10] Audit Log Consolidate:** Hiện tại hệ thống đang có 2 trang Audit log dẫn tới cùng một dữ liệu, gây nhầm lẫn. Cần xoá trang thừa và gộp link điều hướng về một nguồn duy nhất (`/settings/audit-log`).

## Impact & Risks
- **Impact:** Làm sạch UI, tăng tốc độ điều phối công việc cho đội IT Support.
- **Risks:** Bảng Ticket có nhiều relation phức tạp (User, Asset, Team). Tier 2 cần cẩn thận khi build `where` clause trong Prisma cho phần Lọc Ticket để tránh lỗi query chậm.
