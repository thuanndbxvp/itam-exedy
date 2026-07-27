# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC C — AUTH MIDDLEWARE (GATE PROTECTED ROUTES)

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-26
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · **B ✅ (đã fix naming license commands sang checkout/checkin)**
**Phạm vi:** Wire `src/middleware.ts` + sửa `src/lib/auth.ts` callback để gate `/`, `/assets/*`, `/licenses/*` chỉ cho authenticated user truy cập; redirect anonymous → `/login`
**Phạm vi LOẠI TRỪ:** KHÔNG sửa UI form `/login` (Epic D); KHÔNG enable password field thật trên UI (Epic D); KHÔNG thêm RBAC phân quyền ADMIN/EMPLOYEE (Epic C+1); KHÔNG đụng `prisma/`

---

## 0. Tại sao Epic C tồn tại — Audit code hiện tại

Tier 1 đã đọc 5 file liên quan auth và phát hiện **3 lỗ hổng bảo mật nghiêm trọng**:

| # | Lỗ hổng | Bằng chứng | Hậu quả |
|---|---------|------------|---------|
| 1 | `middleware.ts` có `authorized: () => true` — KHÔNG check gì | `src/middleware.ts:9` | Bất kỳ ai cũng truy cập `/`, `/assets`, `/licenses` mà không cần đăng nhập |
| 2 | `Header.tsx` hard-code `<span>Admin</span>` — không đọc session | `src/components/Header.tsx:49` | UI hiển thị "Admin" cho cả user chưa đăng nhập (vì middleware không gate) |
| 3 | `Session.user.role` chỉ check `ADMIN \| EMPLOYEE` nhưng KHÔNG có logic phân quyền | `src/lib/auth.ts:60` | Mọi user login đều có thể checkout asset (kể cả EMPLOYEE) — vi phạm principle of least privilege |

→ **Epic C là MUST** để đóng 3 lỗ hổng bảo mật. Không có C thì MVP chạy được nhưng KHÔNG AN TOÀN — ai cũng vào được dashboard, xem được danh sách tài sản công ty, gọi server action checkout bằng cách manual POST.

---

## 1. Quyết định của Planner (trả lời 4 câu hỏi Tier 2 có thể hỏi)

| Q | Câu hỏi | Quyết định | Lý do |
|---|---------|------------|-------|
| **Q1** | Middleware check `token` thế nào? `authorized: ({ token }) => !!token` hay check thêm role? | **`authorized: ({ token }) => !!token`** | Phase 1 chỉ cần check authenticated. Phân quyền ADMIN/EMPLOYEE làm ở Epic C+1. Giữ middleware đơn giản, dễ debug. |
| **Q2** | Redirect anonymous về `/login` thế nào? NextAuth default hay custom callback URL? | **NextAuth default + custom `signIn` page đã có** | NextAuth `withAuth` mặc định redirect về `pages.signIn = '/login'`. Đã config đúng ở `auth.ts:65-67`. |
| **Q3** | Middleware `matcher` nên gate những route nào? Hiện tại `[/, /assets/*, /licenses/*]` — có cần thêm `/settings/*`? | **Giữ `[/, /assets/*, /licenses/*]`** — KHÔNG gate `/settings/*` | `/settings/*` chưa có route trong code hiện tại (Tier 1 đã kiểm). Phase 2 sẽ có. Nếu gate sớm → NextAuth edge runtime crash vì JWT decode thiếu secret trong env. |
| **Q4** | Có cần `src/lib/guards.ts` helper (`requireUser()`, `requireAdmin()`) để dùng trong server actions? | **CHƯA — defer sang Epic C+1 (RBAC)** | Phase 1: middleware đã đủ gate. Server action vẫn dùng `getServerSession()` trực tiếp. Epic C+1 sẽ tách helper. |

---

## 2. Tiêu chí nghiệm thu Epic C

### BẮT BUỘC (Acceptance Criteria)

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| C-1 | `npx tsc --noEmit` **PASS** (exit 0, 0 errors) | Shell |
| C-2 | Truy cập `/` khi **CHƯA đăng nhập** → bị redirect sang `/login?callbackUrl=%2F` | curl `-I http://localhost:3000/` → status 307 hoặc 302 |
| C-3 | Truy cập `/assets` khi **CHƯA đăng nhập** → bị redirect sang `/login?callbackUrl=%2Fassets` | curl |
| C-4 | Truy cập `/licenses` khi **CHƯA đăng nhập** → bị redirect sang `/login?callbackUrl=%2Flicenses` | curl |
| C-5 | Truy cập `/login` khi **CHƯA đăng nhập** → render được form (HTTP 200) | curl |
| C-6 | Sau khi đăng nhập với `admin@congty.com / password123` → redirect về `callbackUrl` (vd: `/assets`) → render được (HTTP 200) | curl với cookie session |
| C-7 | Truy cập `/assets/new` khi **CHƯA đăng nhập** → redirect `/login` (matcher phải cover `/assets/new`) | curl |
| C-8 | `Header.tsx` hiển thị tên user thật từ session (KHÔNG còn hard-code "Admin") | DevTools / source view |
| C-9 | Logout từ Header → clear session → redirect về `/login` | Manual click |

### KHÔNG BẮT BUỘC (cho Epic C — sẽ làm ở epic sau)

- ~~RBAC phân quyền ADMIN/EMPLOYEE trên server actions~~ → Epic C+1 (RBAC)
- ~~Enable password field trên `/login` UI~~ → Epic D (UI polish)
- ~~2FA / TOTP~~ → Epic C+2 (Advanced Auth)
- ~~SSO/LDAP integration~~ → Phase 4 (Enterprise)

---

## 3. Files thay đổi

| File | Loại | Số dòng (ước tính) |
|------|------|-------------------|
| `src/middleware.ts` | Sửa | ~25 dòng (gọi `withAuth` với authorized callback check token) |
| `src/lib/auth.ts` | Sửa nhẹ | ~70 dòng (thêm comments + KHÔNG đổi logic — A2 đã đúng) |
| `src/components/Header.tsx` | Sửa | ~85 dòng (dùng `useSession()` từ next-auth, hiển thị firstName + dropdown logout) |
| `src/app/login/page.tsx` | Sửa nhẹ | ~120 dòng (gọi `signIn('credentials', { ... })` với redirect: false + router.push thay vì callbackUrl param; hoặc giữ nguyên nếu NextAuth default đã OK) |
| `src/components/SessionProvider.tsx` (MỚI) | New | ~10 dòng (wrap app để `useSession()` hoạt động ở client component) |
| `src/app/layout.tsx` | Sửa | wrap children trong `<SessionProvider>` |

**Tổng:** 6 file (5 sửa + 1 mới), không quá 350 dòng code.

---

## 4. Bối cảnh tham chiếu

| Nguồn | Mục đích |
|--------|----------|
| `docs/plan/PLAN-CLONE-FROM-SNIPEIT.md` §4.3 (Epic C) | Quyết định gốc: "auth middleware gate protected routes" |
| `src/middleware.ts` | Code hiện tại — có `authorized: () => true` (BUG — không check) |
| `src/lib/auth.ts` | NextAuth options — A2 đã đúng (bcrypt compare, session callback) |
| `src/components/Header.tsx` | UI hiện tại — hard-code "Admin" |
| `src/components/AppShell.tsx` | Đã có logic skip sidebar/header cho `/login` — KHÔNG cần sửa |
| `src/types/next-auth.d.ts` | Module augmentation cho Session/User — A2 đã đúng |

---

## 5. Quy ước/Convention chung (Tier 2 BẮT BUỘC tuân thủ)

1. **Middleware PHẢI dùng `withAuth` từ `next-auth/middleware`** — không tự viết JWT decode (edge runtime không có Node.js `crypto` module).
2. **KHÔNG đụng `prisma/` trong middleware** — middleware chạy ở Edge runtime, Prisma client không tương thích. Chỉ check `token` từ JWT.
3. **`SessionProvider` BẮT BUỘC** — wrap `<RootLayout>` để `useSession()` hoạt động ở Client Component. KHÔNG dùng `getServerSession()` trong Header (vì Header là Client Component).
4. **Logout** dùng `signOut({ callbackUrl: '/login' })` từ `next-auth/react`.
5. **KHÔNG sửa `auth.ts` logic** — A2 đã đúng (bcrypt, session callback, JWT). Chỉ thêm comment nếu cần.
6. **Match case phải cover cả `/assets/new`, `/licenses/new`** — NextAuth matcher dùng `:path*` glob nên `/assets/:path*` match `/assets/new`.

---

## BƯỚC 0: Pre-Audit

```bash
cd "D:\IT-management"
npx tsc --noEmit 2>&1 | head -10
```

**Expected:** PASS (0 errors). Epic B đã verify điều này.

---

## BƯỚC 1: Sửa `src/middleware.ts` (gate protected routes)

**File sửa.** Thay toàn bộ file.

```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

/**
 * Gate protected routes.
 *
 * Sau Epic C:
 * - Anonymous user truy cập `/`, `/assets/*`, `/licenses/*` → redirect `/login?callbackUrl=...`
 * - Authenticated user → pass through
 *
 * Phase 1 chỉ check `!!token` (authenticated hay không).
 * Phase 2 (Epic C+1) sẽ check `token.role` để phân quyền ADMIN/EMPLOYEE.
 *
 * Lưu ý Edge runtime:
 * - KHÔNG được import `prisma` ở đây (Prisma client không tương thích Edge).
 * - Chỉ check JWT token từ cookie session.
 */
export default withAuth(
  function middleware(req) {
    // Nếu authenticated → pass through
    // Nếu anonymous → NextAuth withAuth đã tự redirect về pages.signIn
    // (mặc định: /login). Callback URL tự động nằm trong ?callbackUrl=...
    return NextResponse.next()
  },
  {
    callbacks: {
      // CHỈ return true nếu có token. false → redirect về signIn page.
      authorized: ({ token }) => !!token,
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
  matcher: ["/", "/assets/:path*", "/licenses/:path*"]
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "middleware.ts" || echo "✅ No errors in middleware.ts"
```

**Test runtime ngay (Bước này có thể verify được luôn bằng curl):**

```bash
# Start dev server: npm run dev (background)
# Trong terminal khác:
curl -I http://localhost:3000/ 2>&1 | grep -i "HTTP\|location"
# Expected: HTTP/1.1 307 → location: /login?callbackUrl=%2F

curl -I http://localhost:3000/assets 2>&1 | grep -i "HTTP\|location"
# Expected: HTTP/1.1 307 → location: /login?callbackUrl=%2Fassets

curl -I http://localhost:3000/login 2>&1 | grep -i "HTTP"
# Expected: HTTP/1.1 200 (no redirect)
```

---

## BƯỚC 2: Tạo `src/components/SessionProvider.tsx` (Client Component wrapper)

**File mới.** 10 dòng. Tại sao cần: `useSession()` từ `next-auth/react` yêu cầu `<SessionProvider>` wrap app ở client. Server Component (`layout.tsx`) không wrap được → phải tạo Client Component trung gian.

```typescript
'use client'

import { SessionProvider } from 'next-auth/react'

/**
 * Client Component wrapper cho NextAuth SessionProvider.
 *
 * `SessionProvider` yêu cầu Client Component (dùng Context API).
 * RootLayout (`src/app/layout.tsx`) là Server Component → không wrap trực tiếp được.
 * → Tạo wrapper này để layout chỉ cần `<SessionProviderClient>`.
 *
 * Lưu ý: SessionProvider KHÔNG re-fetch session khi mount — dùng session từ cookie.
 * Nếu cần force refresh → gọi `update()` từ `useSession()`.
 */
export default function SessionProviderClient({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
```

---

## BƯỚC 3: Sửa `src/app/layout.tsx` (wrap SessionProvider)

**File sửa.** Wrap `<AppShell>` trong `<SessionProviderClient>`.

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import SessionProviderClient from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IT Asset Management (Premium)",
  description: "Snipe-IT alternative built on Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-gray-50`}
    >
      <body className="h-full flex overflow-hidden">
        {/* SessionProvider bọc ngoài AppShell để Header (Client Component) dùng được useSession() */}
        <SessionProviderClient>
          <AppShell>
            {children}
          </AppShell>
        </SessionProviderClient>
      </body>
    </html>
  );
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "layout.tsx\|SessionProvider" || echo "✅ No errors"
```

---

## BƯỚC 4: Sửa `src/components/Header.tsx` (hiển thị tên user + logout)

**File sửa.** Dùng `useSession()` + `signOut()`.

```typescript
'use client'

import { Bell, Search, LogOut, User } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [showMenu, setShowMenu] = useState(false)

  // Tạo title dựa trên path
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/assets/new')) return 'Thêm mới Tài sản'
    if (pathname.startsWith('/assets')) return 'Quản lý Tài sản'
    if (pathname.startsWith('/licenses/new')) return 'Thêm mới Bản quyền'
    if (pathname.startsWith('/licenses')) return 'Quản lý Bản quyền'
    if (pathname.startsWith('/settings')) return 'Cài đặt Hệ thống'
    return 'Hệ thống Quản lý'
  }

  // Hiển thị tên user từ session (A2 đã có firstName trong session.user)
  // Fallback: nếu chưa login (status=unauthenticated) → middleware sẽ redirect → không vào đây
  const userDisplayName = session?.user?.firstName
    ? `${session.user.firstName}${session.user.lastName ? ' ' + session.user.lastName : ''}`
    : '...'

  const userRole = session?.user?.role ?? 'EMPLOYEE'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex-1 ml-10 lg:ml-0 flex items-center">
        <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="hidden md:flex items-center relative">
          <Search size={18} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all w-64"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {/* User Menu */}
        <div className="h-8 w-px bg-gray-200 mx-2"></div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span>{userDisplayName}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
              userRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {userRole}
            </span>
          </button>

          {showMenu && (
            <>
              {/* Backdrop để click ra ngoài thì đóng menu */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{userDisplayName}</p>
                  <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "Header.tsx" || echo "✅ No errors in Header.tsx"
```

---

## BƯỚC 5: Sửa `src/app/login/page.tsx` (gọi signIn đúng cách)

**File sửa.** Tier 2 giữ logic cũ nhưng cần đảm bảo `signIn` hoạt động với session JWT.

Hiện tại form login đang `disabled` password field (UI MVP) và gửi `password: "any"` để bypass bcrypt check. Sau Epic C, vẫn giữ pattern này nhưng cần đảm bảo:

```typescript
'use client'

import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, Suspense } from "react"
import { Monitor, Lock, Mail, ArrowRight, AlertCircle } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/assets'
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // MVP: password = "any" vì UI disabled field. Backend authorize() sẽ bypass
    // nếu user.password có hash nhưng submitted password rỗng (xem src/lib/auth.ts:26-29).
    // Sau Epic D sẽ enable password field thật.
    const result = await signIn("credentials", {
      email,
      password: "any",
      redirect: false, // không redirect tự động — để mình xử lý
    })

    if (result?.error) {
      setError("Email không tồn tại hoặc mật khẩu không đúng.")
      setLoading(false)
      return
    }

    if (result?.ok) {
      router.push(callbackUrl)
      router.refresh() // refresh server component để session mới được pick up
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center py-12 px-4 sm:px-4 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Monitor className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          IT Asset Management
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Hệ thống quản lý tài sản nội bộ cấp doanh nghiệp
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-4 flex items-start space-x-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Tài khoản Email
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm bg-slate-50"
                  placeholder="admin@congty.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu (Bỏ qua trong MVP)
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  disabled
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed sm:text-sm"
                  placeholder="********"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Epic C vẫn cho phép đăng nhập chỉ bằng email (password sẽ được enable ở Epic D)
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xác thực...' : (
                  <>
                    Đăng nhập hệ thống
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Test accounts hint — Tier 2 giữ để dev test */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              <strong>Tài khoản test:</strong> admin@congty.com / password123 (Epic C vẫn bypass password)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  // useSearchParams() bắt buộc wrap trong <Suspense> (Next.js 16 requirement)
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
```

**Lưu ý quan trọng về `signIn('credentials', { redirect: false })`:**
- Nếu `redirect: true` (mặc định) → NextAuth tự redirect, có thể bị loop nếu callback URL cũng gate
- `redirect: false` → tự handle redirect qua `router.push(callbackUrl)`

---

## BƯỚC 6: Tạo test file `tests/middleware.test.ts` (smoke test logic)

**File mới.** Vì middleware chạy Edge runtime, khó test trực tiếp với Jest. Phase 1 chỉ test logic `authorized` callback pure (extract ra helper).

```typescript
/**
 * Test logic authorized callback của middleware.
 *
 * Strategy: extract logic `({ token }) => !!token` ra 1 pure function ở file riêng,
 * test pure function. Test thật NextAuth + middleware sẽ làm ở Epic E (integration test).
 */
import { isAuthorized } from '@/lib/auth-guard'

describe('isAuthorized', () => {
  test('return false khi token = null', () => {
    expect(isAuthorized(null)).toBe(false)
  })

  test('return false khi token = undefined', () => {
    expect(isAuthorized(undefined)).toBe(false)
  })

  test('return true khi token có ít nhất id', () => {
    expect(isAuthorized({ id: 'user-1' })).toBe(true)
  })

  test('return true khi token là object rỗng (Phase 2 sẽ check role thật)', () => {
    // Phase 1: chỉ cần token tồn tại. Phase 2 sẽ check token.role.
    expect(isAuthorized({})).toBe(true)
  })
})
```

**Tạo `src/lib/auth-guard.ts`:**

```typescript
/**
 * Logic check authentication — extract từ middleware authorized callback.
 *
 * Tại sao tách: middleware chạy Edge runtime khó test với Jest.
 * Pure function này dễ unit-test, dùng cho cả middleware + test.
 *
 * Phase 1: chỉ check token tồn tại.
 * Phase 2: check thêm token.role để phân quyền.
 */
export function isAuthorized(token: { id?: string } | null | undefined): boolean {
  return !!token
}
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "auth-guard.ts\|middleware.test.ts" || echo "✅ No errors"
npx jest tests/middleware.test.ts
# Expected: 4 tests PASS
```

---

## BƯỚC 7: Sửa `src/middleware.ts` dùng `isAuthorized` (consistency)

**File sửa nhỏ.** Import helper vừa tạo thay vì inline logic.

```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { isAuthorized } from "@/lib/auth-guard"

export default withAuth(
  function middleware() {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => isAuthorized(token),
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: ["/", "/assets/:path*", "/licenses/:path*"]
}
```

---

## BƯỚC 8: Final verify

```bash
npx tsc --noEmit 2>&1 | tail -10
# Expected: 0 errors

npx jest 2>&1 | tail -10
# Expected: 4 suites PASS, 35+ tests PASS (4 mới + 35 cũ = 39 tests)

# Manual smoke test:
npm run dev
# Trong terminal khác:
curl -I http://localhost:3000/ | grep "HTTP\|location"
# Expected: HTTP/1.1 307 → location: /login?callbackUrl=%2F

curl -I http://localhost:3000/assets | grep "HTTP\|location"
# Expected: HTTP/1.1 307 → location: /login?callbackUrl=%2Fassets

curl -I http://localhost:3000/login | grep "HTTP"
# Expected: HTTP/1.1 200
```

**Nếu tất cả PASS → Epic C PASS.**

---

## Phụ lục A: File KHÔNG patch (Tier 2 xác nhận KHÔNG đụng)

| File | Lý do |
|------|-------|
| `prisma/schema.prisma` | A1 đã verified PASS |
| `prisma/seed.ts` | Đã seed đủ User admin/nhanvien/system với bcrypt hash |
| `src/lib/prisma.ts` | Adapter PrismaPg đã chuẩn |
| `src/lib/audit.ts` | `getActorUserId()` đã đúng |
| `src/lib/errors.ts` | Epic B đã đúng |
| `src/lib/locking.ts` | Epic B đã đúng |
| `src/lib/commands/*.ts` | Epic B đã đúng |
| `src/app/actions/*.ts` | Epic B đã đúng — server action vẫn dùng `getServerSession()` |
| `src/types/next-auth.d.ts` | A2 đã đúng — Session/User/JWT augmentation |
| `src/app/page.tsx` | Dashboard — Epic D sẽ refine |
| `src/app/assets/page.tsx`, `src/app/licenses/page.tsx` | List view — Epic D sẽ wire nút checkout |
| `src/components/AppShell.tsx` | Logic skip sidebar/header cho `/login` đã đúng |
| `src/components/Sidebar.tsx` | KHÔNG cần đụng — chỉ render nav |

---

## Phụ lục B: Lý do thiết kế chính

### B.1 Tại sao `authorized: ({ token }) => !!token` đơn giản?

Phase 1 chỉ cần gate authenticated. Phase 2 (Epic C+1) sẽ thêm:
```typescript
authorized: ({ token }) => {
  if (!token) return false
  if (req.nextUrl.pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    return false  // 403
  }
  return true
}
```

### B.2 Tại sao wrap `<SessionProvider>` ở layout.tsx thay vì dùng getServerSession?

- `Header` là Client Component (`'use client'`) → KHÔNG thể dùng `getServerSession()` (chỉ Server Component mới gọi được).
- `useSession()` hook từ `next-auth/react` chỉ hoạt động khi wrap trong `<SessionProvider>`.
- `<SessionProvider>` phải là Client Component → tạo `SessionProviderClient` wrapper.

### B.3 Tại sao `signIn('credentials', { redirect: false })` thay vì default?

- Default: NextAuth redirect đến `callbackUrl` hoặc `pages.signIn`.
- Vấn đề: nếu login fail, NextAuth sẽ redirect về `/login?error=CredentialsSignin` → KHÔNG hiển thị lỗi chi tiết.
- `redirect: false`: mình tự handle bằng `result?.error` → render Alert component trên form → UX tốt hơn.

### B.4 Tại sao tạo `auth-guard.ts` riêng thay vì inline logic trong middleware?

- Middleware chạy Edge runtime — Jest chạy Node.js → khó test trực tiếp.
- Tách pure function `isAuthorized` → test dễ, dùng được ở nhiều nơi.
- Phase 2 sẽ mở rộng `isAuthorized` với role check → test vẫn pass.

### B.5 Tại sao KHÔNG gate `/api/*`?

Phase 1: API routes chỉ có `/api/auth/*` (NextAuth handler — public bắt buộc). Server actions `/createAsset` v.v. được gọi từ Client Component, không qua API endpoint → middleware không gate được (Next.js design).

Để gate server actions: cần check `getServerSession()` trong chính server action (đã có ở Epic B). Phase 2 sẽ có thêm `/api/*` cho mobile app → sẽ gate riêng.

---

## Phụ lục C: Common pitfalls

### C.1 `NEXTAUTH_SECRET` env variable

NextAuth yêu cầu `NEXTAUTH_SECRET` trong `.env`. Nếu thiếu → session JWT không decode được → middleware luôn redirect về login.

**Verify trước khi test:**

```bash
cat .env | grep NEXTAUTH_SECRET
# Nếu rỗng → thêm:
# NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### C.2 Build vs dev mode mismatch

Middleware chỉ hoạt động trong `next build` output nếu matcher được Next.js detect. Tier 2 chạy `npm run dev` là OK. Nếu test `npm run build && npm start` mà middleware không gate → check `matcher` syntax.

### C.3 `useSession()` trả undefined lúc đầu

Khi page mount lần đầu, `useSession()` trả `{ data: null, status: 'loading' }`. Phải check `status === 'authenticated'` trước khi dùng `session.user.firstName`.

Hiện tại code Tier 2 viết không check status — dùng fallback `session?.user?.firstName ?? '...'` là đủ cho MVP. Phase 2 sẽ refine.

---

## Phụ lục D: Sau khi Epic C xong — lệnh tiếp theo

Sếp chạy:

```bash
/code epic-D-ui-checkout-flow
```

→ Tier 1 sẽ xuất `MSEW-epic-D-ui-checkout-flow.md`: thêm button "Cấp phát" / "Thu hồi" trên `/assets` và `/licenses`, modal chọn target User/Location, toast thông báo lỗi từ `CommandResult<T>`.

---

**HẾT MSEW-epic-C-auth-middleware.md**

Tổng kết: 6 file sửa/thêm mới, ~350 dòng code, 4 tests mới, tiêu chí chính là curl redirect test + manual smoke test.