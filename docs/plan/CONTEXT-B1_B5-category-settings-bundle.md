# CONTEXT: B1-B5 - Category & Settings CRUD Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Liên kết:** MSEW-B1_B5-category-settings-bundle.md, ACCEPTANCE-B1_B5-category-settings-bundle.md
**Mục tiêu:** Hoàn thiện toàn bộ các tính năng Quản lý danh mục cốt lõi (Category, Status, Location, Department) và Cài đặt hệ thống (Settings).

## Background & Scope

Các tính năng này vốn đã có sẵn Database Schema, thậm chí một số đã có sẵn một phần code UI (Partial Code) như Form Thêm/Sửa, nhưng hiện đang thiếu các trường dữ liệu quan trọng hoặc chưa được liên kết đầy đủ vào Menu. Việc gộp chung B1 đến B5 giúp Tier 2 làm một lèo các trang Settings có form tương tự nhau.

**Bao gồm:**
1. **[B1] Category full CRUD:** Bổ sung các tính năng EULA, checkin email, category color cho trang Quản lý danh mục.
2. **[B2] Status Label full CRUD:** Bổ sung các cờ trạng thái (deployable, pending, archived) cho nhãn trạng thái tài sản.
3. **[B3] Location full fields:** Bổ sung các trường về địa chỉ (address, city, state, zip) vào Form thêm/sửa Địa điểm.
4. **[B4] Department full fields:** Bổ sung trường Manager, Location, Company vào Form thêm/sửa Phòng ban.
5. **[B5] Setting full fields:** Hoàn thiện bảng System Settings (Cấu hình toàn cục như site name, logo, language).

## Impact & Risks

**Impact:**
- Cung cấp đủ thông tin danh mục, tạo tiền đề để các module Tài sản và User hoạt động chính xác.
- Đụng chạm nhiều đến thư mục `src/app/settings/`.

**Risks:**
- Trùng lặp code: Do có tới 5 module CRUD tương tự nhau, Tier 2 cần tái sử dụng tối đa các Form/Table component để code không bị phình to (DRY principle).
