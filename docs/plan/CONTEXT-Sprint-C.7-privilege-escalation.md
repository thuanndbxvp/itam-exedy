# CONTEXT: Sprint C.7 - Vá lỗ hổng Phân quyền

**Bối cảnh:**
Trong lúc rà soát, phát hiện lỗ hổng rò rỉ dữ liệu (Data Leak): Nhân viên bình thường có thể dùng UI hoặc chọc vào URL `/settings/users` để xem toàn bộ danh sách nhân viên trong công ty. Lỗ hổng này xảy ra do Hard-coded permission bị sai lệch trong mảng `SYSTEM_ROLE_PERMISSIONS`. 

**Rủi ro:**
- Sau khi rút quyền, phải đảm bảo `EMPLOYEE` vẫn sử dụng được Helpdesk. Bất kỳ hàm nào đang phụ thuộc nhầm vào `assets.read` để cho phép User tạo Ticket sẽ bị vỡ, nên Tier 2 cần lưu ý (Dựa trên code hiện tại thì không bị ảnh hưởng).
