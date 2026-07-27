# SKILL-ROUTING: A4-A5-A8-A9 Bundle

**Người lập:** Tier 1 (Planner)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | Khởi tạo API Mark Audited (A4) | `backend-engineer` | Cần cập nhật ngày tháng và log Audit action vào DB |
| 2 | CRUD Depreciation (A5) | `react-reviewer` + `backend-engineer` | Trọn bộ tạo Form UI và nối API POST/PUT/DELETE |
| 3 | Xuất CSV & Bulk License (A8) | `backend-engineer` | Xử lý file blob (CSV export) và mảng ID phức tạp (Bulk checkin/out) |
| 4 | Trang Maintenance Global (A9) | `ui-styling` + `react-reviewer` | Thiết kế Table Grid, Filter Bar toàn cục cho Maintenance |
| 5 | Test & Commit | Tier 2 | Tự test và commit |

## Skill Activation Order

```
1. (A4) Viết API POST /api/assets/[id]/audit -> Sửa UI Chi tiết tài sản.
2. (A5) Mở khóa nút Depreciation -> Code form -> Code API.
3. (A8) Viết logic Export CSV -> Code API Bulk -> Gắn vào UI Licenses.
4. (A9) Tạo thư mục /app/maintenances -> Code Table -> Add Sidebar.
5. tsc + build.
6. Commit.
```
