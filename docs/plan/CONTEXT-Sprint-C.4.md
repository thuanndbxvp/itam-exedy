# Bối cảnh Hệ thống (CONTEXT): Sprint C.4 - Nâng cấp UX & Security

## 1. Tri thức Tổng hợp
- **Đường dẫn Repomix Bundle:** `.\CONTEXT_BUNDLE.md`
- **Tóm tắt Vấn đề Hiện tại:**
  - Lỗ hổng quy trình: Tính năng xóa tài sản (Soft-delete) thực hiện không có bước xác thực mật khẩu người dùng, dẫn đến rủi ro nội bộ và khó truy vết.
  - Vấn đề UX/UI: Ứng dụng lạm dụng `alert()` và `confirm()` trình duyệt, gây chặn luồng xử lý và mất thẩm mỹ. Không có thông báo phản hồi (Toast) khi lưu thành công dữ liệu.
  - Giao diện form: Form cấu hình Vị trí quá dài (1 cột), các form chứa nhiều thuật ngữ khó (Khấu hao, Trực thuộc) không có tooltips hướng dẫn.

## 2. Codebase Analysis (via CodeGraph MCP)

### Discovery
- Các file trọng yếu bị ảnh hưởng chủ yếu nằm ở thư mục `src/app/assets` và `src/components/settings`. Phụ thuộc vào `react-hot-toast` sẽ được thêm vào gốc ứng dụng.

### Các hàm/component liên đới (Related Symbols)
- `<Modal>` tại `src/components/ui/Modal.tsx`
- `<EntityTable>` tại `src/components/settings/EntityTable.tsx`
- API Route `DELETE /api/assets/[id]`

## 3. Các File liên quan và Vai trò
- `src/app/api/assets/[id]/route.ts`: Cần cập nhật logic Delete để yêu cầu password.
- `src/app/assets/AssetsPageClient.tsx` & `AssetDetailClient.tsx`: Giao diện truyền tham số password xuống API.
- `src/app/layout.tsx`: Nơi sẽ đặt Provider cho `<Toaster />`.
- `src/components/settings/LocationsTable.tsx` & `DepreciationTable.tsx`: Các form cần bổ sung Layout Grid 2 cột và Tooltips.

## 4. Dependencies
- **External:** 
  - `react-hot-toast` (Cần cài mới)
  - `bcryptjs` (Đã có sẵn để compare password)
  - `lucide-react` (Đã có sẵn để lấy icon Tooltips)
- **Internal:** 
  - Component `<Modal>` (Có sẵn)

## 5. Ràng buộc (Constraints)
- **Môi trường:** Chạy trên môi trường Next.js (App Router), Node.js.
- **Styling:** Bắt buộc dùng TailwindCSS.
- **Bảo mật:** Không được log raw password ra console. Phải dùng `bcrypt.compare`.
