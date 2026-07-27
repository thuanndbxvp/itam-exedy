# ACCEPTANCE: A4-A5-A8-A9 Bundle

**Người lập:** Tier 1 (Planner)

## Functional Acceptance

```
[ ] A4_1. Trang Chi tiết Tài sản có nút "Mark Audited" (Đánh dấu kiểm kê).
[ ] A4_2. Bấm "Mark Audited" sẽ update `lastAuditDate` thành thời điểm hiện tại và ghi 1 dòng log Audit.
[ ] A5_1. Trang Quản lý Khấu hao cho phép bấm "Tạo mới".
[ ] A5_2. Form Khấu hao cho phép nhập Tên quy tắc, Số tháng, Phần trăm khấu hao. Lưu thành công vào DB.
[ ] A8_1. Trang Licenses có nút Export CSV. Tải file về mở ra xem được dữ liệu.
[ ] A8_2. Trang Licenses có checkbox chọn nhiều dòng (Bulk Select).
[ ] A8_3. Action "Cấp phát hàng loạt" (Bulk Checkout) hoạt động (chọn n License, chọn 1 User, gán đồng loạt).
[ ] A9_1. Thanh Sidebar có link "Bảo trì" (Maintenances) nằm ở nhóm Quản lý.
[ ] A9_2. Trang /maintenances liệt kê toàn bộ lịch sử bảo trì (từ bảng `Maintenance`) kèm cột Tên tài sản.
```

## Security & Reliability

```
[ ] S1. Các API Bulk Checkout cần chạy trong DB Transaction (`prisma.$transaction`) để tránh lỗi cấp phát nửa chừng.
[ ] S2. Chỉ những người có quyền `assets.audit` mới thấy nút Mark Audited.
[ ] S3. Export CSV cần parse cẩn thận, tránh injection nếu tên License có chứa ký tự `,` hoặc `=`.
```
