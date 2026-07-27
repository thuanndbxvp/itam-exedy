# CONTEXT: A4-A5-A8-A9 - Asset, License & Maintenance Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Liên kết:** MSEW-A4_A9-asset-license-bundle.md, v.v.
**Mục tiêu:** Gộp 4 task lớn liên quan đến Quản lý Tài sản (Asset), Bản quyền (License) và Bảo trì (Maintenance) vào một lần chạy duy nhất để tiết kiệm thời gian context switch của Tier 2.

## Background & Scope

Bundle này giải quyết 4 lỗ hổng UI/Tính năng còn thiếu trong hệ sinh thái Tài sản:
1. **[A4] Asset "Mark audited"**: Chưa có API/UI để đánh dấu tài sản đã được kiểm kê định kỳ. Cần thêm nút "Đánh dấu kiểm kê" trong trang Chi tiết Tài sản và action tương ứng trong Bulk Edit.
2. **[A5] Depreciation CRUD**: Mặc dù DB có bảng `Depreciation`, UI hiện tại bị khóa cứng nút "Thêm quy tắc". Cần mở khóa và xây dựng giao diện Quản lý Khấu hao.
3. **[A8] License CSV export & Bulk seat**: Tính năng xuất CSV cho bản quyền và Giao/Thu hồi Bản quyền hàng loạt.
4. **[A9] Maintenance Global Page**: Tính năng bảo trì hiện chỉ xem được trong tab lẻ của từng tài sản. Cần một trang toàn cục (`/maintenances`) để xem tất cả lịch sử bảo trì.

## Impact & Risks
- **Impact:** Cập nhật hàng loạt các Module cốt lõi. Sẽ cần thay đổi Navigation/Sidebar (thêm link `/maintenances`, `/admin/depreciation`).
- **Risks:** Scope khá lớn (~5-6 ngày công). Tier 2 cần cẩn thận khi đụng vào các hàm tính toán hàng loạt (Bulk checkout/checkin) để tránh lỗi timeout hoặc crash DB nếu test quá tải.
