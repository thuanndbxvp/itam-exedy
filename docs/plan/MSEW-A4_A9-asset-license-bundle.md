# MSEW: A4-A5-A8-A9 - Asset, License & Maintenance Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Thi công 4 tính năng lớn theo cơ chế gộp task.

## Các bước thực thi chi tiết (Dành cho Tier 2)

### BƯỚC 1: A4 - Asset "Mark Audited"
1. **API:** Tạo endpoint `POST /api/assets/[id]/audit`.
   - Update bảng `Asset`: gán `lastAuditDate = new Date()`.
   - Thêm 1 dòng vào bảng `AuditLog` (hoặc `AssetHistory`) ghi nhận "Asset was manually audited".
2. **UI:** Mở `src/app/assets/[id]/page.tsx` hoặc Component tương ứng hiển thị Header tài sản. Thêm nút **"Mark Audited"** (icon Check). Bấm vào gọi API trên, sau đó refresh data (hoặc dùng `router.refresh()`).

### BƯỚC 2: A5 - Depreciation CRUD
1. **API:** DB đã có bảng `Depreciation`. Đảm bảo các API `GET`, `POST`, `PUT`, `DELETE` cho `/api/settings/depreciations` đã hoạt động.
2. **UI:** Mở `src/app/settings/depreciations/page.tsx` (tạo nếu chưa có).
   - Render bảng danh sách quy tắc khấu hao.
   - Làm form Modal để Thêm/Sửa (nhập `name`, `months`, `minResaleValue` v.v. dựa theo Schema).
   - Nối API để Lưu và Xóa quy tắc.

### BƯỚC 3: A8 - License CSV Export & Bulk Seat
1. **Bulk UI:** Mở `src/app/licenses/page.tsx`. Thêm Checkbox ở đầu mỗi dòng (cập nhật Table Component để hỗ trợ `rowSelection`).
2. **Bulk Action:** Thêm Dropdown "Thao tác hàng loạt" phía trên bảng chứa 2 tuỳ chọn: 
   - **Xóa hàng loạt**: Gọi API `DELETE /api/licenses/bulk` (truyền mảng ID).
   - **Giao bản quyền hàng loạt**: Hiện Modal chọn User, rồi gọi API `POST /api/licenses/bulk-checkout` (nhớ bọc trong `prisma.$transaction` để gán user cho toàn bộ license được chọn).
3. **CSV Export:** Thêm nút "Xuất CSV". Bấm vào gọi hàm tạo file CSV client-side (nhờ thư viện `papaparse` hoặc tự build chuỗi phẩy) từ data đang hiển thị, rồi trigger tải xuống bằng thẻ `<a download>`.

### BƯỚC 4: A9 - Maintenance Global Page
1. **Sidebar:** Mở `src/components/Sidebar.tsx`, thêm menu item **Bảo trì** (`/maintenances`), icon `Wrench`.
2. **Page:** Tạo `src/app/maintenances/page.tsx`.
   - Fetch toàn bộ `prisma.maintenance.findMany({ include: { asset: true, supplier: true } })`.
   - Render thành một bảng lưới liệt kê Tên tài sản, Ngày bắt đầu, Ngày kết thúc, Chi phí, Loại bảo trì.
   - Thêm Filter searchParams (lọc theo Trạng thái bảo trì).

### Kiểm thử tổng hợp
- Chạy `tsc` để đảm bảo không gãy type sau khi sửa một loạt file.
- Check thử nút Mark Audited.
- Check thử tạo quy tắc Khấu hao.
- Check tải file CSV.
- Truy cập trang Maintenance tổng từ Sidebar.
