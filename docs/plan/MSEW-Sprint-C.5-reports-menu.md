# MSEW-Sprint-C.5: Thực thi Tái cấu trúc Menu Báo cáo

> **Lưu ý cho Tier 2:** Chỉ sửa file `Sidebar.tsx`, không động chạm đến logic phân quyền hiện có.

## BƯỚC 1: XÓA DROPDOWN MENU BÁO CÁO

- **File:** `src/components/Sidebar.tsx`
- **Hành động:** Tìm đến nhóm `label: 'Vận hành & Hỗ trợ'` trong mảng `NAVIGATION_GROUPS`.
- Thay thế block object của menu 'Báo cáo' như sau:

**XÓA ĐOẠN CŨ:**
```tsx
      {
        name: 'Báo cáo',
        href: '/reports',
        icon: BarChart3,
        allowedRoles: ['ADMIN', 'IT_MANAGER'],
        permissionKey: 'reports.view',
        children: [
          { label: 'Tổng quan', href: '/reports', icon: BarChart3, permissionKey: 'reports.view' },
          { label: 'Chi phí IT', href: '/reports/costs', icon: DollarSign, permissionKey: 'reports.view' },
        ],
      },
```

**THÊM VÀO ĐOẠN MỚI:**
```tsx
      { 
        name: 'Báo cáo', 
        href: '/reports', 
        icon: BarChart3, 
        allowedRoles: ['ADMIN', 'IT_MANAGER'], 
        permissionKey: 'reports.view' 
      },
      { 
        name: 'Chi phí IT', 
        href: '/reports/costs', 
        icon: DollarSign, 
        allowedRoles: ['ADMIN', 'IT_MANAGER'], 
        permissionKey: 'reports.view' 
      },
```

- **Kết quả mong muốn:** Chạy lệnh `npx tsc --noEmit` không có lỗi.

## BƯỚC 2: THAY ĐỔI ICON CHO NHÓM MENU DANH MỤC

- **File:** `src/components/Sidebar.tsx`
- **Hành động:** 
  1. Ở đầu file, thêm các import `FolderOpen`, `Box`, `Factory`, `Package` từ thư viện `lucide-react`.
  2. Tìm đến nhóm `label: 'Quản lý Tài sản'` trong `NAVIGATION_GROUPS`, sửa trường `icon` cho 4 menu như sau:
     - `name: 'Loại tài sản'` -> đổi thành `icon: FolderOpen`
     - `name: 'Model thiết bị'` -> đổi thành `icon: Box`
     - `name: 'Nhà sản xuất'` -> đổi thành `icon: Factory`
     - `name: 'Nhà cung cấp'` -> đổi thành `icon: Package`
