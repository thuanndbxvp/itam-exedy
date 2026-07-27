# PLAN: Xử lý tồn đọng UI (Sprint A - Top 10 Ưu Tiên)

## Bối cảnh
Dựa trên báo cáo `audit-report-features-missing-ui.md`, hệ thống hiện có khoảng 50 features đã có core/DB nhưng chưa có UI hoặc chưa nối API. Chúng ta sẽ ưu tiên xử lý **Sprint A** (Top 10 task quan trọng nhất) trước.

## Phân rã công việc cho Tier 2
Để quá trình code diễn ra trơn tru và an toàn, tôi chia Sprint A thành các chặng (MSEW) tuần tự. Tier 2 sẽ làm từng task một.

1. **[A1] License list filter button (XS)**: Xử lý filter cho trang License bằng URL searchParams.
2. **[A2] Audit log drill-down (XS)**: Trích xuất `JsonDiff` và thêm link điều hướng cho Audit Log.
3. **[A3] User form bổ sung fields (M)**: Mở rộng whitelist API user và bổ sung các trường thông tin (contact, org, flags).
4. **[A4] Asset "Mark audited" (S)**: Tính năng đánh dấu kiểm kê tài sản và Bulk audit.
5. **[A5] Depreciation CRUD (M)**: Hoàn thiện CRUD cho Quy tắc khấu hao.
6. **[A6] Ticket filter (M)**: Thêm các bộ lọc nâng cao (Priority, Assignee, Team, SLA) cho Helpdesk.
7. **[A7] Helpdesk Team CRUD (M)**: Hoàn thiện UI quản lý Team hỗ trợ.
8. **[A8] License CSV export & Bulk (L)**: Xuất file CSV và giao/nhận License hàng loạt.
9. **[A9] Maintenance global page (M)**: Trang quản lý toàn cục lịch sử bảo trì.
10. **[A10] Audit log consolidate (XS)**: Xóa bỏ trang trùng lặp, chuẩn hóa về `/settings/audit-log`.

## Quyết định của Planner (dựa trên Tier 2 Audit)
- **Tái sử dụng (Code Reuse):** Tận dụng tối đa form/scaffold đã có (như `FieldDiff` ở A2).
- **Kiến trúc:** Bám sát Next.js Server Components. Các filter ưu tiên dùng URL query params thay vì fetch client-side để tận dụng SSR.
- **Bảo mật:** Tuân thủ chặt chẽ RBAC key mới nhất (ví dụ: dùng `helpdesk.manage_teams` chứ không dùng quyền giả định).

*(Lưu ý: Tôi đã chuẩn bị sẵn bản vẽ thi công MSEW cho task A1 đầu tiên).*
