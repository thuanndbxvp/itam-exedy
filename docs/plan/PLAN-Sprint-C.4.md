# PLAN: Sprint C.4 - Nâng cấp Trải nghiệm (UX) & Bảo mật (Security)

## 1. Lý do cần tái cấu trúc (Context & Code Smells)
Hệ thống ITAM hiện đang bộc lộ một số Code Smell liên quan đến UI/UX và lỗ hổng quy trình bảo mật:
- **Lỗ hổng quy trình (Security Smell):** Thao tác Xóa tài sản - một thao tác cực kỳ nhạy cảm liên quan đến lịch sử kế toán - hiện đang diễn ra quá mượt mà mà không có cơ chế xác thực kép (Re-authentication). Điều này dễ dẫn đến rủi ro nhân sự xóa nhầm hoặc cố tình xóa dấu vết.
- **UX Smell (Alert/Confirm):** Ứng dụng lạm dụng quá nhiều các hàm `alert()` và `confirm()` nguyên thủy của trình duyệt. Việc này làm luồng UI bị block cứng (blocking thread), giao diện không đồng bộ (nhìn rẻ tiền) và không đúng chuẩn của các hệ thống Enterprise.
- **UX Smell (Thiếu giải nghĩa):** Các nghiệp vụ phức tạp như "Khấu hao" hoặc khái niệm phân cấp "Trực thuộc" trong Vị trí đang bị bỏ ngỏ, thiếu các Tooltips giải thích ngữ nghĩa khiến người dùng cấp thấp hoang mang.
- **UI Smell (Lãng phí không gian):** Form tạo Vị trí (Location) thiết kế 1 cột quá dài; khối Profile ở Sidebar trái bị lặp lại vô nghĩa (đã có ở Navbar trên).

## 2. Giải pháp Kiến trúc & Luồng dữ liệu (Data Flow)
- **Luồng Xóa Tài sản an toàn:** `User click Delete` -> `Bật Modal yêu cầu Password` -> `API nhận Password, query User DB, dùng bcrypt.compare()` -> `Nếu OK: Prisma update deletedAt (Soft-delete) + Ghi ActionLog` -> `Trả về Frontend gọi Toast thành công`.
- **Hệ thống Notification tập trung:** Triển khai thư viện `react-hot-toast` bọc ở `RootLayout`. Mọi tương tác CRUD thành công hay thất bại từ client component sẽ gọi hàm `toast.success()` / `toast.error()` không blocking.
- **Custom Modal UI:** Khai tử toàn bộ `window.confirm()`. Thay bằng `<Modal>` Component có sẵn (`src/components/ui/Modal.tsx`) kết hợp React State (`isOpen`, `confirmId`) để quản lý luồng xác nhận.

## 3. Danh sách các file cần sửa chữa

**Bảo mật Xóa Tài sản:**
- `src/app/api/assets/[id]/route.ts` (Sửa logic DELETE)
- `src/app/assets/AssetsPageClient.tsx` (Thêm input Password vào Modal)
- `src/app/assets/[id]/AssetDetailClient.tsx` (Thêm input Password vào Modal)

**UI/UX Toast & Alert:**
- `package.json` (Cài `react-hot-toast`)
- `src/app/layout.tsx` (Gắn `<Toaster />`)
- `src/app/assets/create/page.tsx` & `src/app/assets/[id]/edit/page.tsx` (Thêm Toast khi Save)
- Các file xóa `alert()`: `src/app/helpdesk/page.tsx`, `src/components/assets/AssetMaintenanceList.tsx`, `src/components/assets/FilterPanel.tsx`, `src/app/admin/helpdesk/page.tsx`

**Refactor `confirm()` sang Custom Modal:**
- `src/components/settings/DepreciationTable.tsx`
- `src/components/licenses/CheckoutSeatButton.tsx`
- `src/components/helpdesk/TicketAttachments.tsx`
- `src/components/helpdesk/HelpdeskTeamsClient.tsx`
- `src/components/assets/MarkAuditedButton.tsx`
- `src/components/assets/FilterPanel.tsx`
- `src/components/assets/CheckinAssetButton.tsx`
- `src/components/assets/AssetMaintenanceList.tsx`
- `src/app/settings/integrations/IntegrationsClient.tsx`
- `src/app/helpdesk/[id]/page.tsx`
- `src/app/admin/helpdesk/page.tsx`

**Tooltips, Form Layout & Clean-up Sidebar:**
- `src/components/settings/DepreciationTable.tsx` (Tooltips)
- `src/components/settings/LocationsTable.tsx` (Tooltips)
- `src/components/settings/EntityTable.tsx` (Grid 2 cột)
- `src/components/Sidebar.tsx` (Xóa khối Profile User)
- `src/app/assets/AssetsPageClient.tsx` (Sửa text cột thành "Người/Vị trí/Thiết bị giữ")
