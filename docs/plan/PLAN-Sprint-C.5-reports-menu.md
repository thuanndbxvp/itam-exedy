# PLAN: Sprint C.5 - Tái cấu trúc Menu Báo cáo & Chi phí IT

## 1. Lý do cần tái cấu trúc (Context & Code Smells)
- **UX Smell:** Menu "Báo cáo" hiện tại có dạng dropdown (lồng nhau) chứa 2 mục con là "Tổng quan" và "Chi phí IT". Việc click vào Menu cha "Báo cáo" cũng dẫn đến trang Tổng quan, khiến cho menu con "Tổng quan" trở nên thừa thãi.
- **Tiện ích:** Menu dropdown làm tốn thêm 1 click của người dùng. Trải phẳng menu giúp truy cập báo cáo nhanh hơn.
- **Thẩm mỹ:** Nhóm cài đặt danh mục (Loại tài sản, Model, Nhà sản xuất, Nhà cung cấp) đang dùng chung một icon `LayoutGrid` gây nhàm chán và khó nhận diện bằng thị giác.

## 2. Giải pháp Kiến trúc & Luồng dữ liệu
- Gỡ bỏ thuộc tính `children` khỏi item "Báo cáo" trong mảng `NAVIGATION_GROUPS`.
- Đẩy "Chi phí IT" ra thành một mục độc lập ngang hàng với "Báo cáo" nằm trong nhóm "Vận hành & Hỗ trợ".
- Thay đổi icon cho 4 menu danh mục bằng các icon đặc trưng (`FolderOpen`, `Box`, `Factory`, `Package`).

## 3. Danh sách các file cần sửa chữa
- `src/components/Sidebar.tsx` (Sửa cấu trúc `NAVIGATION_GROUPS`)
