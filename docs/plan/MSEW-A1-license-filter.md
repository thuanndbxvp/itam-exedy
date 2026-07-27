# MSEW: A1 - License List Filter Button

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Hiện thực tính năng Lọc (Filter) cho trang Quản lý Bản quyền (`/licenses`). Cụ thể, thay vì làm nút Filter giả, hãy cho phép lọc theo trạng thái, từ khóa bằng URL.

## Các bước thực thi chi tiết (Dành cho Tier 2)

### Bước 1: Sửa file `src/app/licenses/page.tsx`
- Bổ sung type cho `searchParams` trong Props.
- Đọc các tham số `search` và `status` từ `searchParams`.
- Build biến `where` truyền vào `prisma.license.findMany({ where: ... })`:
  - `name: { contains: search, mode: 'insensitive' }`
  - `status: { equals: status }`
- Ở vị trí nút Filter hiện tại, import `<LicenseFilterBar />` (sẽ tạo ở Bước 2) và thả vào đó.

### Bước 2: Tạo component `src/components/licenses/LicenseFilterBar.tsx`
- Đây là Client Component (`"use client"`).
- Component chứa 1 ô Input Search và 1 Dropdown Status (bạn tự define các trạng thái phổ biến).
- Khi Submit form (hoặc gõ phím Enter / chọn Dropdown), dùng `useRouter()` từ `next/navigation` để update URL (ví dụ: `router.push('/licenses?search=...&status=...')`).

### Bước 3: Kiểm thử
- Refresh lại trang `/licenses`, thử gõ tìm kiếm và chọn trạng thái.
- Đảm bảo danh sách License phía dưới được lọc đúng (vì Server Component tự động re-render khi searchParams đổi).
