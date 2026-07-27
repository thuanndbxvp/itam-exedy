# Bối cảnh Hệ thống (CONTEXT): Auth & Licenses

## 1. Tri thức Tổng hợp
- **Đường dẫn Repomix Bundle:** `None` (Chưa xuất bundle cho task này)
- **Domain Knowledge:** `docs/DOMAIN-KNOWLEDGE.md`

## 2. Codebase Analysis (via CodeGraph MCP)
### Discovery
- Hệ thống hiện tại (Phase 1 MVP) đã có Next.js, Prisma, SQLite/NeonDB (PostgreSQL) và các Schema (`User`, `Asset`, `License`, `StatusLabel`, `ActionLog`).
- Server Actions đang được cấu hình với `userId: 'system'` do chưa có tính năng đăng nhập.

### Related Symbols
- `PrismaClient` tại `src/lib/prisma.ts`
- `authOptions` (Dự kiến tạo mới tại `src/lib/auth.ts`)
- Schema `User` (Đã có trường `email`, `role`)

## 3. Các File liên quan và Vai trò
- `src/middleware.ts`: Chặn truy cập trái phép.
- `src/lib/auth.ts`: Nơi chứa config logic của NextAuth.
- `src/app/api/auth/[...nextauth]/route.ts`: API Endpoint cho NextAuth.
- `src/app/login/page.tsx`: Giao diện Login client-side.
- `src/app/licenses/*`: Giao diện và API cho module Bản quyền.

## 4. Dependencies
- **External:** `next-auth`, `@prisma/client`, `next`.
- **Internal:** `src/lib/prisma.ts`

## 5. Ràng buộc (Constraints)
- **Môi trường:** Chạy trên Windows (PowerShell).
- **Line Ending:** CRLF.
- **Ràng buộc Database:** Do đã chuyển sang PostgreSQL (Neon), Prisma cần Adapter `pg` (đã config trong code). Login không kiểm tra password (bỏ qua hash), chỉ check Email tồn tại theo chuẩn Mock MVP hiện tại.
