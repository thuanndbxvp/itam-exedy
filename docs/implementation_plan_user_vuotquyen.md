# Giải quyết lỗ hổng bảo mật: Phân lập Dữ liệu Nhân viên (Tenant Isolation)

Hiện tại, hệ thống phân quyền (RBAC) đang gặp lỗ hổng lớn ở tầng hiển thị dữ liệu: Mặc dù nhân viên (EMPLOYEE) bị chặn khỏi các tính năng Cài đặt, nhưng họ lại có thể nhìn thấy dữ liệu "Global" (toàn cục) của cả công ty trên trang chủ Dashboard, danh sách Tài sản và Bản quyền. Lỗi này bắt nguồn từ việc các API và Server Component chưa có logic filter theo ID của người dùng đối với chức danh EMPLOYEE.

## Open Questions
- **Giao diện Dashboard của Nhân viên:** Thay vì hiển thị các biểu đồ tổng quan, tôi đề xuất tạo riêng một giao diện Dashboard cho Nhân viên, trong đó hiển thị 3 danh sách chính xác: **Tài sản đang mượn**, **License đang dùng**, và **Ticket đang mở**. Bạn có đồng ý với thiết kế tinh gọn này không?
- **Danh sách User:** Hiện tại EMPLOYEE đang có quyền `users.read` (để có thể xem profile, hoặc xem người quản lý). Bạn có muốn giới hạn cả quyền xem danh sách nhân sự của công ty không, hay vẫn cho phép họ tra cứu danh bạ nội bộ?

## Proposed Changes

### Dashboard

#### [MODIFY] [page.tsx](file:///d:/IT-management/src/app/page.tsx)
- Kiểm tra `session.user.role`.
- Nếu role là `EMPLOYEE`, **KHÔNG** query `prisma.actionLog` toàn hệ thống nữa.
- Trả về component riêng `EmployeeDashboard` (Sẽ hiển thị danh sách tài sản/bản quyền của chính họ thay cho biểu đồ toàn công ty).
- Thay đổi câu chào `Chào mừng trở lại, Admin!` thành động (Welcome firstName).
- Ẩn nút "Cấp phát mới" đối với Employee.

### Assets (Tài sản)

#### [MODIFY] [assets/page.tsx](file:///d:/IT-management/src/app/assets/page.tsx)
- Thêm filter bắt buộc: 
  ```ts
  if (session.user.role === 'EMPLOYEE') {
    where.assignedUserId = session.user.id
  }
  ```
- Như vậy, nếu nhân viên bấm vào menu "Tài sản", họ vẫn thấy bảng tài sản đẹp mắt nhưng chỉ có dữ liệu của riêng mình.

#### [MODIFY] [assets/[id]/page.tsx](file:///d:/IT-management/src/app/assets/[id]/page.tsx)
- Thêm guard: Nếu user là `EMPLOYEE` mà ID của tài sản không khớp với `assignedUserId` của họ, trả về 403 (Không có quyền truy cập). Tránh việc mò mẫm đổi ID trên thanh URL.

### Licenses (Bản quyền)

#### [MODIFY] [licenses/page.tsx](file:///d:/IT-management/src/app/licenses/page.tsx)
- Thêm filter bắt buộc:
  ```ts
  if (session.user.role === 'EMPLOYEE') {
    where.seats = {
      some: {
        OR: [
          { assignedUserId: session.user.id },
          { assignedAsset: { assignedUserId: session.user.id } }
        ]
      }
    }
  }
  ```
- Chỉ liệt kê các phần mềm mà nhân viên này được cấp phát (hoặc thiết bị của họ được cài).

#### [MODIFY] [licenses/[id]/page.tsx](file:///d:/IT-management/src/app/licenses/[id]/page.tsx)
- Tương tự Asset, chặn xem chi tiết license nếu nhân viên không sở hữu Seat nào.
- Trên giao diện chi tiết, **ẩn** danh sách các Seat trống hoặc Seat của người khác, chỉ hiển thị Seat của chính nhân viên đó.

## Verification Plan
1. **Automated Verification:** 
   - Không có Unit tests, sẽ dùng Type Check (`bun run build`).
2. **Manual Verification:**
   - Dùng tài khoản `Nguyễn Hà` (EMPLOYEE) để test:
     - Dashboard phải hiển thị câu chào đúng tên Nguyễn Hà, không có biểu đồ Admin, không có Activity Log.
     - Trang Tài sản phải chỉ hiện đúng 1-2 tài sản được cấp.
     - Trang Bản quyền chỉ hiển thị Office 365 (Seat của Nguyễn Hà).
   - Dùng tài khoản Admin để test:
     - Dashboard vẫn giữ nguyên chức năng cũ.
