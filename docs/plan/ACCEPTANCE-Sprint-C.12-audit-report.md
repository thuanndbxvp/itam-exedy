# ACCEPTANCE CRITERIA: Sprint C.12

Tất cả các tiêu chí sau phải được đánh dấu hoàn thành trước khi chốt lại Sprint C.12.

1. **Hiệu suất (Performance):**
   - Truy vấn Prisma trong trang Server Component cần đảm bảo tốc độ nhanh, chạy đồng thời (sử dụng `Promise.all` khi đếm).
   - Không được dùng Client Component để fetch data ban đầu nếu không cần tính tương tác phức tạp (ưu tiên Server Component để SEO và tốc độ load nhanh nhất).

2. **Giao diện (UI/UX):**
   - Các thẻ đếm (Counter Cards) phải giữ phong cách thiết kế hiện đại, đồng nhất với trang `/reports` tổng quan (Sử dụng các màu accent đặc trưng như Đỏ nhạt cho Quá hạn, Vàng nhạt cho Sắp tới hạn).
   - Bảng dữ liệu phải rõ ràng, có trạng thái trực quan để người dùng nhận biết ngay lập tức.
   
3. **Tuân thủ luồng phân quyền:**
   - Bảo vệ tuyệt đối Route `/reports/audit` bằng `requirePermission('reports.view')`. Bất kỳ ai không có quyền cố tình gõ URL đều phải bị chặn lại hoặc văng về trang chủ.

4. **Kiểm duyệt Code (Code Review):**
   - Code không có lỗi TypeScript (Sử dụng đúng kiểu dữ liệu).
   - Không gây tác động tiêu cực hay phá hỏng các component khác đang chạy ổn định trong hệ thống (Đặc biệt là Sidebar).
