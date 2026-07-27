# CONTEXT: Sprint A.5 - License-Asset Transitive UI

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Xử lý lỗ hổng UI trong quan hệ gián tiếp (Transitive) giữa User - Asset - License. Đảm bảo nhân sự có thể thấy được các Bản quyền phần mềm đang cài trên máy tính họ được giao.

## Quyết định của Planner
Sau khi đọc bản báo cáo khảo sát `license-asset-user-relationship.md`, tôi đánh giá đây là một module **tách biệt hoàn toàn** và có khối lượng công việc khá lớn (tới 4 ngày công, 7 file mới, 2 file sửa).
Do đó, thay vì nhét bừa vào Sprint A hay Sprint B, tôi tạo ra một phase đệm gọi là **Sprint A.5**. Phase này sẽ làm cầu nối hoàn hảo giữa việc quản lý tài sản (A4, A8, A9) và việc hiển thị Report (B9).

## Scope
1. **Asset Detail Page:** Thêm tab "Bản quyền" vào trang chi tiết Tài sản. Cấp quyền cho Admin gán trực tiếp License Seat vào Asset đó (thông qua Modal).
2. **User Detail Page:** Thêm tab "Bản quyền" vào trang chi tiết Nhân sự. Tab này hiển thị 2 section:
   - Bản quyền cấp trực tiếp cho User.
   - Bản quyền cấp gián tiếp (Cấp cho Thiết bị, Thiết bị giao cho User).

## Impact & Risks
- **Impact:** Đóng nốt lỗ hổng UX lớn nhất của mảng License/Asset. Người dùng sẽ có cái nhìn toàn cảnh về tài sản số đang nắm giữ.
- **Risks:** Tính bảo mật quyền riêng tư. Nhân viên (Employee) chỉ được phép xem tab Bản quyền của CHÍNH MÌNH, cấm xem của người khác. Cần check kỹ `session.userId`.
