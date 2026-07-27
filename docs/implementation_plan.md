# Kế hoạch Triển khai (Implementation Plan) - Phase 1 MVP

Tài liệu này vạch ra các bước thực thi kỹ thuật để hoàn thành **Phase 1: Core MVP** dựa trên kiến trúc đã được định hình tại `BRAINSTORM-ARCHITECTURE.md`.

## User Review Required
> [!IMPORTANT]
> - Việc xóa bỏ các phần liên quan đến GLPI cũ có thể ảnh hưởng đến code hiện tại trong thư mục `apps/web`. Vui lòng xác nhận rằng chúng ta có thể dọn dẹp thư mục này (hoặc tạo mới) để setup lại Next.js sạch.
> - Dự án sẽ sử dụng **Prisma** và **PostgreSQL** nội bộ (qua Docker). Hãy đảm bảo máy bạn cài sẵn Docker (nếu chạy local) hoặc chuẩn bị sẵn 1 chuỗi kết nối Database Postgres.

## Open Questions
- Bạn muốn dùng **Auth.js (NextAuth)** cho tính năng đăng nhập không? Nếu có, trước mắt sẽ dùng Email/Password cơ bản hay SSO (Google/Microsoft)?
- Chúng ta có tiếp tục dùng **Turborepo** và cấu trúc Monorepo như hiện tại trong thư mục, hay chuyển thành cấu trúc Next.js chuẩn thông thường cho đỡ phức tạp?

## Proposed Changes

### 1. Dọn dẹp & Setup Dự án
Thực hiện dọn dẹp các tệp liên quan đến hệ thống GLPI cũ và thiết lập môi trường mới.
#### [MODIFY] [package.json](file:///d:/IT-management/package.json)
- Cập nhật dependencies, loại bỏ những thư viện không cần thiết.
#### [NEW] [docker-compose.yml](file:///d:/IT-management/docker-compose.yml) (Ghi đè)
- Cấu hình PostgreSQL db server phục vụ cho Prisma.

### 2. Thiết lập Database & Prisma
Khởi tạo cấu trúc Database sơ bộ cho Phase 1.
#### [NEW] [prisma/schema.prisma](file:///d:/IT-management/prisma/schema.prisma)
- Định nghĩa schema cho `User`, `Location`, `Department`, `StatusLabel`, `Asset`, `License`, `LicenseSeat`, `ActionLog`.

### 3. Xây dựng Modules Cốt lõi (Backend API & Server Actions)
Xây dựng các API Routes hoặc Server Actions để thao tác với Database.
#### [NEW] [apps/web/lib/db.ts](file:///d:/IT-management/apps/web/lib/db.ts)
- Khởi tạo Prisma Client.
#### [NEW] [apps/web/app/actions/asset.ts](file:///d:/IT-management/apps/web/app/actions/asset.ts)
- Logic CRUD cho Asset và hàm `checkoutAsset`, `checkinAsset` (kèm tự động ghi ActionLog).

### 4. Xây dựng Giao diện (Frontend)
Tạo UI quản lý dựa trên shadcn/ui và Tailwind.
#### [NEW] [apps/web/app/(dashboard)/assets/page.tsx](file:///d:/IT-management/apps/web/app/(dashboard)/assets/page.tsx)
- Bảng danh sách Tài sản (Dùng TanStack Table).
#### [NEW] [apps/web/app/(dashboard)/assets/new/page.tsx](file:///d:/IT-management/apps/web/app/(dashboard)/assets/new/page.tsx)
- Form tạo mới tài sản (Dùng react-hook-form + Zod).

## Verification Plan

### Automated Tests
- Chạy `npx prisma format` và `npx prisma validate` để đảm bảo schema chuẩn.
- Viết một số Unit test cơ bản cho hàm `checkoutAsset` để đảm bảo logic ghi Log hoạt động.

### Manual Verification
- Chạy `docker-compose up -d` để khởi động DB.
- Chạy `pnpm dev`, mở trình duyệt.
- Thử thêm mới 1 Nhân viên, 1 Laptop.
- Bấm nút "Cấp phát" Laptop cho Nhân viên và kiểm tra bảng Log xem có ghi nhận đúng hay không.
