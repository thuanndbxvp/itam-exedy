import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { isAuthorized } from "@/lib/auth-guard"

/**
 * Proxy (Next.js 16 alias cho 'middleware') — gate protected routes.
 *
 * Epic C+0.5: rename `src/middleware.ts` → `src/proxy.ts`.
 *
 * Next.js 16 hỗ trợ CẢ HAI tên file:
 * - `proxy.ts` (khuyến nghị mới)
 * - `middleware.ts` (legacy, có thể kèm warning deprecation)
 *
 * Lý do rename:
 * - Tránh warning "middleware file convention is deprecated" trong dev server log.
 * - Đồng bộ với khuyến nghị mới của Next.js 16+.
 *
 * Sau Epic C:
 * - Anonymous user truy cập `/`, `/assets/*`, `/licenses/*` → redirect `/login?callbackUrl=...`
 * - Authenticated user → pass through
 *
 * Phase 1 chỉ check `!!token` (logic ở `src/lib/auth-guard.ts`).
 * Phase 2 (Epic C+1) sẽ check `token.role` để phân quyền ADMIN/EMPLOYEE.
 *
 * Lưu ý Edge runtime:
 * - KHÔNG được import `prisma` ở đây (Prisma client không tương thích Edge).
 * - Chỉ check JWT token từ cookie session.
 */
export default withAuth(
  function middleware() {
    // Nếu authenticated → pass through
    // Nếu anonymous → NextAuth withAuth đã tự redirect về pages.signIn
    // (mặc định: /login). Callback URL tự động nằm trong ?callbackUrl=...
    return NextResponse.next()
  },
  {
    callbacks: {
      // CHỈ return true nếu có token. false → redirect về signIn page.
      authorized: ({ token }) => isAuthorized(token),
    },
    pages: {
      signIn: '/login',
    },
  }
)

/**
 * Matcher: gate các protected routes.
 *
 * - `/` (dashboard)
 * - `/assets/:path*` (list, new, show, edit — tất cả children)
 * - `/licenses/:path*` (tương tự)
 *
 * KHÔNG gate:
 * - `/login` (auth page — phải accessible khi chưa login)
 * - `/api/auth/*` (NextAuth handler — public)
 * - `/api/*` khác (Phase 2 sẽ gate riêng)
 * - `/settings/*` (chưa có route — Phase 2 sẽ gate)
 * - Static files (`_next/static`, `favicon.ico`, etc.) — Next.js tự skip
 */
export const config = {
  matcher: ["/", "/assets/:path*", "/licenses/:path*", "/settings/:path*"]
}
