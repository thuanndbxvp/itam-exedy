# MSEW: A2 - Audit Log Drill-down & JsonDiff

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Cho phép người dùng bấm vào một bản ghi Audit Log để đi đến trang chi tiết của đối tượng đó. Đồng thời, tái sử dụng logic so sánh dữ liệu (Diff) để hiển thị chi tiết "cái gì vừa bị thay đổi" ngay trong bảng Audit Log.

## Các bước thực thi chi tiết (Dành cho Tier 2)

### Bước 1: Trích xuất Component `JsonDiff`
- File gốc: Mở `src/components/assets/AssetHistoryTimeline.tsx`. 
- Cắt (Cut) toàn bộ logic của component nội bộ `FieldDiff` (khoảng line 89-211) ra một file mới hoàn toàn.
- File mới: Tạo `src/components/audit/JsonDiff.tsx`.
- Refactor `JsonDiff` để nó nhận props: `{ oldValues: any, newValues: any }`.
- Export mặc định (default export) component này.
- Quay lại file `AssetHistoryTimeline.tsx`, import `JsonDiff` và truyền props vào thay thế chỗ cũ.

### Bước 2: Di chuyển và Cập nhật `AuditLogTable.tsx`
- File gốc đang nằm ở: `src/components/reports/AuditLogTable.tsx`.
- Chuyển file này sang thư mục đúng: `src/components/audit/AuditLogTable.tsx` (cập nhật lại đường dẫn import ở `src/app/settings/audit-log/page.tsx`).
- Mở `AuditLogTable.tsx`, thêm một cột mới tên là **"Đối tượng"**.
- Ở cột này, hiển thị `itemType` và một phần của `itemId` (vd: `itemId.slice(0,8)`).
- Bọc cột này bằng thẻ `<Link>` để điều hướng đến trang chi tiết tương ứng, sử dụng hàm helper sau:
  ```typescript
  function getEntityLink(type: string, id: string) {
    switch(type) {
      case 'USER': return `/settings/users/${id}`;
      case 'ASSET': return `/assets/${id}`;
      case 'LICENSE': return `/licenses/${id}`;
      case 'CATEGORY': return `/settings/categories/${id}`;
      case 'LOCATION': return `/settings/locations/${id}`;
      case 'DEPARTMENT': return `/settings/departments/${id}`;
      case 'STATUS': return `/settings/statuses/${id}`;
      case 'ROLE': return `/settings/permissions/${id}`;
      default: return '#';
    }
  }
  ```

### Bước 3: Tích hợp `JsonDiff` vào bảng Audit
- Vẫn trong `AuditLogTable.tsx`, làm cho mỗi hàng (row) của bảng có thể bấm mở rộng (expandable row).
- Khi mở rộng hàng, lấy `oldValues` và `newValues` của record đó (dưới dạng JSON parse nếu cần) truyền vào component `<JsonDiff oldValues={...} newValues={...} />`.

### Bước 4: Cập nhật `LicenseHistoryTimeline.tsx` (Tùy chọn/Nếu có)
- Tương tự như `AssetHistoryTimeline`, import và sử dụng `<JsonDiff />` để render lịch sử thay đổi của Bản quyền.

### Bước 5: Kiểm thử
- Vào trang **Settings > Lịch sử hệ thống (Audit Log)**.
- Thử bấm vào ID của một Tài sản/User bất kỳ xem có bay đúng sang trang chi tiết không.
- Bấm mở rộng một record xem bảng màu xanh đỏ (Diff) hiển thị dữ liệu thay đổi có chuẩn xác không.
