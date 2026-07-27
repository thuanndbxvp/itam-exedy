# MSEW-Sprint-C.3: Tái cấu trúc giao diện Sidebar và Profile

## Mục tiêu
Thiết kế lại luồng điều hướng (Navigation) của hệ thống giúp tăng diện tích không gian làm việc và sắp xếp các module nghiệp vụ logic hơn:
1. Đập bỏ Menu dọc lồng nhau (Dropdown) của Sidebar chính, dàn phẳng thành 5 Nhóm Chức năng (Group Headers).
2. Sửa lỗi Double-Sidebar ở trang Cá nhân (Profile) bằng cách chuyển Sidebar con thành Navbar nằm ngang.

## Yêu cầu Nghiệp vụ (Business Requirements)

### 1. Cấu trúc Sidebar Mới (Main Sidebar)
Cần thay đổi mảng `navigation` trong `src/components/Sidebar.tsx` theo cấu trúc phẳng, được ngăn cách bởi các thẻ Header. Cụ thể:

**Nhóm 1: TỔNG QUAN**
- Dashboard (`/`)

**Nhóm 2: QUẢN LÝ TÀI SẢN (ASSET MANAGEMENT)**
- Thiết bị (`/assets`)
- Bản quyền (`/licenses`)
- Bảo trì (`/maintenances`)
- Loại tài sản (`/settings/categories`)
- Model thiết bị (`/settings/asset-models`)
- Nhà sản xuất (`/settings/manufacturers`)
- Nhà cung cấp (`/settings/suppliers`)
- Vị trí (`/settings/locations`)
- Khấu hao (`/settings/depreciation`)
- Trạng thái (`/settings/statuses`)

**Nhóm 3: VẬN HÀNH & HỖ TRỢ (IT OPERATIONS)**
- Helpdesk (`/helpdesk`)
- Quản trị Helpdesk (`/admin/helpdesk`)
- Báo cáo (`/reports`) - Nếu có submenu thì sổ xuống Tổng quan & Chi phí.

**Nhóm 4: NHÂN SỰ & TỔ CHỨC (ORGANIZATION)**
- Người dùng (`/settings/users`)
- Phòng ban (`/settings/departments`)
- Công ty (`/settings/companies`)
- Phân quyền Role (`/settings/permissions`)

**Nhóm 5: HỆ THỐNG (SYSTEM)**
- Tổng quan hệ thống (`/settings/general`)
- Bảo mật (`/settings/security`)
- Thương hiệu (`/settings/branding`)
- Email (`/settings/email`)
- Nhật ký Audit Log (`/settings/audit-log`)

### 2. Layout Trang Cá Nhân (Profile Layout)
- File Layout `src/app/account/layout.tsx` hiện đang dùng `flex-row` kẹp `UserPanelNav` bên trái màn hình chính. Cần đổi nó thành `flex-col` và căn chỉnh nội dung ra giữa.
- `src/components/account/UserPanelNav.tsx` cần được chuyển thành một thanh Navigation Tabs nằm ngang. Giao diện nên có border-bottom dưới các tab, thẻ nào đang active thì bôi đậm màu xanh giống Github Settings. Chữ cái đầu (Initials) có thể ẩn đi hoặc thiết kế lại để không chiếm diện tích ngang.

## Technical Details (Cho Coder)
- **File Sidebar.tsx:** Loại bỏ hoàn toàn khối logic liên quan đến `SETTINGS_GROUPS`. Trải phẳng mảng navigation thành cấu trúc: `{ header: 'TÊN NHÓM', items: [...] }`. Xóa bỏ các nút Chevron mở dropdown.
- **Quyền hạn (Permissions):** Hãy giữ nguyên field `permissionKey` và `allowedRoles` của từng menu như file cũ để không làm hỏng tính năng phân quyền. Logic `has(item.permissionKey)` vẫn phải được áp dụng.
