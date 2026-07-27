# MICRO-STEP EXECUTION WORKFLOW (MSEW): EPIC E+1 — NEXTAUTH RUNTIME AUDIT + HARDEN

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-26
**Epic phụ thuộc:** A1 ✅ · A2 ✅ · B ✅ · C ✅ · C+0.5 ✅ · C+1 ✅ · D ✅ · **E ✅ (109 tests PASS, 96.72% coverage)**
**Trigger:** Epic E báo cáo **6 E2E auth flows FAIL** tại `/api/auth/error` — Phase 1 MVP bị blocker runtime dù code PASS unit tests.
**Phạm vi:** Audit + fix NextAuth v4 runtime trên Next.js 16. Restore demo MVP flow. Harden rate-limit wrapper.
**Phạm vi LOẠI TRỪ:** KHÔNG upgrade NextAuth → Auth.js v5 (defer Phase 3); KHÔNG thêm SSO/LDAP (defer Epic H); KHÔNG đổi Prisma adapter

---

## 0. Tại sao Epic E+1 tồn tại — Audit code hiện tại

### Tier 1 đã verify trước khi viết MSEW

| Câu hỏi | Finding |
|---|---|
| E2E tests Phase 1 | 6 tests login/auth **FAIL** tại `/api/auth/error` |
| Coverage | 96.72% — KHÔNG phát hiện blocker runtime |
| Unit test có cover NextAuth flow? | ❌ KHÔNG — chỉ test `requireRole` pure function |
| `rateLimitedHandler` cast signature | `(handler as unknown as (req: Request) => Promise<Response>)(req)` — **unsafe cast** |
| NextAuth version | `^4.24.15` (cuối v4 — có pattern `handlers` mới) |
| Next.js version | `16.2.11` (App Router — route handler signature chuẩn hóa) |
| `src/app/api/auth/[...nextauth]/route.ts` | Pattern cũ: `const handler = NextAuth(authOptions)` → không có `handlers` |
| `src/lib/auth.ts` | Logic OK — `authorize()` đúng, `jwt` + `session` callback đúng |
| `src/proxy.ts` | OK — `withAuth` pattern NextAuth 4.24 |
| `src/types/next-auth.d.ts` | Module augmentation đúng |

### 3 root cause nghi vấn (theo thứ tự khả năng)

| # | Root cause | Triệu chứng | Xác suất |
|---|------------|-------------|----------|
| **RC-1** | NextAuth v4.24+ đổi recommended pattern: dùng `handlers.GET / handlers.POST` thay vì wrap `handler` | Một số route handler internal của NextAuth KHÔNG export đúng cách → `/api/auth/error` | **HIGH** |
| **RC-2** | `rateLimitedHandler` cast unsafe — Next.js 16 runtime check `Request` type, có thể silent fail | Rate-limit bypass HOẶC NextAuth handler không gọi được | **MEDIUM** |
| **RC-3** | Edge runtime conflict — `auth.ts` import `prisma` (Node.js) nhưng Next.js 16 muốn Edge-compatible cho `proxy.ts` chain | Session cookie không đọc được | **LOW** |

### Tech debt Tier 2 nêu

> "Phase 3 cần audit `src/lib/auth.ts` + `src/app/api/auth/[...nextauth]/route.ts`"

→ Epic E+1 advance audit từ Phase 3 về Phase 2 để unblock demo.

---

## 1. MVP Fix Plan — 4 deliverables

| # | Deliverable | Mục đích | Effort |
|---|-------------|----------|--------|
| **E+1-1** | **Diagnostic logging** — log chi tiết tại `/api/auth/[...nextauth]/route.ts` để xác định root cause | Tier 2 log được chính xác LÝ DO `/api/auth/error` | 30 phút |
| **E+1-2** | **Refactor route handler** — dùng pattern `handlers.GET / handlers.POST` (NextAuth v4.24+) + giữ rate-limit wrapper an toàn | Restore auth flow vanilla | 2 giờ |
| **E+1-3** | **Harden rate-limit** — đổi cast unsafe → dùng `NextRequest` typed signature | Rate-limit hoạt động đúng + không vỡ NextAuth | 1 giờ |
| **E+1-4** | **E2E re-verify** — chạy lại 6 E2E auth tests + smoke test login thủ công | Verify fix không regression | 1 giờ |

**Tổng: ~5 giờ = ~1 ngày**

---

## 2. Quyết định của Planner (trả lời 4 câu hỏi Tier 2 có thể hỏi)

| Q | Câu hỏi | Quyết định | Lý do |
|---|---------|------------|-------|
| **Q1** | Có upgrade NextAuth → Auth.js v5 không? | **KHÔNG** | Phase 3 sẽ upgrade. Phase 2.5 chỉ patch tạm. |
| **Q2** | Có viết integration test cho NextAuth flow không? | **CÓ (Phase 3)** | Hiện tại ưu tiên fix runtime, sau đó thêm test. |
| **Q3** | Có tắt rate-limit nếu nó là root cause? | **CÓ (debug only)** | Tạm comment rate-limit để xác định root cause, re-enable sau. |
| **Q4** | Có đổi sang JWT-based session thay vì database session? | **KHÔNG** | Phase 1 đã có JWT session (NextAuth default). KHÔNG đổi. |

---

## 3. Tiêu chí nghiệm thu Epic E+1

### BẮT BUỘC (Acceptance Criteria)

| # | Tiêu chí | Cách verify |
|---|---------|-------------|
| **E+1-1** | `npx tsc --noEmit` PASS (0 errors) | Shell |
| **E+1-2** | `npx jest` PASS (19 suites, 109 tests) — KHÔNG regress | Shell |
| **E+1-3** | `npm run dev` chạy mà KHÔNG có warning/error về NextAuth | Shell |
| **E+1-4** | Manual smoke: Login ADMIN thành công → redirect `/assets` → thấy dashboard | Browser |
| **E+1-5** | Manual smoke: Login EMPLOYEE thành công → redirect `/assets` → KHÔNG thấy nút checkout | Browser |
| **E+1-6** | Manual smoke: Sai password → hiển thị error (KHÔNG crash) | Browser |
| **E+1-7** | Manual smoke: Sai password 6 lần → bị rate-limit (429) | Browser + DevTools Network |
| **E+1-8** | Manual smoke: Anonymous truy cập `/assets` → redirect `/login?callbackUrl=%2Fassets` | Browser |
| **E+1-9** | E2E: 6 auth tests trước đó FAIL giờ PASS | `npx playwright test tests/e2e/` |
| **E+1-10** | Audit log: server console KHÔNG có "auth/error" hoặc "GET /api/auth/callback 500" | Console log |

### KHÔNG BẮT BUỘC (Phase 3)

- ~~Thêm SSO/LDAP~~ → Epic H
- ~~Upgrade Auth.js v5~~ → Epic H
- ~~Database session~~ → Epic G
- ~~Email verification~~ → Epic F (Settings)

---

## 4. Files thay đổi

### 4.1 E+1-1: Diagnostic logging

| File | Loại | Số dòng |
|------|------|---------|
| `src/app/api/auth/[...nextauth]/route.ts` | Sửa (thêm console.log) | +10 dòng |

### 4.2 E+1-2: Refactor route handler

| File | Loại | Số dòng |
|------|------|---------|
| `src/app/api/auth/[...nextauth]/route.ts` | Sửa (refactor pattern) | ~10 dòng thay đổi |

### 4.3 E+1-3: Harden rate-limit

| File | Loại | Số dòng |
|------|------|---------|
| `src/app/api/auth/[...nextauth]/route.ts` | Sửa (typed signature) | ~5 dòng |
| `src/lib/rate-limit.ts` | KHÔNG đổi (đã verify OK Epic D) | — |

### 4.4 E+1-4: E2E re-verify

| File | Loại | Số dòng |
|------|------|---------|
| `tests/e2e/login.spec.ts` | KHÔNG đổi | — |
| (debug only) `src/app/api/auth/[...nextauth]/route.ts` | Tạm comment rate-limit để diagnose | — |

**Tổng:** 1 file sửa, ~25 dòng thay đổi (nhỏ nhất trong tất cả epic).

---

## 5. Bối cảnh tham chiếu

| Nguồn | Mục đích |
|--------|----------|
| `src/lib/auth.ts` (Epic C, D) | Logic OK — chỉ audit, KHÔNG sửa nếu không có bug |
| `src/app/api/auth/[...nextauth]/route.ts` (Epic D) | **File chính cần fix** — pattern cũ + cast unsafe |
| `src/proxy.ts` (Epic C+0.5) | OK — pattern NextAuth v4.24 `withAuth` đúng |
| `src/types/next-auth.d.ts` (Epic C) | OK — module augmentation đúng |
| `src/lib/rate-limit.ts` (Epic D) | OK — pure function |
| `tests/integration/asset.*.test.ts` (Epic E) | KHÔNG đụng — test cho server action, không phải route handler |
| `tests/e2e/login.spec.ts` (Epic E) | Test target — chạy lại để verify fix |
| NextAuth v4.24 release notes | Pattern `handlers` mới: https://next-auth.js.org/configuration/initialization#route-handlers-app |
| Next.js 16 route handler docs | `NextRequest` typed signature |

---

## 6. Quy ước (Tier 2 BẮT BUỘC)

1. **Mọi thay đổi PHẢI test thủ công** bằng browser trước khi move on — KHÔNG tin vào unit test cho NextAuth runtime.
2. **Diagnostic logging PHẢI có thể remove sạch** sau khi xác định root cause — dùng `console.log` rõ ràng, dễ xóa.
3. **KHÔNG đổi auth.ts** — logic đã verified Epic E 109 tests PASS. Chỉ audit, KHÔNG sửa.
4. **KHÔNG đổi proxy.ts** — pattern NextAuth v4.24 `withAuth` đã đúng.
5. **Backup trước khi sửa** — copy file route.ts ra `.bak` để rollback nhanh nếu fix sai.

---

## BƯỚC 0: Pre-Audit & Backup

```bash
cd "D:\IT-management"

# 1. Verify state
npx tsc --noEmit 2>&1 | head -5
# Expected: 0 errors

npx jest --silent 2>&1 | tail -3
# Expected: 19 suites, 109 tests PASS

# 2. Backup file sẽ sửa
cp "src\app\api\auth\[...nextauth]\route.ts" "src\app\api\auth\[...nextauth]\route.ts.bak"

# 3. Xác định root cause sơ bộ
# Đọc console log khi login fail:
npm run dev
# Mở browser → /login → login admin → xem console log Next.js
# Ghi nhận error message + stack trace → Tier 2 report
```

---

## BƯỚC 1: Thêm diagnostic logging (E+1-1)

**File sửa:** `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const handler = NextAuth(authOptions);

/**
 * Wrap NextAuth handler — rate-limit cho POST request (sign-in, callback).
 *
 * Epic D: 5 attempts / 60s / IP — chống brute force cơ bản.
 *
 * Epic E+1: thêm diagnostic logging để xác định root cause 6 E2E FAIL.
 */
async function rateLimitedHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // DIAGNOSTIC LOG — Epic E+1.1: xác định root cause /api/auth/error
  console.log(`[AUTH] ${method} ${path}`);

  // Rate-limit CHỈ áp dụng cho POST. GET (session, csrf, providers) → bypass.
  if (method === "POST") {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const result = checkRateLimit({
      key: `auth:${ip}`,
      max: 5,
      windowMs: 60_000,
    });

    if (!result.allowed) {
      console.warn(`[AUTH] Rate-limited IP=${ip} path=${path}`);
      return new Response(
        JSON.stringify({
          error: "Too many login attempts from this IP. Please try again in a minute.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  try {
    const response = await (handler as unknown as (req: Request) => Promise<Response>)(req);
    console.log(`[AUTH] ${method} ${path} → ${response.status}`);
    return response;
  } catch (err) {
    console.error(`[AUTH] ERROR ${method} ${path}:`, err);
    throw err;
  }
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
```

**Verify:**

```bash
npm run dev
# Mở browser → /login → login admin
# Xem console — phải thấy:
# [AUTH] GET /api/auth/csrf → 200
# [AUTH] POST /api/auth/callback/credentials → 200 (hoặc 302)
# [AUTH] GET /api/auth/session → 200
# HOẶC nếu FAIL: error message rõ ràng
```

---

## BƯỚC 2: Verify root cause

Dựa trên console log:

| Log pattern | Root cause | Fix |
|-------------|------------|-----|
| `[AUTH] GET /api/auth/csrf → 500` | NextAuth handler crash sớm | Refactor pattern `handlers` |
| `[AUTH] POST /api/auth/callback/credentials → 500` với "Cannot read property of undefined" | `authorize()` return null → session callback fail | Audit `auth.ts` (bước 3) |
| `[AUTH] POST /api/auth/callback/credentials → 200` nhưng vẫn redirect `/api/auth/error` | Rate-limit block silent | Tắt rate-limit debug |
| Không thấy log gì | Route handler KHÔNG export đúng | Refactor pattern `handlers` |

---

## BƯỚC 3: Refactor route handler theo pattern mới (E+1-2)

**File sửa:** `src/app/api/auth/[...nextauth]/route.ts`

Nếu root cause là pattern `handler = NextAuth(authOptions)` không tương thích, đổi sang:

```typescript
import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Pattern NextAuth v4.24+ khuyến nghị:
const handlers = NextAuth(authOptions);

/**
 * Wrap NextAuth handlers — rate-limit cho POST + typed NextRequest.
 *
 * Epic E+1: harden signature, dùng NextRequest thay vì Request generic.
 * Giải quyết: cast unsafe ở Epic D, runtime check Next.js 16.
 */
async function wrappedHandler(
  req: NextRequest,
  ctx: { params: Promise<{ nextauth: string[] }> }
): Promise<NextResponse> {
  const method = req.method;
  const path = req.nextUrl.pathname;

  // Rate-limit CHỈ áp dụng cho POST.
  if (method === "POST") {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const result = checkRateLimit({
      key: `auth:${ip}`,
      max: 5,
      windowMs: 60_000,
    });

    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts from this IP. Please try again in a minute." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }
  }

  // Forward đến NextAuth handler — pattern mới: handlers.GET / handlers.POST
  if (method === "GET") {
    return handlers.GET(req, ctx);
  }
  if (method === "POST") {
    return handlers.POST(req, ctx);
  }

  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export { wrappedHandler as GET, wrappedHandler as POST };
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | grep "route.ts" || echo "✅ No errors"
# Expected: ✅ No errors

npm run dev
# Mở browser → /login → login admin
# Verify:
# - Console log: [AUTH] GET /api/auth/csrf → 200
# - Console log: [AUTH] POST /api/auth/callback/credentials → 200/302
# - Redirect về /assets hoặc / (callbackUrl)
# - Dashboard hiển thị với role badge
```

---

## BƯỚC 4: Audit `src/lib/auth.ts` nếu vẫn fail (RC-2)

**File audit (KHÔNG sửa trừ khi có bug rõ):** `src/lib/auth.ts`

Nếu Bước 3 vẫn fail với lỗi từ `authorize()` hoặc `session()` callback, audit logic:

```typescript
// Check 1: authorize() return shape
async authorize(credentials) {
  // ... existing logic ...
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName ?? null,
    email: user.email ?? null,
    role: user.role,
  };
}

// Check 2: jwt callback nhận đúng fields
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.firstName = user.firstName ?? "";
    token.lastName = user.lastName ?? null;
    token.role = user.role ?? "EMPLOYEE";
  }
  return token;
}

// Check 3: session callback đọc đúng từ token
async session({ session, token }) {
  if (session.user) {
    session.user.id = token.id as string;
    session.user.firstName = token.firstName as string;
    session.user.lastName = (token.lastName as string | null) ?? null;
    session.user.role = token.role as "ADMIN" | "EMPLOYEE";
  }
  return session;
}
```

→ Nếu 3 check pass → `auth.ts` KHÔNG có bug → KHÔNG sửa.

---

## BƯỚC 5: Tắt rate-limit debug (nếu cần)

**File sửa (debug only):** `src/app/api/auth/[...nextauth]/route.ts`

Nếu sau Bước 3 vẫn fail và nghi rate-limit là root cause, comment rate-limit block:

```typescript
async function wrappedHandler(req: NextRequest, ctx: ...): Promise<NextResponse> {
  // DEBUG: tạm tắt rate-limit để xác định root cause
  // if (method === "POST") { ... rate-limit block ... }

  // Forward thẳng đến NextAuth
  if (method === "GET") return handlers.GET(req, ctx);
  if (method === "POST") return handlers.POST(req, ctx);
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
```

**Verify:**

```bash
npm run dev
# Test login flow
# Nếu PASS → rate-limit là root cause → harden signature
# Nếu vẫn FAIL → root cause khác → revert + debug tiếp
```

---

## BƯỚC 6: Re-enable rate-limit với typed signature (E+1-3)

Sau khi xác định rate-limit wrapper gây vấn đề, harden signature:

```typescript
async function wrappedHandler(req: NextRequest, ctx: ...): Promise<NextResponse> {
  if (req.method === "POST") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    const result = checkRateLimit({
      key: `auth:${ip}`,
      max: 5,
      windowMs: 60_000,
    });

    if (!result.allowed) {
      // Trả response trực tiếp KHÔNG qua NextAuth handler
      return NextResponse.json(
        { error: "Too many login attempts from this IP. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
      );
    }
  }

  // Forward đến NextAuth — KHÔNG cast unsafe
  if (req.method === "GET") return handlers.GET(req, ctx);
  if (req.method === "POST") return handlers.POST(req, ctx);
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
```

**Verify:**

```bash
npm run dev
# Test 6 lần login sai → lần thứ 6 phải bị 429
# Verify rate-limit vẫn hoạt động
```

---

## BƯỚC 7: Remove diagnostic logging (cleanup)

Sau khi fix xong và verify, remove tất cả `console.log`:

```typescript
// Xóa tất cả:
// console.log(`[AUTH] ...`);
// console.warn(`[AUTH] ...`);
// console.error(`[AUTH] ...`);
// try/catch debug wrapper
```

**Verify:**

```bash
npx tsc --noEmit 2>&1 | head -5
# Expected: 0 errors

# Verify file KHÔNG còn diagnostic logs:
grep -n "console\.\(log\|warn\|error\)" "src\app\api\auth\[...nextauth]\route.ts"
# Expected: 0 matches
```

---

## BƯỚC 8: Final verify (E+1-4)

```bash
cd "D:\IT-management"

# 1. tsc clean
npx tsc --noEmit 2>&1 | tail -5
# Expected: 0 errors

# 2. Jest all — KHÔNG regress
npx jest --silent 2>&1 | tail -5
# Expected: 19 suites, 109 tests PASS

# 3. Dev server chạy mà KHÔNG có error
npm run dev &
sleep 8

# 4. Manual smoke test (8 acceptance criteria E+1-3 → E+1-10)
# - Login ADMIN → /assets
# - Login EMPLOYEE → /assets (không nút checkout)
# - Sai password → error
# - Sai password 6 lần → 429
# - Anonymous /assets → /login?callbackUrl=...
# - E2E: 6 auth tests PASS

# 5. Build
npm run build 2>&1 | tail -5
# Expected: ✓ Compiled successfully
```

---

## Phụ lục A: File KHÔNG patch

| File | Lý do |
|------|-------|
| `prisma/schema.prisma` | A1 đã đúng |
| `prisma/seed.ts` | Đã seed |
| `src/lib/prisma.ts` | OK |
| `src/lib/commands/*.ts` | Epic B đã verify |
| `src/lib/auth-guard.ts` | Epic C+1 đã verify (109 tests) |
| `src/lib/rate-limit.ts` | Epic D đã verify |
| `src/lib/audit.ts` | Epic B đã verify |
| `src/lib/locking.ts` | Epic B đã verify |
| `src/lib/errors.ts` | Epic B đã verify |
| `src/lib/auth.ts` | **Audit-only, KHÔNG sửa trừ khi có bug rõ** |
| `src/proxy.ts` | Epic C+0.5 đã verify |
| `src/types/next-auth.d.ts` | Epic C đã verify |
| `src/app/login/page.tsx` | Epic D đã verify |
| `src/components/SessionProvider.tsx` | OK |
| `src/components/Header.tsx` | Epic C đã verify |
| `tests/**` | KHÔNG đụng — chỉ chạy lại để verify |

---

## Phụ lục B: Lý do thiết kế chính

### B.1 Tại sao KHÔNG upgrade NextAuth → Auth.js v5?

| NextAuth v4 | Auth.js v5 |
|---|---|
| Đang chạy, chỉ fix nhỏ | Migration ~1 tuần effort |
| Pattern `handlers` v4.24+ đủ tốt | Edge runtime tốt hơn |
| Community docs nhiều | Docs mới, ít tutorial |
| Phase 1 ổn định | Risk: regression toàn bộ |

→ Phase 3 (Epic H SSO) sẽ upgrade cùng lúc với việc thêm SSO.

### B.2 Tại sao KHÔNG thêm integration test cho NextAuth?

NextAuth v4 rất khó test vì:
- Dùng `next-auth/react` hook phụ thuộc React context
- Dùng JWT cookie + Edge runtime
- Test chỉ verify "login được hay không" — đã có E2E (Playwright) làm việc này

→ Phase 3 sẽ thêm nếu cần.

### B.3 Tại sao dùng NextRequest thay vì Request generic?

Next.js 16 typed route handler:
- `NextRequest` có `nextUrl`, `cookies`, `geo`, `ip` — typed đầy đủ
- `Request` (Web standard) chỉ có `headers`, `method`, `url` — thiếu Next.js-specific
- Cast `handler as unknown as (req: Request)` ở Epic D là **unsafe** — Next.js 16 có thể từ chối runtime

→ Dùng `NextRequest` để type-safe + tận dụng Next.js API.

---

## Phụ lục C: Common pitfalls

### C.1 Fix xong nhưng E2E vẫn fail

Triệu chứng: Manual login OK, E2E fail tương tự.

**Fix:**
- E2E test dùng `request.post(...)` — có thể cookie không share đúng giữa page + request context
- Verify `playwright.config.ts` `baseURL` đúng
- Hard refresh dev server (Ctrl+Shift+R)

### C.2 Rate-limit bypass sau khi fix

Triệu chứng: Login sai 100 lần không bị 429.

**Fix:**
- Verify `wrappedHandler` thật sự chạy rate-limit trước khi forward
- Verify `ip` lấy đúng (x-forwarded-for có thể bị CDN strip)

### C.3 Diagnostic logging leak vào production

Triệu chứng: Console log vẫn còn sau khi deploy.

**Fix:**
- Bước 7 PHẢI xóa tất cả `console.log/warn/error` trước khi merge
- Hoặc gate logging theo `process.env.NODE_ENV !== 'production'`

### C.4 `handlers.GET/POST` không tồn tại

Triệu chứng: `TypeError: handlers.GET is not a function`.

**Fix:**
- Verify NextAuth version ≥ 4.24 (đã verify Phase 1)
- Pattern `const handlers = NextAuth(authOptions)` mới chỉ work từ 4.24+
- Nếu < 4.24, downgrade pattern về `const handler = NextAuth(authOptions)`

---

## Phụ lục D: Effort estimate

| Step | Effort |
|---|---|
| Bước 0: Pre-Audit & Backup | 15 phút |
| Bước 1: Diagnostic logging | 30 phút |
| Bước 2: Verify root cause | 30 phút |
| Bước 3: Refactor route handler | 1 giờ |
| Bước 4: Audit auth.ts (nếu cần) | 30 phút |
| Bước 5: Tắt rate-limit debug (nếu cần) | 15 phút |
| Bước 6: Re-enable rate-limit | 1 giờ |
| Bước 7: Remove diagnostic logging | 15 phút |
| Bước 8: Final verify | 30 phút |
| **Tổng** | **~5 giờ = ~1 ngày** |

---

## Phụ lục E: Decision tree nếu vẫn fail

```
[Bước 3 xong — vẫn fail]
  │
  ├─ Console có "TypeError: handlers.GET is not a function"?
  │   → NextAuth < 4.24. Downgrade pattern về handler = NextAuth(...)
  │
  ├─ Console có "Cannot read property 'role' of undefined"?
  │   → Session callback fail. Audit src/lib/auth.ts (Bước 4).
  │
  ├─ Console có "PRISMA_CLIENT_INITIALIZATION_ERROR"?
  │   → Edge runtime conflict. Proxy.ts có import prisma — audit.
  │
  └─ Console KHÔNG có log gì?
      → Route handler KHÔNG được gọi. Check file name [...nextauth]/route.ts.
```

---

## Phụ lục F: Sau Epic E+1 xong

| Trạng thái | Hành động tiếp |
|------------|----------------|
| ✅ PASS | Demo MVP cho stakeholder + thu feedback → Epic F |
| ⚠️ PASS nhưng có minor issue | Note vào tech debt, đi Epic F |
| ❌ FAIL sau 5 giờ | Escalate Tier 1 — có thể cần downgrade Next.js hoặc upgrade NextAuth |

---

**HẾT MSEW-epic-E+1-nextauth-audit.md**

Tổng kết: 8 bước, 1 file sửa, ~25 dòng thay đổi, effort ~5 giờ (~1 ngày). MVP demo-ready sau epic này.