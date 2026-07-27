# ACCEPTANCE: Sprint C.1 - IT Costs Report

**Người lập:** Tier 1 (Planner)

## Functional Acceptance

```
[ ] C1_1. Khi đăng nhập bằng tài khoản có quyền `reports.view` (Admin/IT_MANAGER), menu "Báo cáo" ở Sidebar xổ ra 2 mục: Tổng quan và Chi phí IT.
[ ] C1_2. Bấm vào "Chi phí IT", URL chuyển sang `/reports/costs` và tải giao diện báo cáo chi phí.
[ ] C1_3. Có thể dùng bộ lọc nhanh "Tháng này", "Quý này", "Năm nay" và số liệu trên 4 thẻ (Summary Cards) được cập nhật chính xác.
[ ] C1_4. Bảng danh sách bên dưới liệt kê đúng các khoản chi từ Asset (Mua mới), License (Mua phần mềm) và AssetMaintenance (Bảo trì/sửa chữa) trong khoảng thời gian đã chọn.
[ ] C1_5. Khi đăng nhập bằng tài khoản không có quyền (Employee), nếu cố tình gõ URL `/reports/costs`, hệ thống báo lỗi 403 / Không có quyền.
```

## Non-Functional
```
[ ] NF1. Backend xử lý kiểu `Decimal` của Prisma trả về JSON an toàn, không bị lỗi serialize.
[ ] NF2. API gom 3 truy vấn lại chạy song song bằng `Promise.all` để đảm bảo hiệu suất.
[ ] NF3. Bảng dữ liệu sắp xếp chi phí theo ngày giảm dần (mới nhất ở trên).
```
