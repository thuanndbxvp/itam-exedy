# MSEW-Sprint-R.1: Thực thi Security Hotfixes

> **CẢNH BÁO CHO TIER 2:** Đây là bản vá bảo mật cấp độ Sống còn. Đọc kỹ từng dòng code, tuân thủ chặt chẽ việc chặn bắt lỗi.

## BƯỚC 1: VÁ LỖ HỔNG SQL INJECTION (Settings)
- **File:** `src/lib/settings.ts`
- **Hành động:** 
  1. Trong hàm `updateSettings(entries)`, xóa bỏ đoạn dùng `prisma.$executeRawUnsafe`.
  2. Tạo danh sách `allowedFields = ['companyName', 'currency', 'timezone', 'locale', 'primaryColor', 'passwordMinLength', 'emailFrom', 'supportEmail']`.
  3. Chỉ cho phép map các key nằm trong `allowedFields` vào một object `updateData`.
  4. Thực thi `await prisma.setting.update({ where: { id: 'system' }, data: updateData })`.

## BƯỚC 2: VÁ LỖ HỔNG XSS TRONG SIDEBAR
- **File:** `src/components/Sidebar.tsx`
- **Hành động:** 
  1. Xóa hoàn toàn 2 hàm `readPermCache` và `writePermCache`. Xóa luôn biến hằng số `PERM_CACHE_KEY`.
  2. Trong `useEffect` call API `/api/me/permissions`, bỏ đi dòng gọi hàm `writePermCache`. Trực tiếp set vào state `perms` mà không lưu qua sessionStorage nữa.

## BƯỚC 3: FIX AUTH BYPASS (API REPORTS)
- **Hành động:** Mở 6 file API báo cáo:
  - `src/app/api/reports/summary/route.ts`
  - `src/app/api/reports/assets-by-status/route.ts`
  - `src/app/api/reports/assets-by-category/route.ts`
  - `src/app/api/reports/assets-by-department/route.ts`
  - `src/app/api/reports/licenses-expiring/route.ts`
  - `src/app/api/reports/it-costs/route.ts`
- Bổ sung đoạn code kiểm tra quyền vào ngay đầu hàm `GET()`:
  ```typescript
  import { requirePermissionApi } from '@/lib/permissions/requirePermission'
  // ...
  const actor = await requirePermissionApi('reports.view')
  if (actor instanceof NextResponse) return actor
  ```

## BƯỚC 4: VÁ LỖ HỔNG IDOR (Asset History & Maintenances)
- **File 1:** `src/app/api/assets/[id]/history/route.ts`
  - **Hành động:** Sau dòng `requirePermissionApi('assets.read')`, bổ sung thêm logic:
    Lấy thông tin asset bằng `prisma.asset.findUnique({ where: { id } })`. Nếu `actor.role === 'EMPLOYEE'` và `asset.assignedUserId !== actor.id`, trả về `NextResponse.json` mã 403 "Không có quyền".
- **File 2:** `src/app/api/assets/[id]/maintenances/route.ts`
  - **Hành động:** Trong hàm `POST`, sau dòng `requirePermissionApi('assets.update')`, bổ sung:
    Nếu `actor.role === 'EMPLOYEE'`, trả về 403 "Chỉ nhân viên IT mới được tạo bản ghi bảo trì".

## BƯỚC 5: CHỐNG BRUTE-FORCE (RATE LIMITING)
- **File 1:** `src/app/api/auth/login/route.ts`
  - **Hành động:** Import `checkRateLimit` từ `@/lib/rate-limit`. Bổ sung check IP: max 5 requests / 15 phút. Nếu fail, trả về HTTP 429.
- **File 2:** `src/app/api/auth/login/2fa/route.ts`
  - **Hành động:** Import `checkRateLimit`. Bổ sung check IP: max 10 requests / 5 phút. Nếu fail trả về HTTP 429.
