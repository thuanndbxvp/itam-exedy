# MSEW-Sprint-C.6: Thực thi Asset-centric Helpdesk

## BƯỚC 1: MỞ KHÓA API TẠO TICKET
- **File:** `src/app/api/tickets/route.ts`
- **Hành động:** 
  Tìm đoạn code kiểm tra quyền `canReportForAsset` và `reportedLicenseSeatId`. Chỉnh sửa logic để bypass quyền nếu user thuộc khối IT:
  ```typescript
  const isIT = ['ADMIN', 'IT_MANAGER', 'IT_STAFF'].includes(user.role);
  
  if (reportedAssetId && !isIT) {
    const ok = await canReportForAsset(user.id, reportedAssetId);
    if (!ok) throw new ForbiddenError("Bạn không có quyền báo lỗi cho tài sản này.");
  }
  
  if (reportedLicenseSeatId && !isIT) {
    // ... giữ nguyên logic cũ bên trong if ...
  }
  ```

## BƯỚC 2: TẠO API TÌM KIẾM TOÀN CỤC
- **File:** Tạo file mới `src/app/api/helpdesk/search-assets/route.ts`
- **Hành động:** 
  1. Kiểm tra session/role bằng hàm tiện ích có sẵn. Nếu role là `EMPLOYEE`, trả về lỗi 403.
  2. Lấy tham số `q` từ request (`req.nextUrl.searchParams.get('q') || ''`).
  3. Dùng `prisma.asset.findMany` tìm kiếm `q` trong `name` hoặc `assetTag` (`contains`, `mode: 'insensitive'`). Nhớ thêm `deletedAt: null`. `take: 20`. `select` các trường giống hệt `/api/helpdesk/my-assets/route.ts`.
  4. Map kết quả trả về đúng định dạng:
     ```json
     { "data": { "assets": [ { "id", "assetTag", "name", "modelName", "categoryName" } ], "licenseSeats": [] } }
     ```

## BƯỚC 3: TÍCH HỢP AUTOCOMPLETE LÊN FRONTEND
- **File:** `src/app/helpdesk/new/page.tsx`
- **Hành động:** 
  1. Dùng `useSession` lấy thông tin user và check `isIT = ['ADMIN', 'IT_MANAGER', 'IT_STAFF'].includes(session?.user?.role)`.
  2. Trong trường hợp `mode === 'asset'`, kiểm tra `isIT`.
  3. Nếu `isIT === false` (EMPLOYEE), giữ nguyên thẻ `<select>` cũ.
  4. Nếu `isIT === true`, render một thẻ `<input type="text" />` để gõ text tìm kiếm. Viết hàm `onChange` debounce gọi API `/api/helpdesk/search-assets?q=...` và update state `myData.assets`.
  5. Xây dựng một ô `<ul className="absolute z-10 bg-white shadow-lg border ...">` để xổ xuống kết quả khi gõ chữ. Khi click vào 1 phần tử `<li>`, gắn giá trị id vào `setReportedAssetId(id)`, cập nhật giá trị text vào input, và ẩn danh sách đi.
