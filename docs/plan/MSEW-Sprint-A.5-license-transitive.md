# MSEW: Sprint A.5 - License-Asset Transitive UI

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Hiển thị danh sách License trong trang chi tiết Asset và User (bao gồm cả License nhận gián tiếp qua Asset).

## Các bước thực thi chi tiết (Dành cho Tier 2)

### BƯỚC 1: Xử lý Asset Detail Page (`/assets/[id]`)
1. **API/Query:** Trong file `src/app/assets/[id]/page.tsx`, bổ sung query `include: { licenseSeats: { where: { deletedAt: null }, include: { license: true } } }` vào lệnh fetch Prisma của Asset.
2. **UI Tab:** Mở `src/app/assets/[id]/AssetDetailClient.tsx`. Thêm 1 Tab mang tên "Bản quyền" (Licenses).
3. **Table:** Render bảng chứa danh sách `asset.licenseSeats`. Bảng có các cột: Tên phần mềm, Product Key (che đi 1 nửa), Expiration, Nút gỡ bản quyền (Check-in).
4. **Modal:** Nếu user là Admin, hiện nút "+ Gán bản quyền". Bấm vào hiện `AssignLicenseModal` (bạn phải tạo component này).
   - Modal này sẽ gọi `GET /api/licenses/[id]/seats?available=true` để lấy các seat trống, sau đó cho người dùng chọn và gọi `POST /api/licenses/checkout-seat` để gán vào Asset hiện tại.

### BƯỚC 2: Xử lý User Detail Page (`/settings/users/[id]`)
1. **Query:** Trong trang của User, bạn cần gọi 2 lệnh Prisma (hoặc viết 1 file Server Component mới `src/app/settings/users/[id]/licenses/page.tsx` cho gọn):
   - **Lệnh 1 (Direct):** Lấy các License gán thẳng qua `assignedUserId`.
   - **Lệnh 2 (Transitive):** Lấy các License gán qua thiết bị bằng filter nested `where: { assignedAsset: { assignedUserId: userId }, deletedAt: null }`.
2. **Permission Check:** Chặn đứng việc xem trộm! Thêm logic: `if (session.user.role === 'EMPLOYEE' && session.user.id !== params.id) return notFound();`. Chỉ Employee chính chủ hoặc Admin mới được xem.
3. **UI Tab & Section:** Mở form chi tiết nhân sự ra, thêm Tab "Bản quyền". Trong tab này chia làm 2 vùng rõ rệt (dùng Grid hoặc Card):
   - **Vùng 1 (Bản quyền trực tiếp):** Render data từ Lệnh 1.
   - **Vùng 2 (Bản quyền qua thiết bị):** Render data từ Lệnh 2. Kèm dòng chữ Tooltip đỏ chú ý: *"Các phần mềm này đi theo Thiết bị bạn đang giữ. Thu hồi thiết bị đồng nghĩa thu hồi luôn phần mềm."*

### Kiểm thử tổng hợp
- Thử gán Office cho LAPTOP-01. Gán LAPTOP-01 cho nhân viên A.
- Đăng nhập nhân viên A, vào Hồ sơ cá nhân của mình, xem có thấy Office nằm ở mục "Bản quyền qua thiết bị" không.
- Thử lấy nhân viên B nhảy vào xem Hồ sơ nhân viên A -> Đảm bảo bị chặn!
