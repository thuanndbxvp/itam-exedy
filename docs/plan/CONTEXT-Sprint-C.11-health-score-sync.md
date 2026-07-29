# CONTEXT: Sprint C.11 - Health Score & Auto Sync & Virtual Inventory

## 1. Bối cảnh
IT Manager cần biết được thiết bị nào đang quá cũ, sửa chữa quá nhiều, hoặc đã hết giá trị khấu hao (sổ sách = 0) để lên ngân sách mua thay thế. 
Ngoài ra, quy trình hiện tại đòi hỏi thao tác tay nhiều (tạo phiếu sửa chữa xong phải tự ra ngoài đổi trạng thái máy). Trang quản lý tài sản cũng chưa có các bộ lọc nhanh để xem ngay "Kho khả dụng" hay "Hàng đang sửa".

## 2. Quyết định kỹ thuật
- **Health Score**: Không lưu cứng vào DB (vì tuổi thọ và khấu hao thay đổi theo thời gian thực). Sẽ tính toán động (On-the-fly) khi query list hoặc detail, hoặc tính toán lúc build DTO. Tốt nhất là viết một Utility Function `calculateHealthScore(asset)` để dùng chung.
- **Auto Workflow Sync**: Móc thẳng vào API route của `AssetMaintenance` để trigger update status của `Asset`.
- **Virtual Inventory**: Sử dụng tính năng Smart Filters (Preset Filters) chèn thêm các nút bấm "Kho khả dụng", "Đang sửa chữa", "Hàng thanh lý" thay cho việc code nguyên module Inventory 3 cấp phức tạp.
