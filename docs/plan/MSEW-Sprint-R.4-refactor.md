# MSEW-Sprint-R.4: Thực thi Tái cấu trúc & Hiệu năng

## BƯỚC 1: XÂY DỰNG SHARED UTILITIES
- **File tạo mới:** `src/lib/utils/format.ts`
- **Hành động:** Viết các hàm `formatCurrency(value)` và `formatDate(date)` chuẩn chỉnh. Export chúng ra để có thể tái sử dụng trên toàn dự án. Cập nhật trang Báo cáo Chi phí IT để dùng hàm mới này.

## BƯỚC 2: TÁCH FAT COMPONENT (Integrations)
- **File:** `src/app/settings/integrations/IntegrationsClient.tsx`
- **Hành động:** 
  1. File này đang quá dài. Hãy tách nội dung của từng Tab thành 3 file components mới nằm cùng thư mục: 
     - `ApiTokensTab.tsx`
     - `EmailTemplatesTab.tsx`
     - `NotificationChannelsTab.tsx`
  2. Import 3 tab này vào lại `IntegrationsClient.tsx`. Chỉ giữ lại State quản lý Tab đang active ở file cha. Truyền state/props xuống cho các component con tương ứng.

## BƯỚC 3: TỐI ƯU HIỆU NĂNG DASHBOARD (Server-side fetch)
- **File 1:** `src/app/page.tsx`
  - Đổi từ việc render `<DashboardClient />` không tham số sang gọi trực tiếp Prisma hoặc fetch local API để lấy `summaryData`, `statusData`, `categoryData` ở Server. 
  - Truyền dữ liệu này vào `<DashboardClient initialData={{ ... }} />`.
- **File 2:** `src/components/dashboard/DashboardClient.tsx`
  - Bỏ 3 hàm `fetch(...)` đang chạy trong `useEffect` lúc mount. Sử dụng luôn `initialData` từ props để render ngay lập tức.
  - Tách các Alert Component nặng (như LicenseExpiry, AssetEol) ra, sử dụng `React.lazy()` bọc trong `<Suspense fallback={<LoadingSkeleton />}>` để tránh nghẽn luồng render chính.

## BƯỚC 4: THÊM DEBOUNCE CHO BỘ LỌC TÀI SẢN
- **File:** `src/components/assets/FilterPanel.tsx`
- **Hành động:** 
  - Ô search input hiện tại đang trigger hàm `setField` liên tục theo từng ký tự người dùng gõ vào.
  - Hãy cài đặt cơ chế debounce (có thể dùng `use-debounce` package, hoặc `lodash/debounce`, hoặc tự viết một custom hook) khoảng 300-500ms cho ô Search Text, giúp giảm thiểu số lượng renders và API calls không cần thiết.
