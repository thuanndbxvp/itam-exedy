# CONTEXT: Sprint C.5 - Menu Báo cáo

**Bối cảnh:** 
Yêu cầu trải phẳng giao diện điều hướng (Flat navigation) đang được ưu tiên để tiết kiệm số lần click chuột. Dropdown menu trước đó bị người dùng đánh giá là dư thừa khi truy cập Báo cáo.

**Rủi ro:**
- Khi dời "Chi phí IT" ra ngoài, phải đảm bảo nó vẫn check đúng quyền `reports.view` và role `['ADMIN', 'IT_MANAGER']` để tránh rò rỉ dữ liệu cho Employee.
