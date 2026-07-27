# Blockers — epic-A1-schema

## Blocker #1 — Phát sinh khi thực thi Step 2 (validate Prisma 7)
- **Type:** Wrong Skill / Impossible (Prisma 7 không tương thích 100% cú pháp MSEW)
- **Description:** Khi chạy `npx prisma validate` với schema copy nguyên từ MSEW, Prisma 7.9.0 báo 2 lỗi:
  1. **Lỗi 1 — `url` không còn được phép trong `datasource`:**
     ```
     error: The datasource property `url` is no longer supported in schema files.
     Move connection URLs for Migrate to `prisma.config.ts` and pass either `adapter`
     for a direct database connection or `accelerateUrl` for Accelerate to the `PrismaClient`
     constructor.
     ```
     → MSEW viết `url = env("DATABASE_URL")` trong schema, nhưng Prisma 7 đã bỏ syntax này. URL phải được khai báo trong `prisma.config.ts` (đã có sẵn ở repo này).

  2. **Lỗi 2 — `Company.users` bị duplicate:**
     ```
     error: Field "users" is already defined on model "Company".
     ```
     → `Company.users CompanyUser[]` và `User.companies CompanyUser[]` không có `@relation(name: ...)` rõ ràng. Prisma 7 đoán nhầm tên relation mặc định là `users` và báo conflict.

- **Hành động tối thiểu (không phá logic):**
  - **Sửa #1:** Bỏ `url = env("DATABASE_URL")` khỏi `datasource db` trong `schema.prisma`. Connection URL đã có ở `prisma.config.ts` line 13 (`url: process.env["DATABASE_URL"]`) — không cần khai báo lại.
  - **Sửa #2:** Thêm `@relation("CompanyUsers", fields: [...], references: [...])` cho `Company.users` và `User.companies` (cả 2 phía cùng tên relation).

- **Suggestion cho Planner (nếu có):** Cập nhật MSEW-epic-A1-schema.md §BƯỚC 2 để tương thích Prisma 7. Nhưng Tier 2 vẫn tiến hành vì 2 sửa đổi trên không thay đổi invariant/cấu trúc model, chỉ là syntax adapter.

## Blocker #2 — Phát sinh sau khi fix Blocker #1
- **Type:** Wrong Schema Design (MSEW có relation không khả thi)
- **Description:** Validate pass lỗi 1, nhưng báo thêm 3 lỗi back-relation:
  1. `Category.assets Asset[]` thiếu opposite trên `Asset` — nhưng Asset không có `categoryId` trực tiếp (chỉ có `modelId` → AssetModel.categoryId).
  2. `Manufacturer.assets Asset[]` thiếu opposite trên `Asset` — tương tự, Asset không có `manufacturerId` trực tiếp (chỉ qua AssetModel).
  3. `User.company Company?` thiếu back-relation field `users` trên Company (vì Company đã có `users CompanyUser[]` dùng cho FMCS pivot, nhưng thiếu back-relation cho User.companyId trực tiếp Phase 1).

- **Phân tích:** MSEW §BƯỚC 2 định nghĩa `Asset` KHÔNG có `categoryId`/`manufacturerId` trực tiếp (chỉ có `modelId`). Nhưng lại thêm `Category.assets` và `Manufacturer.assets` ở phía master data — Prisma 7 giờ strict yêu cầu mọi relation 2 chiều phải khai báo tường minh. MSEW thiếu 3 back-relation.

- **Hành động tối thiểu:**
  - Thêm `company User[]` vào Company (back-relation cho User.company).
  - Đổi tên `Category.assets Asset[]` thành `assetsModeled Asset[] @relation("CategoryViaAssetModel")` — KHÔNG cần opposite vì Asset không reference trực tiếp. **Thực tế:** quan hệ qua AssetModel.categoryId là quan hệ 2 bước, nên `Category.assets` chỉ là query hint — phải đổi tên thành relation name riêng và KHÔNG tạo back-relation trên Asset (Prisma sẽ dùng nó như relation 1 chiều, OK cho query ngược qua AssetModel).

- **Quyết định:** Đổi tên relation trên `Category.assets` → `assetModels` chỉ qua `AssetModel.category`. Loại bỏ back-relation `Category.assets` vì Asset không có direct FK. Tương tự Manufacturer.

- **Suggestion cho Planner:** Cập nhật MSEW §BƯỚC 2 để loại bỏ `Category.assets`, `Manufacturer.assets` (vì Asset không reference trực tiếp). Query `Category.assets` thực tế phải qua `AssetModel.assets where model.categoryId = ...`.

- **Awaiting:** Không cần chờ — sửa tối thiểu để validate pass. MSEW bản chất không sai về logic — chỉ thiếu khai báo relation name.

## Blocker #3 — Phát sinh sau khi fix Blocker #2
- **Type:** Prisma 7 strict relation check
- **Description:** Vẫn còn lỗi "relation field X is missing opposite". Prisma 7 yêu cầu mọi relation phải có 2 phía khai báo tường minh.

- **Quyết định cuối:** Loại bỏ hoàn toàn `Category.assets`, `Manufacturer.assets`, `Supplier.assets`, `License.category/manufacturer/supplier`, v.v. — các relation mà Asset không có FK trực tiếp. Prisma 7 không cho phép relation 1 phía (orphan relation). Tương tự: `Category.assetModels` chỉ OK nếu AssetModel có `categoryId` (đúng — AssetModel có).

- **Awaiting:** Áp dụng sửa tối thiểu.


