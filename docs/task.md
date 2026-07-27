# Tasks - Phase 1 MVP

- `[/]` 1. Dọn dẹp & Setup Dự án
  - `[ ]` Khảo sát thư mục hiện tại (`apps/web` và `packages`).
  - `[ ]` Cập nhật `docker-compose.yml` cho PostgreSQL.
  - `[ ]` Cài đặt Prisma & Auth.js.
- `[ ]` 2. Thiết lập Database & Prisma
  - `[ ]` Tạo `prisma/schema.prisma` với đầy đủ models (User, Location, Asset, License...).
  - `[ ]` Chạy Prisma format, validate và đẩy schema lên DB.
- `[ ]` 3. Xây dựng Modules Cốt lõi (Backend API)
  - `[ ]` Khởi tạo Prisma Client ở `lib/db.ts`.
  - `[ ]` Viết Server Actions / API cho Asset (CRUD + Checkout/Checkin logic).
- `[ ]` 4. Xây dựng Giao diện (Frontend)
  - `[ ]` Tạo trang Danh sách Tài sản.
  - `[ ]` Tạo trang Thêm mới Tài sản.
- `[ ]` 5. Verification & Testing
  - `[ ]` Chạy thử các tính năng bằng tay.
