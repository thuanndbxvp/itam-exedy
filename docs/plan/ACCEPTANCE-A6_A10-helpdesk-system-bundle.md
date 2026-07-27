# ACCEPTANCE: A6-A7-A10 Bundle

**Người lập:** Tier 1 (Planner)

## Functional Acceptance

```
[ ] A6_1. Trang Helpdesk (Tickets) có thanh bộ lọc cho phép lọc theo Team, Assignee, Priority.
[ ] A6_2. Chọn lọc theo Priority = HIGH → URL đổi thành `?priority=HIGH` → bảng render đúng data.
[ ] A7_1. Tạo mới được Helpdesk Team trong `/settings/helpdesk-teams`.
[ ] A7_2. Gán được một hoặc nhiều User vào Helpdesk Team đó.
[ ] A7_3. Có thể xoá Team (nếu không có Ticket nào đang gán cho Team đó).
[ ] A10_1. Sidebar chỉ có duy nhất 1 link Lịch sử hệ thống trỏ về `/settings/audit-log`.
[ ] A10_2. Trang duplicate (nếu có ở root hoặc thư mục khác) đã bị xoá.
```

## Security & Auth

```
[ ] S1. Các thao tác Thêm/Sửa/Xoá Helpdesk Team chỉ dành cho người có quyền `helpdesk.manage_teams`.
[ ] S2. Xoá team phải check cẩn thận để không làm null (trống) trường data của các Ticket cũ nếu không dùng Cascade Delete (Tốt nhất là chặn xoá nếu có vé đang dùng).
```
