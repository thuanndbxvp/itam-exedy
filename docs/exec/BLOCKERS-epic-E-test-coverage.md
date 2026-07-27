# BLOCKERS — Epic E Test Coverage

## Blocker 1 — Prisma PGlite adapter không tồn tại trên registry

- Type: Dependency unavailable.
- Command: `npm view @prisma/adapter-pglite versions --json`.
- Output: npm HTTP 404 Not Found.
- Ảnh hưởng: Không thể trả về `PrismaClient` dùng `PrismaPGliteAdapter` như ví dụ MSEW.
- Xử lý: Áp Strategy C được user chỉ định: PGlite raw SQL và Prisma-compatible facade tại test boundary.
- Trạng thái: RESOLVED bằng fallback; không pin/downgrade Prisma 7.9.0.

## Blocker 2 — Authenticated Playwright flows chuyển tới `/api/auth/error`

- Type: Existing runtime/auth integration blocker.
- Command: `npm run test:e2e`.
- Output: 7 tests chạy trên Chromium; 1 anonymous redirect PASS, 6 authenticated/login flows FAIL.
- Điểm fail chung: sau submit credentials, URL chuyển từ `/login` tới `/api/auth/error` thay vì `/assets` hoặc hiển thị lỗi credentials.
- Browser binary: đã cài thành công; đây không phải lỗi thiếu browser.
- Môi trường: `.env` có đủ tên biến `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`; giá trị không được ghi vào evidence.
- Phạm vi: `src/lib/auth.ts` và auth route là production logic ngoài phạm vi sửa Epic E.
- Xử lý Epic E: giữ đủ 5 spec, lưu output fail, không `skip` test và không sửa auth runtime ngoài phạm vi.
- Đề xuất Phase 3: audit NextAuth v4 route-handler compatibility với Next.js 16 và truyền đầy đủ route context qua wrapper rate-limit trước khi chạy lại Playwright.
- Trạng thái: OPEN.

## Blocker 3 — Bonus không áp dụng

- GitHub Actions, Codecov, visual regression và Husky không triển khai theo adaptation vì workspace không phải Git repository.
- Trạng thái: ACCEPTED SKIP.
