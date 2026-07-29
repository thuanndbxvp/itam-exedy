# ACCEPTANCE CRITERIA: Sprint C.11

Tất cả các tiêu chí sau phải được đánh dấu hoàn thành trước khi chốt lại Sprint C.11.

1. **Hiệu suất (Performance):**
   - Việc tính toán Health Score không được làm sập trang danh sách Asset khi có 1000 records. (Gợi ý Tier 2: Trả Health Score trực tiếp từ query hoặc thiết kế sao cho không nổ N+1 query).

2. **Giao diện Trực quan:**
   - Các nút "Kho ảo" phải nằm ở vị trí dễ bấm, dễ nhìn (có màu sắc phân biệt), có bộ đếm số lượng (ví dụ: Kho khả dụng (45)).
   - Nút Cảnh báo thay thế phải thật nổi bật (Màu Đỏ/Cam) ở trang chi tiết thiết bị để IT Manager đập mắt vào là thấy ngay.

3. **Luồng dữ liệu chặt chẽ:**
   - Việc đồng bộ Status (Sync) phải bao bọc trong Prisma Transaction (nếu có thể) hoặc có cơ chế bắt lỗi để tránh tình trạng tạo phiếu sửa xong mà máy vẫn báo Deployable vì lỗi mạng.
