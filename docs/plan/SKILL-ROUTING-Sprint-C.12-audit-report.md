# SKILL ROUTING: Sprint C.12 - Báo cáo Kiểm kê

## 1. Sidebar Navigation
- `src/components/Sidebar.tsx`: Thêm một mục (NavItem) mới vào nhóm `Vận hành & Hỗ trợ`. 
  - `name`: 'Kiểm kê'
  - `href`: '/reports/audit'
  - `icon`: CheckCircle2
  - `permissionKey`: 'reports.view'

## 2. Báo cáo (Reports)
- `src/app/reports/audit/page.tsx`: File chính chứa Server Component.
  - Implement các hàm fetch data từ Prisma (như `getCounters`, `getDueAssets`).
  - Dựng UI bằng Tailwind CSS (Khuyến khích copy style từ `src/app/reports/page.tsx` để giữ tính đồng bộ, đặc biệt là các component `StatCard`).
  
## 3. Thành phần phụ trợ (Components)
- `src/components/reports/audit/AuditTable.tsx` (Hoặc có thể nhúng trực tiếp vào file page.tsx nếu code không quá dài).
  - Bảng hiển thị thông tin chi tiết. Sử dụng các Badge UI (màu đỏ cho Overdue, vàng cho Due Soon) để tăng tính trực quan.
