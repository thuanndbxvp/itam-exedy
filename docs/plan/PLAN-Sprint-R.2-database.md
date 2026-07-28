# PLAN: Sprint R.2 - Data Integrity & Database Optimization

## 1. Lý do cần thiết (Context)
- **Data Leak qua Soft-delete:** Các lệnh xuất/nhập tài sản (checkout) và cấp phát bản quyền (license) đang query trực tiếp ID mà quên mất điều kiện `deletedAt: null`. Điều này dẫn đến việc nhân viên có thể tương tác với các tài sản/người dùng đã bị xóa.
- **Performance:** Hệ thống hoàn toàn vắng bóng các Database Indexes quan trọng (đặc biệt là Index cho `deletedAt`). Khi dữ liệu phình to, toàn bộ truy vấn Prisma sẽ trở thành Nút thắt cổ chai (Bottleneck).
- **Logic Bugs:** 
  - Thiếu ràng buộc số dương cho chi phí và tháng bảo hành.
  - Các bản ghi nhật ký (ActionLog) bị mồ côi (orphaned) khi xóa người dùng.

## 2. Giải pháp Kiến trúc
1. **Schema Indexes:** Bổ sung `@@index([deletedAt])` vào tất cả Master Models trong `schema.prisma`. Bổ sung Composite Indexes cho các cặp field thường xuyên query chung (vd: `assignedUserId` + `deletedAt`).
2. **Vá Data Leak:** Bổ sung `deletedAt: null` vào hàm `findUnique` và `findMany` ở các Core Commands (Asset, License, Role).
3. **Fix Logic Cốt lõi:** 
   - Kiểm tra `purchaseCost >= 0` và `warrantyMonths >= 0` trong Server Actions.
   - Khi xóa User, chạy lệnh update toàn bộ ActionLog cũ sang ID của tài khoản System (để bảo toàn lịch sử audit).
   - Thêm bộ lọc `deletedAt: null` vào các truy vấn đếm (`_count`) của API Báo cáo.

## 3. Danh sách File bị ảnh hưởng
- `prisma/schema.prisma`
- `src/lib/commands/asset.ts`
- `src/lib/commands/license.ts`
- `src/app/api/permissions/roles/[id]/route.ts`
- `src/app/api/settings/users/[id]/route.ts`
- `src/app/actions/asset.ts`
- `src/app/actions/license.ts`
- Các API Reports cần sửa `_count`
