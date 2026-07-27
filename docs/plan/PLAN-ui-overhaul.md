# BẢN VẼ KIẾN TRÚC: ĐẠI TU GIAO DIỆN (UI OVERHAUL)

## 1. Tổng quan
Theo chỉ đạo của sếp, giao diện MVP Phase 1 quá sơ sài. Chúng ta sẽ tiến hành đại tu (overhaul) toàn bộ UI/UX để đạt chuẩn Premium (đẹp, hiện đại, mượt mà như Snipe-IT bản nâng cấp).
- **Layout mới:** Áp dụng mô hình AppShell với Sidebar cố định và Header.
- **Thư viện Icon:** Sử dụng `lucide-react` để có bộ icon đồng nhất, sang trọng.
- **Giao diện (Styling):** Tiếp tục dùng TailwindCSS nhưng nâng cấp cách sử dụng: phối màu HSL tinh tế, bo góc (rounded-2xl), bóng đổ (shadow-sm, glassmorphism) và hiệu ứng hover/transition.

## 2. Luồng Dữ liệu (Data Flow) & Kiến trúc
- Không thay đổi luồng dữ liệu (Data Flow) hiện tại của Prisma.
- Chỉ thay đổi cách Component được render và tái cấu trúc layout:
  - Khách truy cập -> `layout.tsx` (AppShell) -> Hiển thị Sidebar & Header -> Render nội dung từng page bên trong thẻ `main`.

## 3. Danh sách các file cần tác động
1. `package.json`: Cài thêm `lucide-react`.
2. `src/components/Sidebar.tsx` (Mới): Cột điều hướng bên trái.
3. `src/components/Header.tsx` (Mới): Thanh top bar.
4. `src/app/layout.tsx` (Sửa): Bọc `Sidebar` và `Header` vào Layout.
5. `src/app/page.tsx` (Mới): Trang Dashboard hiển thị số liệu thống kê.
6. `src/app/assets/page.tsx` (Sửa): Nâng cấp Data Table.
7. `src/app/assets/new/page.tsx` (Sửa): Nâng cấp Form nhập liệu.
