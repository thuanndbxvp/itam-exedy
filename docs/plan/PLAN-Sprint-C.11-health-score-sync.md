# PLAN: Sprint C.11 - Health Score & Auto Sync & Virtual Inventory

## 1. Mục tiêu
- Tự động hóa trạng thái Asset khi có phiếu bảo trì.
- Cảnh báo thay thế thiết bị thông qua Health Score (kết hợp Khấu hao).
- Tạo Kho Ảo (Smart Filters) trên UI.

## 2. Các bước triển khai (Dành cho Tier 2)

### Bước 1: Auto Workflow Sync
- Tại `src/app/api/maintenances/[id]/route.ts` và `src/app/api/assets/[id]/maintenances/route.ts`:
  - Khi tạo/cập nhật phiếu sửa chữa có status là `IN_PROGRESS` -> Đổi status của Asset sang `PENDING` (hoặc tạo một status label `Đang sửa chữa` nếu chưa có).
  - Khi phiếu bảo trì chuyển sang `COMPLETED` hoặc `CANCELLED` -> Trả status của Asset về `DEPLOYABLE`.

### Bước 2: Health Score Engine
- Tạo file `src/lib/asset/health-score.ts`.
- Viết hàm `calculateHealthScore(asset)` nhận đầu vào là Asset (bao gồm `purchaseDate`, `purchaseCost`, `maintenances`, `depreciation`).
- Công thức: 100 điểm. 
  - Trừ điểm nếu tuổi đời > 3 năm (vd: -20đ), > 5 năm (-40đ).
  - Trừ điểm nếu tổng tiền sửa chữa `> 30%` giá mua (-30đ).
  - Trừ điểm nếu Giá trị khấu hao hiện tại = 0 (-50đ).

### Bước 3: Cập nhật UI (Virtual Inventory & Advisory)
- **Cảnh báo thay thế**: Tại `src/app/assets/[id]/AssetDetailClient.tsx` và `AssetsPageClient.tsx`, dùng hàm `calculateHealthScore` để hiển thị thanh màu (Xanh/Vàng/Đỏ) kèm cờ "Đề xuất thay thế" nếu điểm < 50.
- **Kho ảo**: Tại `AssetsPageClient.tsx`, thêm một row các nút bấm nhanh (Badge/Pills) trên thanh công cụ: "Kho khả dụng" (Lọc status=Deployable + assignedUserId=null), "Đang đi sửa" (Lọc status=Maintenance), "Thanh lý" (Archived). Bấm vào sẽ tự động apply filter tương ứng.
