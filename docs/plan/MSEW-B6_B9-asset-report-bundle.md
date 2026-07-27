# MSEW: B6-B9 - Asset & Report Upgrades Bundle

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Nâng cấp tính năng cho Tài sản (Upload ảnh, Gán thiết bị con), thêm Company cho Bản quyền và xây dựng Bảng Báo cáo.

## B6. Asset image field + upload
1. **Schema:** Database đã có sẵn cột `image` (string url).
2. **UI Form:** Sửa `src/app/assets/new/page.tsx` và Edit form. Thêm input `<input type="file" />`.
3. **Logic:** Viết 1 API route POST lưu ảnh vào thư mục `public/uploads/assets` hoặc parse file thành Base64 string lưu thẳng vào Database (Khuyên dùng Base64 Data URI cho lẹ nếu file nhỏ < 1MB, đỡ lằng nhằng host file).
4. **Hiển thị:** Show ảnh thumbnail ở trang chi tiết `AssetDetailClient.tsx`.

## B7. Asset "Assigned Asset"
1. **Ngữ cảnh:** Thay vì gán một con chuột cho "Nhân viên A", ta có thể gán nó cho "Laptop B".
2. **Backend:** Hàm `checkoutAsset` phải hỗ trợ nhận vào `targetAssetId` thay vì `targetUserId` (Logic tương tự như LicenseSeat). Database schema Asset đã có `assignedAssetId`.
3. **UI Checkout Modal:** Thêm Tab hoặc Radio Button: "Giao cho Nhân sự" | "Giao cho Thiết bị". Nếu chọn "Thiết bị", fetch danh sách các thiết bị khác để gán.

## B8. License companyId selector
1. **Form Edit/New License:** Thêm dropdown cho phép chọn `companyId`. Database đã có sẵn FK này.

## B9. Reports page
1. Tạo thư mục `src/app/reports/page.tsx`.
2. Dùng thư viện Recharts (hoặc Chart.js tùy repo đang dùng) để vẽ 3 biểu đồ:
   - Bar chart: Số lượng thiết bị theo Trạng thái (Deployable, Broken...).
   - Pie chart: Phân bố Tài sản theo Phòng ban.
   - Bảng Data grid nhỏ: Top 10 phần mềm sắp hết hạn.
