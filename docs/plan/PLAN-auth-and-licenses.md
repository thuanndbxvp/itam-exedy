# BẢN VẼ KIẾN TRÚC: HỆ THỐNG AUTH & QUẢN LÝ BẢN QUYỀN

## 1. Tổng quan
Sếp đã duyệt kiến trúc tổng thể. Bây giờ chúng ta sẽ lên bản vẽ cho 2 module quan trọng tiếp theo để đưa vào MVP:
- **Hệ thống Đăng nhập (Auth):** Tích hợp `next-auth` với Credentials Provider để người dùng đăng nhập bằng Email, từ đó gán đúng User ID vào các lịch sử thao tác (ActionLog).
- **Trang Quản lý Bản quyền (Licenses):** Mở rộng hệ thống bằng module Licenses (dựa trên cấu trúc đã có của Assets), cho phép theo dõi bản quyền phần mềm và số lượng Seats.

## 2. Luồng Dữ liệu (Data Flow) & Kiến trúc
- **Authentication:** 
  1. Người dùng truy cập bị `middleware.ts` chặn lại nếu chưa đăng nhập.
  2. Redirect về trang `/login`. 
  3. Form login submit tới NextAuth API `api/auth/[...nextauth]/route.ts`. 
  4. NextAuth đối chiếu với database SQLite/Neon DB (bảng User) để cấp Session.
- **Licenses Management:** 
  Sử dụng chuẩn Server Actions như Asset. Luồng: `page.tsx` (Form) -> `actions/license.ts` -> DB (Prisma).

## 3. Danh sách các file cần tác động
**Phần Auth:**
1. `src/lib/auth.ts`: Định nghĩa Auth Options.
2. `src/app/api/auth/[...nextauth]/route.ts`: Cổng API cho NextAuth.
3. `src/middleware.ts`: Bảo vệ các route nội bộ.
4. `src/app/login/page.tsx`: Giao diện đăng nhập.

**Phần Licenses:**
1. `src/app/actions/license.ts`: Server Actions (Tạo mới bản quyền).
2. `src/app/licenses/page.tsx`: Danh sách bản quyền.
3. `src/app/licenses/new/page.tsx`: Form tạo mới.
