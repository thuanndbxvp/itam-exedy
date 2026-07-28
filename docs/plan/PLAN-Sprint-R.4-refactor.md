# PLAN: Sprint R.4 - Technical Debt & Refactor

## 1. Lý do cần thiết (Context)
- **Kiến trúc kềnh càng:** Rất nhiều Component như `IntegrationsClient` đang ôm đồm quá nhiều logic (hơn 800 dòng code, 20+ state) gây khó bảo trì.
- **Trùng lặp code (DRY):** Hệ thống không có các hàm tiện ích (`utils`) dùng chung cho việc format tiền tệ, ngày tháng. Các Component đang tự chế lại logic format dẫn đến thiếu nhất quán.
- **Hiệu năng Client:** Dashboard đang bị hiện tượng Waterfall khi gọi 3 API client-side lúc mount. Ô tìm kiếm thiếu Debounce dẫn đến giật lag khi gõ.

## 2. Giải pháp Kiến trúc
1. **Tách Component (Component Splitting):** Chẻ nhỏ `IntegrationsClient.tsx` thành 3 component con dựa trên Tab.
2. **Centralized Utils:** Tạo các file `src/lib/utils/format.ts` để chứa các hàm format. Áp dụng vào Dashboard và các bảng Báo cáo.
3. **Tối ưu Dashboard:** 
   - Đưa việc fetch dữ liệu Dashboard (summary, status, category) lên Server Component (`page.tsx`) thay vì fetch ở Client (`DashboardClient.tsx`).
   - Dùng `React.lazy()` và `<Suspense>` cho các Widget có cảnh báo nặng.
4. **Debounce Input:** Bổ sung logic debounce vào ô Search của `FilterPanel.tsx`.

## 3. Danh sách File bị ảnh hưởng
- `src/app/settings/integrations/IntegrationsClient.tsx` (và các file con)
- `src/lib/utils/format.ts` (tạo mới)
- `src/app/page.tsx` và `src/components/dashboard/DashboardClient.tsx`
- `src/components/assets/FilterPanel.tsx`
