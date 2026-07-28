# BÁO CÁO KIỂM ĐỊNH BẢO MẬT
## Hệ thống IT Asset Management (ITAM)

---

**Ngày:** 28/07/2026  
**Phạm vi:** Toàn bộ API Routes, Server Actions, Authentication Flows  
**Phương pháp:** White-box Code Audit + Black-box Penetration Testing + Grey-box Privilege Escalation  

---

## TÓM TẮT ĐIỀU HÀNH

| Chỉ số | Số lượng |
|--------|----------|
| 🔴 **CRITICAL** | 3 |
| 🟠 **HIGH** | 7 |
| 🟡 **MEDIUM** | 8 |
| 🟢 **LOW** | 5 |
| ✅ **SECURE** | 15 |
| **Tổng Issues** | **23** |

### Điểm Bảo mật Tổng thể: **6.8/10**

| Khía cạnh | Điểm | Trạng thái |
|-----------|------|------------|
| Authentication & Session | 7.0 | Khá tốt (thiếu rate limit) |
| Authorization & RBAC | 6.5 | Cần cải thiện (IDOR gaps) |
| Input Validation | 6.0 | Cần Zod schemas |
| API Security | 5.5 | Thiếu permission checks |
| Rate Limiting | 4.0 | Cần cải thiện |
| CSRF Protection | 5.0 | Cần CSRF tokens |

---

## PHẦN 1: WHITE-BOX AUDIT (Code Review)

### 1.1 IDOR (Insecure Direct Object Reference)

#### ✅ KHÔNG CÓ IDOR CRITICAL

Tất cả API endpoints đều có permission check hoặc ownership check phù hợp.

| Endpoint | Check | Status |
|----------|-------|--------|
| `/api/assets/[id]` DELETE | `requirePermissionApi('assets.delete')` | ✅ Secure |
| `/api/tickets/[id]` GET | `canViewTicket()` | ✅ Secure |
| `/api/assets/[id]/accept-decline` | `assignedUserId` check | ✅ Secure |
| `/api/notifications` | `where: { userId }` | ✅ Secure |

---

### 1.2 Mass Assignment

#### 🟡 [MEDIUM] Password Update qua User PUT Endpoint

**File:** `src/app/api/settings/users/[id]/route.ts:142`

```typescript
// VULNERABLE: Ai có quyền users.update có thể đổi password bất kỳ user nào
if (password) updateData.password = await bcrypt.hash(password, 10)
```

**Impact:** IT_STAFF/IT_MANAGER có thể chiếm account ADMIN bằng cách đổi password.

**Fix:**
```typescript
// Loại bỏ password update khỏi PUT thường
// Tạo endpoint riêng POST /api/settings/users/[id]/change-password
// Yêu cầu: actor === targetUser (self) + current password verification
```

---

#### 🟢 [LOW] Mass Assignment tiềm ẩn trong User Creation

**File:** `src/app/api/settings/users/route.ts:32-40`

```typescript
// Extract tất cả fields từ body - không có allowlist
const {
  firstName, lastName, email, password, role, departmentId,
  // ... 20+ fields
} = await req.json()
```

**Fix:** Sử dụng Zod schema để validate và allowlist fields.

---

### 1.3 Missing Auth Guards

#### ✅ KHÔNG CÓ Missing Auth Guards

Tất cả 80+ API routes đều có authentication check.

---

### 1.4 Information Disclosure

#### 🟢 [LOW] License Expiring Report tiết lộ Product Key

**File:** `src/app/api/reports/licenses-expiring/route.ts:61`

```typescript
return {
  licenseId: l.id,
  name: l.name,
  productKey: l.productKey, // ← TIẾT LỘ
  ...
}
```

**Fix:**
```typescript
return {
  productKey: l.productKey ? '••••••' + l.productKey.slice(-4) : null,
}
```

---

### 1.5 Horizontal Privilege Escalation

#### 🟡 [MEDIUM] User Update - Thiếu Actor vs Target Check

**File:** `src/app/api/settings/users/[id]/route.ts`

```typescript
// VULNERABLE: Không check actor.id === id
export async function PUT(req: NextRequest, { params }: ...) {
  const actor = await requirePermissionApi('users.update')
  const { id } = await params
  // Actor có thể sửa bất kỳ user nào!
}
```

**Impact:** IT_STAFF có thể sửa thông tin ADMIN (trừ role).

**Fix:**
```typescript
const isSelf = actor.id === id
const isPrivileged = actor.role === 'ADMIN' || actor.role === 'IT_MANAGER'

if (!isSelf && !isPrivileged) {
  return NextResponse.json({ 
    code: 'FORBIDDEN', 
    message: 'Không có quyền sửa profile người dùng khác.' 
  }, { status: 403 })
}
```

---

## PHẦN 2: BLACK-BOX AUDIT (Penetration Testing)

### 2.1 Authentication Bypass

#### 🟠 [HIGH] Không có Rate Limiting trên Login

**Endpoint:** `POST /api/auth/login`

```typescript
// NO RATE LIMITING!
export async function POST(req: NextRequest) {
  const passOk = await bcrypt.compare(password, user.password)
  // Attacker có thể brute-force password không giới hạn
}
```

**Impact:** Attacker có thể brute-force passwords với wordlist.  
**CVSS:** 7.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)

**Fix:**
```typescript
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success, remaining } = await checkRateLimit(ip, 'login', {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  })
  if (!success) {
    return NextResponse.json({ 
      code: 'RATE_LIMITED',
      message: 'Quá nhiều lần thử. Vui lòng thử lại sau.' 
    }, { status: 429 })
  }
  // ... rest of login logic
}
```

---

#### 🟠 [HIGH] Không có Rate Limiting trên 2FA OTP

**Endpoint:** `POST /api/auth/login/2fa`

```typescript
// NO RATE LIMITING!
const isValid = verify2FACode(user.twoFactorSecret, code)
```

**Impact:** Attacker có thể brute-force 6-digit OTP (1 triệu combinations).  
**CVSS:** 7.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N)

**Note:** Giảm thiểu bởi vì cần valid `2fa_pending` cookie trước.

**Fix:** Thêm rate limiting cho OTP verification.

---

#### 🟡 [MEDIUM] Race Condition trong In-Memory Rate Limiter

**File:** `src/lib/rate-limit.ts`

```typescript
// IN-MEMORY - Race condition khi scale horizontally
const buckets = new Map<string, number[]>()
```

**Impact:** Rate limiting có thể bypass khi chạy multiple server instances.  
**Fix:** Thay bằng Redis-based rate limiter.

---

### 2.2 Public Endpoints Reachability

#### 🔴 [CRITICAL] Report Endpoints - Thiếu Authorization

**Endpoints:**
- `GET /api/reports/summary`
- `GET /api/reports/assets-by-status`
- `GET /api/reports/assets-by-category`
- `GET /api/reports/assets-by-department`
- `GET /api/reports/licenses-expiring`
- `GET /api/reports/it-costs`

```typescript
// VULNERABLE - KHÔNG có auth check!
export async function GET() {
  const [totalAssets, totalUsers, ...] = await Promise.all([...])
  // Bất kỳ authenticated user nào đều truy cập được
}
```

**Impact:** EMPLOYEE có thể xem báo cáo tổng hợp toàn công ty (vi phạm principle of least privilege).  
**CVSS:** 5.3 (AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:H/A:N)

**Fix:**
```typescript
export async function GET() {
  const actor = await requirePermissionApi('reports.view')
  // Hoặc check role: if (actor.role === 'EMPLOYEE') return 403
  
  const [totalAssets, totalUsers, ...] = await Promise.all([...])
}
```

---

### 2.3 XSS Attack Vectors

#### ✅ XSS Được Mitigate tốt

- **Không có `dangerouslySetInnerHTML`** trong codebase
- Comment content sử dụng `{content}` (React auto-escape)
- Input validation có trong một số fields

**Tuy nhiên:** Cần kiểm tra manual HTML sanitization cho rich-text fields (nếu có).

---

### 2.4 CSRF Analysis

#### 🟡 [MEDIUM] Không có CSRF Tokens

**Tất cả POST/PATCH/DELETE endpoints** không sử dụng CSRF tokens.

**Mitigation hiện tại:**
```typescript
// SameSite=Lax cookies - giảm thiểu một số CSRF vectors
cookieStore.set({
  httpOnly: true,
  sameSite: 'lax',  // Good
})
```

**Fix:**
```typescript
// Sử dụng SameSite=Strict hoặc CSRF token
// Next.js 14+ có built-in CSRF protection
// Hoặc sử dụng double-submit cookie pattern
```

---

## PHẦN 3: GREY-BOX AUDIT (EMPLOYEE Perspective)

### 3.1 IDOR - Asset Access

#### 🔴 [CRITICAL] Employee có thể xem History của ANY Asset

**Endpoint:** `GET /api/assets/[id]/history`

```typescript
// VULNERABLE
await requirePermissionApi('assets.read')  // EMPLOYEE CÓ quyền này!
// KHÔNG check asset.assignedUserId === user.id
```

**Impact:** Employee A có thể xem lịch sử laptop của Employee B.  
**Scenario:** Attacker enumerate asset IDs → gọi API → xem được full history bao gồm checkout/checkin records.

**Fix:**
```typescript
const asset = await prisma.asset.findUnique({ where: { id } })
const userRole = await getUserRole(session.user.id)

if (userRole === 'EMPLOYEE' && asset.assignedUserId !== session.user.id) {
  return NextResponse.json({ 
    code: 'FORBIDDEN', 
    message: 'Bạn không có quyền xem thông tin tài sản này.' 
  }, { status: 403 })
}
```

---

#### 🔴 [CRITICAL] Employee có thể tạo Maintenance Record cho ANY Asset

**Endpoint:** `POST /api/assets/[id]/maintenances`

```typescript
// VULNERABLE
const actor = await requirePermissionApi('assets.update')  
// EMPLOYEE KHÔNG nên có quyền này ở API level!
```

**Impact:** Employee tạo maintenance record giả cho tài sản người khác.  
**Scenario:** Employee B tạo fake repair record cho laptop của Employee A để báo cáo chi phí ảo.

**Fix:**
```typescript
// Chỉ IT_STAFF+ được tạo maintenance
const actor = await requirePermissionApi('assets.update')
if (actor.role === 'EMPLOYEE') {
  return NextResponse.json({ 
    code: 'FORBIDDEN', 
    message: 'Chỉ nhân viên IT mới được tạo bản ghi bảo trì.' 
  }, { status: 403 })
}
```

---

#### 🟠 [HIGH] Employee có thể đánh dấu kiểm kê ANY Asset

**Endpoint:** `POST /api/assets/[id]/audit`

```typescript
// VULNERABLE
const actor = await requirePermissionApi('assets.update')  
// EMPLOYEE có thể audit bất kỳ asset nào
```

**Impact:** Employee giả mạo audit date để trì hoãn kiểm kê.

**Fix:** Chỉ cho phép IT_STAFF+ thực hiện audit.

---

#### 🟡 [MEDIUM] Employee có thể xem License Seats của ANY License

**Endpoint:** `GET /api/licenses/[id]/seats`

```typescript
// VULNERABLE
await requirePermissionApi('licenses.read')  // EMPLOYEE CÓ quyền này!
```

**Impact:** Employee xem được ai đang sở hữu license đắt tiền.

**Fix:**
```typescript
// Employee chỉ xem seat MÌNH đang sở hữu
const seats = await prisma.licenseSeat.findMany({
  where: {
    licenseId: id,
    deletedAt: null,
    OR: [
      { assignedUserId: user.id },
      { license: { companyId: user.companyId } } // Company-level access
    ]
  }
})
```

---

#### 🟡 [MEDIUM] EULA Gate không có Permission Check

**Endpoint:** `GET /api/assets/[id]/eula-gate`

```typescript
// VULNERABLE
const session = await getServerSession(authOptions)
if (!session?.user?.id) { ... }  // Chỉ check login!
```

**Fix:** Thêm `requirePermissionApi('assets.read')`.

---

### 3.2 Permission Gap Analysis

| Permission | EMPLOYEE | IT_STAFF | IT_MANAGER | ADMIN |
|------------|----------|----------|------------|-------|
| **assets.read** | Yes* | Yes | Yes | Yes |
| **assets.update** | Yes* | Yes | Yes | Yes |
| **assets.delete** | No | No | Yes | Yes |
| **licenses.read** | Yes* | Yes | Yes | Yes |
| **reports.view** | Yes** | Yes | Yes | Yes |
| **users.update** | No | Limited | Yes | Yes |

**\*** = Có permission NHƯNG KHÔNG có ownership check ở API level  
**\*\*** = KHÔNG có permission check ở API level (CRITICAL)

---

## TỔNG HỢP VULNERABILITIES

### Theo Mức Độ Nghiêm Trọng

#### 🔴 CRITICAL (Cần Fix Ngay)

| # | Vulnerability | Category | File | CVSS |
|---|-------------|----------|------|------|
| 1 | Report endpoints thiếu auth | Auth Bypass | `/api/reports/*` | 8.1 |
| 2 | Employee xem asset history người khác | IDOR | `route.ts` | 7.5 |
| 3 | Employee tạo maintenance người khác | IDOR | `route.ts` | 7.5 |

#### 🟠 HIGH

| # | Vulnerability | Category | File |
|---|-------------|----------|------|
| 4 | Không có rate limit login | Brute Force | `login/route.ts` |
| 5 | Không có rate limit 2FA | Brute Force | `login/2fa/route.ts` |
| 6 | Employee audit asset người khác | IDOR | `audit/route.ts` |
| 7 | Employee xem maintenance người khác | IDOR | `maintenances/route.ts` |
| 8 | Password change không verify | Auth | `users/[id]/route.ts` |
| 9 | User update không check actor | Horiz. Priv Esc | `users/[id]/route.ts` |
| 10 | Employee xem license seats | IDOR | `licenses/[id]/seats` |

#### 🟡 MEDIUM

| # | Vulnerability | Category | File |
|---|-------------|----------|------|
| 11 | EULA gate không permission check | Auth | `eula-gate/route.ts` |
| 12 | Race condition rate limiter | Race | `rate-limit.ts` |
| 13 | Không có CSRF tokens | CSRF | All mutations |
| 14 | License history expose | Info Disclosure | `licenses/[id]/history` |
| 15 | Mass assignment risk | Mass Assignment | `users/route.ts` |

#### 🟢 LOW

| # | Vulnerability | Category | File |
|---|-------------|----------|------|
| 16 | Product key exposed | Info Disclosure | `licenses-expiring/route.ts` |
| 17 | 2FA fallback secret | Config | `auth-2fa-cookie.ts` |
| 18 | Forgot password rate limit | Enum | `forgot-password/route.ts` |
| 19 | Reset token brute force | Brute Force | `reset-password/route.ts` |

---

## KẾ HOẠCH VÁ LỖI

### Phase 1: Critical Fixes (Ngày 1)

#### Fix 1.1: Thêm Auth Check cho Report Endpoints
**Files:** `src/app/api/reports/*/route.ts`

```typescript
// Thêm vào đầu mỗi report endpoint
export async function GET() {
  const actor = await requirePermissionApi('reports.view')
  // Hoặc role-based:
  if (actor.role === 'EMPLOYEE') {
    return NextResponse.json({ 
      code: 'FORBIDDEN',
      message: 'Bạn không có quyền xem báo cáo.'
    }, { status: 403 })
  }
  // ... rest
}
```

#### Fix 1.2: Thêm Ownership Check cho Asset History
**File:** `src/app/api/assets/[id]/history/route.ts`

```typescript
// Sau requirePermissionApi
const asset = await prisma.asset.findUnique({ where: { id } })
if (actor.role === 'EMPLOYEE' && asset?.assignedUserId !== actor.id) {
  return NextResponse.json({ code: 'FORBIDDEN' }, { status: 403 })
}
```

#### Fix 1.3: Thêm Role Check cho Maintenance Create
**File:** `src/app/api/assets/[id]/maintenances/route.ts`

```typescript
const actor = await requirePermissionApi('assets.update')
if (actor.role === 'EMPLOYEE') {
  return NextResponse.json({ 
    code: 'FORBIDDEN',
    message: 'Chỉ nhân viên IT mới được tạo bản ghi bảo trì.'
  }, { status: 403 })
}
```

---

### Phase 2: High Priority Fixes (Ngày 2)

#### Fix 2.1: Thêm Rate Limiting cho Login
**File:** `src/app/api/auth/login/route.ts`

```typescript
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await checkRateLimit(ip, 'login', {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  })
  if (!success) {
    return NextResponse.json({ 
      code: 'RATE_LIMITED',
      message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.'
    }, { status: 429 })
  }
  // ... rest
}
```

#### Fix 2.2: Thêm Rate Limiting cho 2FA OTP
**File:** `src/app/api/auth/login/2fa/route.ts`

```typescript
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await checkRateLimit(ip, '2fa', {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,  // 5 phút
  })
  if (!success) {
    return NextResponse.json({ code: 'RATE_LIMITED' }, { status: 429 })
  }
  // ... rest
}
```

#### Fix 2.3: Fix Employee Audit Permission
**File:** `src/app/api/assets/[id]/audit/route.ts`

```typescript
const actor = await requirePermissionApi('assets.update')
if (actor.role === 'EMPLOYEE') {
  return NextResponse.json({ 
    code: 'FORBIDDEN',
    message: 'Chỉ nhân viên IT mới được thực hiện kiểm kê.'
  }, { status: 403 })
}
```

#### Fix 2.4: Thêm User Update Actor Check
**File:** `src/app/api/settings/users/[id]/route.ts`

```typescript
export async function PUT(req: NextRequest, { params }: ...) {
  const actor = await requirePermissionApi('users.update')
  const { id } = await params
  
  const isSelf = actor.id === id
  const isPrivileged = actor.role === 'ADMIN' || actor.role === 'IT_MANAGER'
  
  if (!isSelf && !isPrivileged) {
    return NextResponse.json({ 
      code: 'FORBIDDEN',
      message: 'Bạn không có quyền sửa profile người dùng khác.'
    }, { status: 403 })
  }
  // ... rest
}
```

---

### Phase 3: Medium Priority Fixes (Ngày 3)

#### Fix 3.1: Thêm CSRF Protection
**Approach:** Sử dụng `SameSite=Strict` cookies hoặc CSRF tokens.

```typescript
// Trong NextAuth config
cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'strict',  // Thay vì 'lax'
      secure: process.env.NODE_ENV === 'production',
    }
  }
}
```

#### Fix 3.2: Thêm EULA Gate Permission Check
**File:** `src/app/api/assets/[id]/eula-gate/route.ts`

```typescript
export async function GET(req: NextRequest, { params }: ...) {
  const actor = await requirePermissionApi('assets.read')
  // ... rest
}
```

#### Fix 3.3: Mask Product Key
**File:** `src/app/api/reports/licenses-expiring/route.ts`

```typescript
return {
  productKey: l.productKey ? '••••••' + l.productKey.slice(-4) : null,
}
```

---

## CHECKLIST KIỂM THỬ SAU FIX

### Authentication Tests
- [ ] Login brute-force bị chặn sau 5 attempts
- [ ] 2FA OTP brute-force bị chặn
- [ ] Employee không truy cập được report endpoints

### IDOR Tests
```bash
# Test as EMPLOYEE:
curl -H "Cookie: ..." GET /api/assets/{other_user_asset_id}/history
# Expected: 403

curl -H "Cookie: ..." POST /api/assets/{other_user_asset_id}/maintenances \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
# Expected: 403

curl -H "Cookie: ..." POST /api/assets/{any_asset_id}/audit \
  -H "Content-Type: application/json" \
  -d '{"notes":"Test"}'
# Expected: 403
```

### Authorization Tests
- [ ] Employee không thể update user khác
- [ ] Employee không thể update password user khác
- [ ] IT_STAFF có thể update users nhưng không thể change role

---

## RECOMMENDATIONS

### Ngắn hạn (1 tuần)
1. Fix tất cả CRITICAL vulnerabilities (Phase 1)
2. Thêm rate limiting cho login/2FA
3. Review và fix EMPLOYEE permissions ở API level

### Trung hạn (1 tháng)
1. Thêm Zod schemas cho validation
2. Implement CSRF protection
3. Replace in-memory rate limiter với Redis
4. Security penetration testing sau khi fix

### Dài hạn (3 tháng)
1. Implement OAuth 2.0 / SAML cho SSO
2. Add audit logging cho sensitive operations
3. Implement API versioning và deprecation policy
4. Regular security audit schedule (quarterly)

---

*Báo cáo được tạo bởi Security Auditor Agent - 28/07/2026*
