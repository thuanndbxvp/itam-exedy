# MSEW-Sprint-R.2: Thực thi Database Optimization & Integrity

## BƯỚC 1: BỔ SUNG DATABASE INDEXES
- **File:** `prisma/schema.prisma`
- **Hành động:** 
  - Bổ sung `@@index([deletedAt])` vào cuối định nghĩa của **TẤT CẢ** các Model có trường `deletedAt`.
  - Riêng với `Asset`, bổ sung:
    `@@index([assignedUserId, deletedAt])`
    `@@index([categoryId, deletedAt])`
    `@@index([statusId, deletedAt])`
  - Riêng với `User`: `@@index([companyId, deletedAt])`
  - Riêng với `License`: `@@index([expirationDate, deletedAt])`
  - Riêng với `ActionLog`: `@@index([userId, createdAt])`
- **Lưu ý:** Sau khi sửa schema, Tier 2 **BẮT BUỘC** phải chạy lệnh `npx prisma db push` hoặc `npx prisma generate` để apply vào DB.

## BƯỚC 2: VÁ LỖ HỔNG DỮ LIỆU ĐÃ XÓA (Data Leak)
- **File 1:** `src/lib/commands/asset.ts`
  - Tìm tất cả các đoạn `tx.asset.findUnique({ where: { id: assetId } })` và thay bằng `tx.asset.findFirst({ where: { id: assetId, deletedAt: null } })`. (Vì Prisma không cho thêm where condition tự do vào findUnique ngoài unique key).
- **File 2:** `src/lib/commands/license.ts`
  - Làm tương tự: Sửa các query lấy `seatId` hoặc `licenseId` bằng `findFirst` đính kèm kiểm tra `deletedAt: null`.
- **File 3:** `src/app/api/permissions/roles/[id]/route.ts`
  - Sửa query `findMany` danh sách users: thêm `{ deletedAt: null }`.

## BƯỚC 3: FIX LỖI ACTIONLOG MỒ CÔI
- **File:** `src/app/api/settings/users/[id]/route.ts`
  - **Hành động:** Tại hàm DELETE (xóa user), trước khi xóa, bổ sung câu lệnh:
    ```typescript
    await prisma.actionLog.updateMany({
      where: { userId: id },
      data: { userId: 'system' }
    })
    ```

## BƯỚC 4: VALIDATE SỐ ÂM (Server Actions)
- **File 1:** `src/app/actions/asset.ts`
  - **Hành động:** Ở hàm tạo/sửa asset, kiểm tra nếu `data.purchaseCost < 0` hoặc `data.warrantyMonths < 0` thì `throw new Error('Giá trị không được là số âm')`.
- **File 2:** `src/app/actions/license.ts`
  - **Hành động:** Tương tự, kiểm tra `data.purchaseCost < 0`.

## BƯỚC 5: SỬA LỖI N+1 TRONG BÁO CÁO
- **Files:** `src/app/api/reports/assets-by-category/route.ts` và `src/app/api/reports/licenses-expiring/route.ts`
- **Hành động:** Tìm đoạn query `include: { _count: { select: ... } }` và đảm bảo điều kiện select có `where: { deletedAt: null }`.
