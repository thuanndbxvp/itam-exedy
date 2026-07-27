# CONTEXT: Sprint C.1 - IT Costs Report

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Tạo mới chức năng Báo cáo tổng hợp toàn bộ các khoản chi phí IT (IT Costs Report) cho phép lọc theo thời gian.

## Quyết định của Planner
Báo cáo Audit trước đó không nhắc đến việc xây dựng chức năng này. Tuy nhiên, theo yêu cầu bổ sung từ khách hàng, tính năng này là cực kỳ cần thiết để Ban giám đốc và IT Manager nắm bắt dòng tiền đã chi cho IT (tài sản, bản quyền, bảo trì sửa chữa).

## Scope
1. **API Endpoint:** `/api/reports/it-costs` - Chịu trách nhiệm fetch dữ liệu từ 3 bảng `Asset`, `License`, và `AssetMaintenance` theo `startDate` và `endDate`.
2. **UI Page:** `/reports/costs` - Giao diện báo cáo có bộ lọc thời gian, thẻ tổng quan và bảng danh sách.
3. **Sidebar Menu:** Bổ sung menu điều hướng cho báo cáo chi phí.

## Impact & Risks
- **Impact:** Cải thiện khả năng theo dõi ngân sách IT.
- **Risks:** Kiểu dữ liệu `Prisma.Decimal` có thể gây lỗi khi chuyển đổi sang JSON nếu không xử lý cẩn thận ở backend. Phân quyền truy cập cần chặn người không có quyền `reports.view`.
