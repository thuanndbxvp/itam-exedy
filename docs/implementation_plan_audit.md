# Kế hoạch Triển khai: Security Hotfixes & Lifecycle Management

Kế hoạch này tích hợp việc vá toàn bộ các lỗ hổng bảo mật (từ báo cáo Security Audit & Phase 3 Test Harness) và phát triển mới 4 tính năng quản lý vòng đời tài sản (từ Feature Audit). Để đảm bảo hệ thống ổn định, công việc được chia làm 3 Phase.

## Open Questions
1. **Trường dữ liệu Bảo trì (Maintenance):** Bảng `AssetMaintenance` dự kiến sẽ gồm các trường: `title` (Tên đợt sửa chữa), `supplierId` (Đối tác/Nhà cung cấp), `cost` (Chi phí), `startDate`, `completionDate`, và `notes`. Cấu trúc này đã đáp ứng đủ nghiệp vụ của bạn chưa?
2. **Giao diện Employee Dashboard:** Giao diện này sẽ rất tối giản, chỉ hiển thị "Tài sản đang mượn", "License đang dùng" và nút "Tạo Ticket Helpdesk". Bạn có muốn bổ sung thêm thành phần nào không?

---

## Phase 1: Vá lỗ hổng Bảo mật (P0 & P1)
*Tập trung khóa các cổng rò rỉ dữ liệu và ngăn chặn tấn công chiếm quyền.*

### 1.1 Ngăn chặn Privilege Escalation & Lỗi API (F1, Phase 3.1)
#### [MODIFY] [src/app/api/settings/users/[id]/route.ts](file:///d:/IT-management/src/app/api/settings/users/[id]/route.ts)
- Bổ sung Guard (Fail-secure): Nếu payload có chứa `role` hoặc `customRoleId`, yêu cầu bắt buộc quyền `users.manage_roles`.

#### [MODIFY] [src/app/api/permissions/route.ts](file:///d:/IT-management/src/app/api/permissions/route.ts) & [roles/route.ts](file:///d:/IT-management/src/app/api/permissions/roles/route.ts)
- Thêm block `try/catch` và `requirePermissionApi` để tránh lỗi 500 khi Employee cố truy cập trái phép.

### 1.2 Tenant Isolation & Chống rò rỉ dữ liệu (F2, F3, F8, F9)
#### [MODIFY] [src/app/api/search/route.ts](file:///d:/IT-management/src/app/api/search/route.ts)
- Ép điều kiện lọc `assignedUserId` nếu người dùng là `EMPLOYEE` để tránh rò rỉ danh bạ và tài sản toàn công ty.

#### [MODIFY] API Reports (`summary`, `assets-by-category`, `assets-by-status`)
- Thêm `requirePermissionApi('reports.view')`. Trả về 403 nếu không có quyền.

#### [MODIFY] [src/app/api/helpdesk/my-assets/route.ts](file:///d:/IT-management/src/app/api/helpdesk/my-assets/route.ts)
- Xóa hẳn trường `productKey` khỏi response API này. Trên UI chi tiết License (`src/app/licenses/[id]/page.tsx`), áp dụng thuật toán che key (`••••-••••-••••-1234`) cho các user không phải ADMIN.

### 1.3 Tenant Isolation trên UI (F4, F5, F6, F7, F10)
#### [MODIFY] [src/app/page.tsx](file:///d:/IT-management/src/app/page.tsx)
- Rẽ nhánh UI: Nếu `role === 'EMPLOYEE'` render `<EmployeeDashboard />` (giao diện hoàn toàn mới). Nếu không, render `<AdminDashboard />` (chứa Audit log). Triệt tiêu lỗi F10.

#### [MODIFY] [src/app/assets/page.tsx](file:///d:/IT-management/src/app/assets/page.tsx) & [src/app/assets/[id]/page.tsx](file:///d:/IT-management/src/app/assets/[id]/page.tsx)
- Truyền param `assignedUserId: session.user.id` vào truy vấn Prisma nếu user là `EMPLOYEE`. Bắn 404 (Not Found) nếu truy cập ID tài sản của người khác. Tương tự cho `licenses/page.tsx`.

---

## Phase 2: Database Schema & Lịch sử Tài sản
*Xây dựng bảng mới và làm giao diện Lịch sử (Feature 1 & 2).*

### 2.1 Schema Updates
#### [MODIFY] [prisma/schema.prisma](file:///d:/IT-management/prisma/schema.prisma)
- [NEW] Model `AssetMaintenance`:
  - Quan hệ 1-N với `Asset`.
  - Quan hệ 1-N với `Supplier` (nhà thầu/đối tác sửa chữa).
  - Chứa `cost` (Decimal), `startDate`, `completionDate`, `notes`.

### 2.2 Giao diện Lịch sử
#### [MODIFY] [src/app/assets/[id]/page.tsx](file:///d:/IT-management/src/app/assets/[id]/page.tsx) & `AssetDetailClient.tsx`
- Bổ sung cấu trúc Tabs (Tổng quan, Lịch sử cấp phát, Lịch sử sửa chữa).
- **Tab Lịch sử cấp phát:** Truy vấn bảng `ActionLog` để hiển thị dòng thời gian ai đã mượn/trả thiết bị này.
- **Tab Lịch sử sửa chữa:** Hiển thị danh sách `AssetMaintenance`. Bổ sung modal "Thêm lịch sử sửa chữa".

#### [MODIFY] [src/app/licenses/[id]/page.tsx](file:///d:/IT-management/src/app/licenses/[id]/page.tsx)
- Bổ sung cấu trúc Tabs. Thêm Tab Lịch sử cấp phát tương tự (Query `ActionLog` theo `ItemType.LICENSE_SEAT`).

---

## Phase 3: Hệ thống Cảnh báo Chủ động (Proactive Alerts)
*Xây dựng các Widget cảnh báo lên Admin Dashboard (Feature 3 & 4).*

### 3.1 Proactive Alert Widgets
#### [MODIFY] `src/components/dashboard/AdminDashboard.tsx` (Component tách ra từ page.tsx)
- [NEW] Component `LicenseExpiryAlert`: Truy vấn các License có `expirationDate` trong vòng 30 ngày tới. Hiển thị danh sách màu đỏ cam nổi bật.
- [NEW] Component `AssetEolAlert`: Truy vấn các Tài sản có `assetEolDate` trong vòng 60 ngày tới, hoặc đã qua ngày mua một thời gian dài (dựa theo tuổi đời khấu hao). Cảnh báo "Tài sản cần nâng cấp".

## Verification Plan
### Automated Tests
- Chạy lệnh `bunx prisma db push` và `bunx prisma generate` để áp dụng Schema.
- Chạy script `scratch/run_phase3.ts` (Test Harness) lại một lần nữa. Yêu cầu toàn bộ các test case ở Phase 3.1, 3.2 và 3.3 đều phải hiển thị **PASS** (mã lỗi 403 hoặc 404).

### Manual Verification
- Đăng nhập bằng `nguyenha@congty.com` (EMPLOYEE): Kiểm tra Dashboard mới, vào mục Tài sản không thấy máy tính của người khác.
- Đăng nhập bằng Admin: Kiểm tra chi tiết 1 Tài sản, xem tab Lịch sử cấp phát, thử tạo 1 phiếu Sửa chữa mới, và xem Widget Cảnh báo trên màn hình chính.
