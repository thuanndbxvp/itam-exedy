# MSEW-Sprint-C.2: Xử lý lỗi xóa User vướng Foreign Key (Delete User FK)

## Mục tiêu
Khắc phục triệt để lỗi "Foreign key constraint violated" (P2003) khi Admin thao tác xóa một User trên hệ thống. Lỗi xảy ra do User bị trói buộc với các bản ghi Ticket, TicketComment, ActionLog với rule `Restrict`.

## Yêu cầu Nghiệp vụ (Business Requirements)
1. **Soft-delete (Xóa mềm) làm mặc định:** Thay vì xóa hẳn khỏi Database, API sẽ chuyển sang đánh dấu `deletedAt = NOW()`, vô hiệu hóa tài khoản (`activated = false`) và ẩn thông tin định danh (PII).
2. **Hard-delete có xác nhận:** Admin có thể ép xóa cứng (Force hard-delete) thông qua một tham số `force=true`. Tuy nhiên, API phải đếm (Pre-check) số lượng Ticket, Comment, ActionLog liên quan. Nếu có dữ liệu ràng buộc, API ném lỗi 409 Conflict kèm mô tả chi tiết bằng tiếng Việt để UI hiển thị.
3. **Thay đổi Schema (Cascade Null):** Sửa các FK constraint của `Ticket`, `TicketComment`, `TicketAttachment`, `ActionLog` đang trỏ về User từ `Restrict` sang `SetNull` (kèm đổi type thành Nullable). Điều này giúp thao tác Hard-delete không bao giờ bị dội lỗi DB.

## Chi tiết Triển khai kỹ thuật (Technical Specs)

### Bước 1: Thay đổi Database Schema
Mở `prisma/schema.prisma` và sửa 4 bảng:
1. `Ticket`: Đổi `reporterId` thành `String?` (nullable), đổi quan hệ `onDelete` thành `SetNull`.
2. `TicketComment`: Đổi `authorId` thành `String?`, `onDelete: SetNull`.
3. `TicketAttachment`: Đổi `uploaderId` thành `String?`, `onDelete: SetNull`.
4. `ActionLog`: Đổi `userId` thành `String?`, `onDelete: SetNull`.
=> Sau khi sửa, chạy `npx prisma migrate dev --name make_user_fks_nullable_setnull`.

### Bước 2: Cập nhật API Delete User
Mở `src/app/api/settings/users/[id]/route.ts`:
- Lấy `force` từ `req.json()` (cần try-catch vì DELETE body có thể rỗng).
- **Nếu `force=true`:**
  - Thực hiện đếm: `ticketsAsReporter`, `comments`, `attachments`, `actionLogs` của user.
  - Xóa cứng bằng `prisma.user.delete()`. Lỗi FK đã được chặn bởi SetNull ở Bước 1 nên chắc chắn thành công.
- **Nếu `force=false` (Mặc định):**
  - Update `deletedAt = new Date()`, `activated = false`.
  - Thay đổi (Anonymize) thông tin PII: `firstName = '[deleted]'`, `email = deleted-ID@removed.local`.
- Xóa cache phân quyền: `invalidatePermissionCache(id)`.

### Bước 3: Cập nhật Prisma Extension & API Get Users
- Đảm bảo danh sách User (`GET /api/settings/users`) chỉ fetch những người có `deletedAt: null`.
- Hoặc bổ sung Prisma Extension (nếu chưa có) để tự động filter out soft-deleted users trên toàn hệ thống.

### Bước 4: UI Handle "User đã xóa"
- Vì ID người dùng ở Ticket, Comment có thể bị `NULL` (do SetNull), giao diện chi tiết Ticket cần kiểm tra nếu `reporter == null` thì hiển thị chữ `[Người dùng đã bị xóa]`.

## Yêu cầu dành cho Tier 2 (Agent)
1. Hãy bắt đầu với việc sửa schema trước rồi migrate. Chú ý các field phải đổi sang nullable (`?`).
2. Sửa lại code API DELETE của user cẩn thận, test kỹ case soft-delete.
3. Cập nhật các UI component liên quan tới Ticket, Comment để không bị crash khi read thuộc tính của user = null.
