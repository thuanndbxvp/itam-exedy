import NextAuth from "next-auth";
import { type NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

/**
 * Wrap NextAuth handler — giữ rate-limit 5 attempts/60s/IP cho POST.
 *
 * Epic E+1: FIX NextAuth v4.24.15 + Next.js 16 route handler signature.
 *
 * Vấn đề cũ (Epic D — đã verify fail runtime):
 *   - Cast unsafe `handler as unknown as (req: Request) => Promise<Response>`
 *   - KHÔNG forward `ctx` (chứa params.nextauth)
 *   - NextAuth v4.24.15 check `res.params` để phân biệt App Router vs Pages Router
 *     (xem node_modules/next-auth/next/index.js:88). Nếu KHÔNG có `res.params`,
 *     fallback sang `NextAuthApiHandler` dùng `req.query.nextauth` — NextRequest
 *     KHÔNG có `.query` chỉ có `.nextUrl.searchParams` → TypeError → 500 → /api/auth/error.
 *   - → Redirect /api/auth/error cho mọi auth flow.
 *
 * Fix: route handler signature `(req, ctx)` theo Next.js 16 convention,
 *      forward NGUYÊN VẸN cả `req` và `ctx` đến NextAuth handler. Next.js 16
 *      wrap params trong Promise, phù hợp với `RouteHandlerContext.params:
 *      Awaitable<{nextauth: string[]}>`. Rate-limit chỉ áp dụng cho POST,
 *      bypass cho GET (csrf, session, providers).
 */
async function rateLimitedHandler(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> }
): Promise<Response> {
  const method = req.method;

  // Rate-limit CHỈ áp dụng cho POST (sign-in, callback). GET → bypass.
  if (method === "POST") {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const result = checkRateLimit({
      key: `auth:${ip}`,
      max: 5,
      windowMs: 60_000, // 5 attempt / 60s / IP
    });

    if (!result.allowed) {
      return NextResponse.json(
        {
          error:
            "Too many login attempts from this IP. Please try again in a minute.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((result.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }
  }

  // Forward NGUYÊN VẸN cả req + ctx đến NextAuth route handler.
  // NextAuth v4.24.15 check res.params — nếu KHÔNG có params → fallback NextAuthApiHandler → 500.
  return (handler as unknown as (
    req: NextRequest,
    ctx: { params: Promise<{ nextauth: string[] }> }
  ) => Promise<Response>)(req, ctx);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };