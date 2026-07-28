# MSEW-Sprint-C.8: Thực thi Child Assets Visibility

## BƯỚC 1: CẬP NHẬT API MY-ASSETS
- **File:** `src/app/api/helpdesk/my-assets/route.ts`
- **Hành động:** 
  Tìm đoạn query `prisma.asset.findMany`. Thay đổi mệnh đề `where` thành:
  ```typescript
  where: {
    deletedAt: null,
    OR: [
      { assignedUserId: user.id },
      { assignedAsset: { assignedUserId: user.id } }
    ]
  },
  ```
  *(Lưu ý: Map data trả về giữ nguyên cấu trúc, Frontend Dashboard sẽ tự động hiển thị thêm các thiết bị con này)*.

## BƯỚC 2: CẬP NHẬT TRANG CHI TIẾT TÀI SẢN (SERVER)
- **File:** `src/app/assets/[id]/page.tsx`
- **Hành động:** 
  Tại hàm `prisma.asset.findUnique`, bổ sung vào khối `include`:
  ```typescript
  assignedToAssets: {
    where: { deletedAt: null },
    select: {
      id: true,
      assetTag: true,
      name: true,
      category: { select: { name: true } },
      status: { select: { name: true, color: true } },
    }
  },
  ```

## BƯỚC 3: CẬP NHẬT GIAO DIỆN CHI TIẾT TÀI SẢN (CLIENT)
- **File:** `src/app/assets/[id]/AssetDetailClient.tsx`
- **Hành động:** 
  1. Trong thẻ bọc các `TabButton`, thêm 1 tab mới: 
     `<TabButton active={tab === 'children'} onClick={() => setTab('children')} icon={<Monitor className="w-4 h-4 mr-2" />}>Thiết bị đi kèm ({asset.assignedToAssets?.length || 0})</TabButton>`
  2. Bổ sung logic render nội dung tab `children` ở phần Content phía dưới. Nếu `asset.assignedToAssets.length === 0`, hiển thị text "Không có thiết bị đi kèm". Nếu có, hiển thị 1 table đơn giản liệt kê Mã tài sản (`assetTag`), Tên (`name`), Danh mục (`category.name`), và Trạng thái (`status.name` với màu sắc `status.color`). Có thể bọc `Link` ở cột Mã tài sản để user click vào xem thiết bị con.
