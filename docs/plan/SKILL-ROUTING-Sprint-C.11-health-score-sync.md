# SKILL ROUTING: Sprint C.11 - Health Score

## Backend & Logic
- `src/app/api/assets/[id]/maintenances/route.ts`: Cập nhật logic đổi Asset Status.
- `src/app/api/maintenances/[id]/route.ts`: Cập nhật logic đổi Asset Status.
- `src/lib/asset/health-score.ts` **(NEW)**: Engine tính điểm Health Score.
- `src/lib/asset/depreciation.ts`: (Có thể tạo mới/cập nhật) để tính giá trị khấu hao hiện tại.

## Frontend UI
- `src/app/assets/AssetsPageClient.tsx`: Thêm UI Kho Ảo (Preset Filters). Thêm cột Health Score/Cảnh báo vào bảng.
- `src/app/assets/[id]/AssetDetailClient.tsx`: Hiển thị Dashboard nhỏ trong chi tiết Asset về điểm sức khỏe và tỷ lệ khấu hao.
