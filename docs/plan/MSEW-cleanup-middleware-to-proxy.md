# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC C+0.5 — MIDDLEWARE FILE RENAME (NEXT.JS 16 ALIAS)

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-26
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · B ✅ · **C ✅**
**Phạm vi:** Đổi tên `src/middleware.ts` → `src/proxy.ts` (Next.js 16 alias) + reconcile
**Phạm vi LOẠI TRỪ:** KHÔNG upgrade NextAuth v4 → v5 (sẽ là epic riêng); KHÔNG đổi logic auth; KHÔNG đụng file khác (verified chỉ 1 file thực sự cần đổi)

---

## 0. Tại sao Epic C+0.5 tồn tại — Audit code hiện tại

### Tier 1 đã kiểm chứng trước khi viết MSEW

| Câu hỏi | Finding |
|---|---|
| NextAuth version trong `package.json` | `"next-auth": "^4.24.15"` → **đang ở NextAuth v4**, KHÔNG phải v5 |
| Next.js version | `"next": "16.2.11"` |
| File `src/middleware.ts` có tồn tại? | ✅ Có |
| File `src/proxy.ts` có tồn tại? | ❌ Chưa có |
| File bị ảnh hưởng bởi rename? | **Chỉ 1 file thực sự** (`src/middleware.ts`) |
| Test `tests/middleware.test.ts` import gì? | Chỉ import `isAuthorized` từ `@/lib/auth-guard` — KHÔNG import `middleware.ts` |
| `src/components/Header.tsx` reference gì? | Chỉ 1 comment `// middleware sẽ redirect` — chỉ cần update comment |
| `src/app/layout.tsx` có import middleware? | ❌ Không |

### Lưu ý quan trọng: Tier 2 verdict nói "NextAuth 5 đổi tên thành proxy.ts" — điều này KHÔNG chính xác

**Sự thật:**
- **NextAuth v5** vẫn dùng `middleware.ts` (chỉ đổi API call từ `withAuth` → `auth`).
- **Next.js 16** giới thiệu `proxy.ts` như **alias tùy chọn** cho `middleware.ts` (cùng runtime, cùng API).
- Rename `middleware.ts` → `proxy.ts` chỉ là **naming convention** — KHÔNG thay đổi behavior.

### 3 lợi ích của rename

| # | Lợi ích | Giải thích |
|---|---------|-----------|
| 1 | **Rõ nghĩa hơn** | "Middleware" trong Next.js phổ biến nhưng mơ hồ. "Proxy" rõ hơn: route → check → forward/redirect. |
| 2 | **Khớp Next.js 16 docs** | Next.js 16 docs chính thức recommend `proxy.ts`. |
| 3 | **Tránh conflict với tên gốc** | Một số package convention dùng "middleware" cho Express/Koa → tránh nhầm lẫn. |

---

## 1. Quyết định của Planner

| Q | Câu hỏi | Quyết định | Lý do |
|---|---------|------------|-------|
| **Q1** | Rename `middleware.ts` → `proxy.ts` hay giữ nguyên? | **RENAME** | Sếp đã chọn "cleanup-first" — rename này tốn 5 phút, tránh tech debt. |
| **Q2** | Có cần upgrade NextAuth v4 → v5 luôn không? | **KHÔNG** | V5 upgrade là epic riêng (breaking changes lớn). Phase 1 MVP v4 ổn. |
| **Q3** | Có cần xóa file `.backup-before-c`? | **XÓA** | Sau khi verify rename OK, file backup cũ EPIC C không cần nữa. Tier 2 có snapshot trong CHANGELOG. |
| **Q4** | Có cần apply `withAuth` config khác khi rename? | **KHÔNG** | Next.js 16 proxy.ts nhận cùng signature. |

---

## 2. Tiêu chí nghiệm thu Epic C+0.5

### BẮT BUỘC

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| R-1 | `src/middleware.ts` đã không còn tồn tại | `Test-Path src/middleware.ts` → `False` |
| R-2 | `src/proxy.ts` tồn tại với nội dung tương đương `middleware.ts` (Epic C) | `Test-Path src/proxy.ts` → `True`; `cat src/proxy.ts` |
| R-3 | `npx tsc --noEmit` **PASS** (0 errors) | Shell |
| R-4 | `npx jest` **PASS** (4 suites, 35+ tests) | Shell |
| R-5 | Truy cập `/` khi anonymous → redirect 307 `/login?callbackUrl=%2F` (giống Epic C) | curl |
| R-6 | Truy cập `/assets` khi anonymous → redirect 307 `/login?callbackUrl=%2Fassets` | curl |
| R-7 | Sau khi login, session hoạt động bình thường (cookie vẫn decode) | Manual |
| R-8 | File `.backup-before-c` đã xóa | `Test-Path src/middleware.ts.backup-before-c` → `False` |

### KHÔNG BẮT BUỘC

- ~~Upgrade NextAuth v4 → v5~~ → Epic riêng
- ~~Đổi API `withAuth` → `auth` của NextAuth v5~~ → Epic riêng
- ~~Đổi logic auth~~ → Epic đã đúng

---

## 3. Files thay đổi

| File | Loại | Ghi chú |
|------|------|---------|
| `src/middleware.ts` | Xóa | Sau khi tạo `proxy.ts` |
| `src/proxy.ts` | Tạo mới | Nội dung y hệt `middleware.ts` Epic C + comment update |
| `src/components/Header.tsx` | Sửa comment | Dòng 25: "middleware sẽ redirect" → "proxy sẽ redirect" |
| `src/middleware.ts.backup-before-c` | Xóa | Cleanup |

**Tổng:** 4 file (1 tạo mới + 1 xóa + 1 sửa comment + 1 xóa backup). **Không có** file test thay đổi (vì `tests/middleware.test.ts` chỉ test `isAuthorized` pure function, không import `middleware.ts`).

---

## 4. Bối cảnh tham chiếu

| Nguồn | Mục đích |
|--------|----------|
| [Next.js 16 docs — `proxy.ts` alias](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) | Source of truth — Next.js 16 giới thiệu `proxy.ts` |
| `src/middleware.ts` (Epic C) | File hiện tại — 22 dòng, dùng `withAuth` |
| `package.json` | `"next": "16.2.11"` — đủ version |
| `src/components/Header.tsx` dòng 25 | Chỉ 1 comment reference "middleware" |
| `tests/middleware.test.ts` | Test `isAuthorized` pure — KHÔNG đụng |

---

## 5. Quy ước (Tier 2 tuân thủ)

1. **Không đổi logic auth** — chỉ rename file + 1 comment.
2. **Dùng `git mv` (nếu có git) hoặc copy + delete** — KHÔNG dùng `Rename-Item` PowerShell vì có thể corrupt encoding.
3. **Verify ngay sau từng bước** — đỡ phải debug nhiều file cùng lúc.

---

## BƯỚC 0: Pre-Audit

```bash
cd "D:\IT-management"

# Verify state trước khi rename
Test-Path src/middleware.ts
# Expected: True

Test-Path src/proxy.ts
# Expected: False

Test-Path src/middleware.ts.backup-before-c
# Expected: True (file backup Epic C)

# Verify tests + tsc vẫn pass trước khi rename
npx tsc --noEmit 2>&1 | head -10
# Expected: 0 errors

npx jest --silent 2>&1 | tail -5
# Expected: 35+ tests PASS
```

---

## BƯỚC 1: Đọc `src/middleware.ts` để copy nội dung

```bash
Read src/middleware.ts
```

**Expected output (Epic C):**

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

## BƯỚC 2: Tạo `src/proxy.ts` (nội dung y hệt + comment update)

**File mới.** 25 dòng.

```typescript
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { isAuthorized } from "@/lib/auth-guard"

/**
 * Proxy (Next.js 16 alias cho "middleware") — gate protected routes.
 *
 * Epic C+0.5: rename `src/middleware.ts` → `src/proxy.ts` để khớp
 * Next.js 16 docs convention. Next.js 16 hỗ trợ CẢ HAI tên file:
 *  - `proxy.ts` (khuyến nghị mới, semantic hơn)
 *  - `middleware.ts` (legacy, vẫn hoạt động)
 *
 * Tại sao đổi:
 *  - "proxy" rõ nghĩa hơn "middleware" (route → check → forward/redirect)
 *  - Khớp Next.js 16 docs chính thức
 *  - Tránh conflict naming với middleware pattern của Express/Koa
 *
 * Sau Epic C+0.5:
 *  - Anonymous user truy cập `/`, `/assets/*`, `/licenses/*` → redirect `/login?callbackUrl=...`
 *  - Authenticated user → pass through
 *
 * Phase 1 chỉ check `!!token` (logic ở `src/lib/auth-guard.ts`).
 * Phase 2 (Epic C+1) sẽ check `token.role` để phân quyền ADMIN/EMPLOYEE.
 *
 * Lưu ý Edge runtime:
 *  - KHÔNG được import `prisma` ở đây (Prisma client không tương thích Edge).
 *  - Chỉ check JWT token từ cookie session.
 */
export default withAuth(
  function proxy() {
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
Test-Path src/proxy.ts
# Expected: True

npx tsc --noEmit 2>&1 | grep "proxy.ts" || echo "✅ No errors in proxy.ts"
```

---

## BƯỚC 3: Xóa `src/middleware.ts`

```bash
Remove-Item src/middleware.ts
```

**Verify:**

```bash
Test-Path src/middleware.ts
# Expected: False
```

---

## BƯỚC 4: Sửa comment `src/components/Header.tsx` dòng 25

**File sửa 1 dòng.**

```typescript
// Cũ (dòng 25):
// Fallback: nếu chưa login (status=unauthenticated) → middleware sẽ redirect → không vào đây

// Mới:
// Fallback: nếu chưa login (status=unauthenticated) → proxy sẽ redirect → không vào đây
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "Header.tsx" || echo "✅ No errors in Header.tsx"
```

---

## BƯỚC 5: Xóa file backup cũ

```bash
Remove-Item src/middleware.ts.backup-before-c
```

**Verify:**

```bash
Test-Path src/middleware.ts.backup-before-c
# Expected: False
```

---

## BƯỚC 6: Verify toàn diện

```bash
cd "D:\IT-management"

# 1. tsc clean
npx tsc --noEmit 2>&1 | tail -10
# Expected: 0 errors

# 2. Jest vẫn pass
npx jest --silent 2>&1 | tail -10
# Expected: 4 suites PASS, 35+ tests PASS

# 3. Curl smoke test (cần dev server chạy)
npm run dev &
sleep 10  # đợi Next.js compile lần đầu

# 4. Anonymous → redirect
curl -I http://localhost:3000/ 2>&1 | grep -i "HTTP\|location"
# Expected: HTTP/1.1 307 → location: /login?callbackUrl=%2F

curl -I http://localhost:3000/assets 2>&1 | grep -i "HTTP\|location"
# Expected: HTTP/1.1 307 → location: /login?callbackUrl=%2Fassets

curl -I http://localhost:3000/login 2>&1 | grep -i "HTTP"
# Expected: HTTP/1.1 200 (no redirect)

# 5. Cleanup dev server
# Ctrl+C hoặc kill process
```

**Nếu tất cả PASS → Epic C+0.5 PASS.**

---

## Phụ lục A: File KHÔNG patch

| File | Lý do |
|------|-------|
| `src/lib/auth-guard.ts` | Tier 2 đã bonus — pure function, KHÔNG phụ thuộc tên file |
| `src/lib/auth.ts` | Auth options — A2 đã đúng, không đụng |
| `src/components/SessionProvider.tsx` | KHÔNG phụ thuộc middleware |
| `src/app/layout.tsx` | KHÔNG import middleware |
| `src/app/login/page.tsx` | KHÔNG import middleware |
| `tests/middleware.test.ts` | Chỉ test `isAuthorized` pure — KHÔNG đụng |
| `tests/commands.asset.test.ts` | KHÔNG đụng |
| `tests/commands.license.test.ts` | KHÔNG đụng |
| `tests/locking.test.ts` | KHÔNG đụng |
| `tests/errors.test.ts` | KHÔNG đụng |
| `prisma/` | KHÔNG đụng |
| `package.json` | KHÔNG đụng |

---

## Phụ lục B: Tại sao KHÔNG upgrade NextAuth v4 → v5 trong epic này

| Nếu upgrade v5 luôn | Hậu quả |
|---|---|
| API `withAuth` bị xóa → phải đổi sang `auth()` | Touches 4+ file |
| JWT signature có thể thay đổi → user phải login lại | UX break |
| `getServerSession()` cũ → `auth()` mới | Touches 6+ file (Epic B + Epic C) |
| Type augmentation `next-auth.d.ts` cần viết lại | Touches 1 file |
| Test mock `getServerSession` cần update | Touches 4+ file test |
| **Tổng breakdown** | **~15 file, ~2-3 giờ làm** |

→ **Quyết định: KHÔNG upgrade v5 trong Epic C+0.5.** Phase 2 sẽ có epic riêng "NextAuth v5 migration" với risk assessment kỹ hơn.

---

## Phụ lục C: Common pitfalls

### C.1 Nếu curl test FAIL sau rename

Triệu chứng: vẫn truy cập được `/` mà không redirect → proxy.ts chưa được Next.js detect.

**Fix:**
1. Đợi Next.js compile xong (~5-10s sau khi start dev server)
2. Verify `src/proxy.ts` KHÔNG có syntax error
3. Verify `matcher` syntax đúng (Next.js detect glob pattern)
4. Restart dev server: `Ctrl+C` rồi `npm run dev` lại

### C.2 Nếu tsc fail với "module not found: middleware"

**Fix:** Có thể Next.js giữ cache hard link tới `middleware.ts`. Xóa `.next` folder:

```bash
Remove-Item -Recurse -Force .next
npm run dev
```

### C.3 Nếu Tier 2 muốn dùng `git mv` thay vì copy + delete

Nếu repo có git (đã có trong `.git`):

```bash
git mv src/middleware.ts src/proxy.ts
# Sau đó edit src/proxy.ts để đổi comment
```

Nhưng sếp báo cáo Tier 2 chỉ dùng `WITH SAVE` (không commit) → copy + delete OK.

---

## Phụ lục D: Sau khi Epic C+0.5 xong — lệnh tiếp theo

Sếp chạy 1 trong 2:

```bash
# Option A: Làm Epic D UI (nếu sếp muốn polish UI)
/code epic-D-ui-checkout-flow

# Option B: Làm Epic C+1 RBAC (nếu sếp muốn phân quyền ADMIN/EMPLOYEE trước)
/code epic-C+1-rbac
```

Tôi sẽ xuất MSEW tương ứng sau khi sếp chọn.

---

## Phụ lục E: Effort estimate

| Step | Effort |
|---|---|
| Bước 0: Pre-Audit | 1 phút |
| Bước 1: Đọc middleware.ts | 30 giây |
| Bước 2: Tạo proxy.ts | 2 phút |
| Bước 3: Xóa middleware.ts | 10 giây |
| Bước 4: Sửa comment Header.tsx | 30 giây |
| Bước 5: Xóa backup | 10 giây |
| Bước 6: Verify | 3 phút |
| **Tổng** | **~7 phút** |

→ Epic nhỏ, ít rủi ro. Tier 2 có thể cày trong 1 shot.

---

**HẾT MSEW-cleanup-middleware-to-proxy.md**

Tổng kết: 4 file thay đổi (1 tạo + 1 xóa + 1 sửa comment + 1 xóa backup), estimated 7 phút, tiêu chí chính là curl redirect test + tsc clean.