# PLAN: Sprint C.12 - Báo cáo Kiểm kê (Audit Report)

## 1. Mục tiêu
- Xây dựng trang báo cáo riêng biệt cho Kiểm kê tại đường dẫn `/reports/audit`.
- Cập nhật Sidebar để thêm menu truy cập vào trang này.

## 2. Giao diện (UI)
- **Menu Sidebar**: Nằm trong nhóm "Vận hành & Hỗ trợ", dưới menu "Chi phí IT". Tên menu: "Kiểm kê", Icon: `CheckCircle2`.
- **Trang Báo cáo (/reports/audit)**:
  - **Header**: Tiêu đề "Báo cáo Kiểm kê", kèm đoạn mô tả ngắn.
  - **Thống kê (Counters)**: 3 thẻ card đếm số lượng tài sản theo tình trạng:
    - 🔴 **Quá hạn (Overdue)**: `nextAuditDate < today`.
    - 🟡 **Sắp đến hạn (Due Soon)**: `nextAuditDate >= today` và `nextAuditDate <= today + 30 days`.
    - 🟢 **An toàn (Safe)**: `nextAuditDate > today + 30 days` hoặc vừa mới kiểm kê (chưa đến hạn).
  - **Bảng dữ liệu (Data Table)**:
    - Liệt kê danh sách các tài sản thuộc 2 nhóm: Quá hạn và Sắp đến hạn. (Bỏ qua nhóm An toàn để tập trung vào những tài sản cần xử lý).
    - Cột hiển thị: Tên tài sản (kèm link sang trang chi tiết), Mã thẻ (Asset Tag), Tình trạng kiểm kê (Badge màu Đỏ/Vàng), Người đang giữ (Assigned User), Ngày kiểm kê cuối, Hạn kiểm kê tiếp theo.

## 3. API & Data
- Logic truy xuất dữ liệu: Thực hiện trực tiếp trên Server Component của trang `/reports/audit/page.tsx` (Tương tự cấu trúc của `/reports/page.tsx`).
- Sử dụng Prisma `asset.count` để đếm số lượng cho 3 thẻ.
- Sử dụng Prisma `asset.findMany` để lấy danh sách tài sản cho Data Table, có bao gồm thông tin user đang giữ (`assignedUser`).

## 4. Quyền truy cập
- Sử dụng hàm `requirePermission('reports.view')` để chặn truy cập trái phép. Chỉ Admin và IT Manager mới được xem.
