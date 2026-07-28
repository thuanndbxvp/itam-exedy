# PLAN: Sprint C.8 - Hiển thị Thiết bị đính kèm (Child Assets)

## 1. Mục tiêu (Context)
Hệ thống hiện tại đã cho phép gắn một thiết bị vào một thiết bị khác (ví dụ: gắn Chuột, Bàn phím vào Laptop). Tuy nhiên, có 2 vấn đề về mặt hiển thị:
1. **Trang chi tiết Tài sản (`/assets/[id]`):** Không hiển thị danh sách các thiết bị con (chuột, phím) đang cắm vào máy này.
2. **Trang Dashboard nhân viên (`/`):** Khi nhân viên được cấp Laptop, họ không thấy chuột và bàn phím (đính kèm theo Laptop) trong danh sách "Tài sản của tôi", dễ gây bối rối khi kiểm kê hoặc báo lỗi qua Helpdesk.

## 2. Giải pháp Kiến trúc
1. **API My Assets (`/api/helpdesk/my-assets/route.ts`):** 
   - Mở rộng điều kiện Query `prisma.asset.findMany` để lấy cả những thiết bị có `assignedAsset.assignedUserId === user.id`. 
   - Các thiết bị này sẽ được gộp chung vào danh sách `assets` trả về cho Frontend, giúp hiển thị tự động lên Dashboard và cả ô chọn thiết bị khi tạo Ticket.
2. **Chi tiết Tài sản (`src/app/assets/[id]/...`):** 
   - Fetch thêm mảng `assignedToAssets` (các tài sản con).
   - Thêm 1 Tab mới "Thiết bị đi kèm" trên giao diện Client. Hiển thị danh sách các thiết bị con này.

## 3. Các file bị ảnh hưởng
- `src/app/api/helpdesk/my-assets/route.ts`
- `src/app/assets/[id]/page.tsx`
- `src/app/assets/[id]/AssetDetailClient.tsx`
