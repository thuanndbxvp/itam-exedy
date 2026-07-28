# PLAN: Sprint C.7 - Vá lỗ hổng Phân quyền (Privilege Escalation / IDOR)

## 1. Mục tiêu (Context)
Hiện tại, hệ thống đang bị rò rỉ dữ liệu cực kỳ nguy hiểm (Broken Access Control). Tài khoản `EMPLOYEE` (nhân viên thường) khi đăng nhập lại có thể xem được toàn bộ danh sách `users`, danh sách `assets`, `licenses` và truy cập được vào các màn hình Quản trị (như `settings/users`, `assets`).
Nguyên nhân gốc rễ là do khai báo phân quyền mặc định ở `catalog.ts` đã vô tình gán quyền cấp cao (`users.read`, `assets.read`, `licenses.read`) cho nhóm `EMPLOYEE`.

## 2. Giải pháp Kiến trúc
1. **Thu hồi Quyền (Revoke Permissions):**
   Xóa các quyền `users.read`, `assets.read`, `licenses.read` khỏi mảng quyền của `EMPLOYEE` trong `src/lib/permissions/catalog.ts`.
2. **Kiểm tra Side-effect:**
   Khi rút quyền `assets.read`, đảm bảo trang Helpdesk của `EMPLOYEE` không bị sập (vì Helpdesk lấy danh sách tài sản thông qua `/api/helpdesk/my-assets` - endpoint này chỉ check `requireUser`, không check `assets.read`, nên hoàn toàn an toàn).

## 3. Các file bị ảnh hưởng
- `src/lib/permissions/catalog.ts`
