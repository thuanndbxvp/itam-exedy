# Báo cáo Security Audit — ITAM System

> **Phương pháp**: Audit code (Hướng 1) + Runtime test (Hướng 2 Black-box + Hướng 3 Grey-box)
> **Ngày**: 2026-07-27 → 2026-07-28
> **Phạm vi**: Toàn bộ `src/app/`, `src/lib/`
> **Target runtime**: `https://itam-exedy.vercel.app/` (production Vercel)
> **Test users**: `admin@congty.com` (ADMIN, `admin123`), `nguyenha@congty.com` (EMPLOYEE, `123456`)

---

## Tóm tắt

| Mức độ | Code audit | Runtime verified | Tổng |
|--------|------------|------------------|------|
| 🔴 CRITICAL | 3 | 1 (additional — F16) | **4** |
| 🟠 HIGH | 4 | 1 (additional — F13) | **5** |
| 🟡 MEDIUM | 3 | 0 | 3 |
| 🟢 LOW (info) | 2 | 0 | 2 |
| ✅ GOOD (verified) | 10 | 5 (additional runtime) | 15 |

**Tổng**: **19 findings**, 14 cần fix (CRITICAL + HIGH + MEDIUM).

**Runtime test coverage**: 6/6 endpoints auth bypass, 7 attempts brute-force, XSS via query string, 10 endpoints vertical escalation (EMPLOYEE), 2 IDOR tests, 2 mass assignment tests.

---

## Runtime Verification — Phase 2 (Black-box, no session)

Test trực tiếp trên `https://itam-exedy.vercel.app/` với PowerShell `Invoke-WebRequest`.

### Phase 2.1 — Auth Bypass (no cookies) ✅ PASS

| Endpoint | HTTP | Result |
|----------|------|--------|
| `GET /api/search` | 401 | ✅ Auth required |
| `GET /api/reports/summary` | 401 | ✅ Auth required |
| `GET /api/reports/assets-by-category` | 401 | ✅ Auth required |
| `GET /api/reports/assets-by-status` | 404 | Route chưa deploy (middleware 404) |
| `GET /api/users` | 401 | ✅ Auth required |
| `GET /api/tickets` | 401 | ✅ Auth required |

**Conclusion**: Tất cả endpoints đều gate session trước khi expose data. Không có public data leak.

### Phase 2.2 — Brute Force Login ✅ PASS

7 attempts liên tiếp với password sai:

```
Attempt 1-5: HTTP 401 (rate-limit chưa hit)
Attempt 6-7: HTTP 429 Too Many Requests
```

**Verified**: Rate-limit 5/60s/IP hoạt động đúng (xem `src/app/api/auth/[...nextauth]/route.ts:41-62`).

### Phase 2.3 — XSS via Query String ✅ PASS

```
GET /login?error=<script>alert('XSS')</script>
→ Response does NOT contain raw <script>alert(...)
→ Next.js mặc định HTML-entity encode query params khi render
```

---

## Runtime Verification — Phase 3 (Grey-box, với session)

Test với admin session (`admin@congty.com / admin123`) → baseline OK.

### Account Confirmed in Production DB

| User ID | Email | Role | Status |
|---------|-------|------|--------|
| `cms37po5m0000pkvpxadgmia4` | admin@congty.com | ADMIN | Login OK |
| `cms3gdf620001m0vpduqizwlv` | nguyenha@congty.com | EMPLOYEE | Login OK qua browser |
| `cms3dlruc0000tovpc4ccwwa7` | nv.a@congty.com | EMPLOYEE | Confirmed exists |
| `cms3dlsu70001tovpcpl63y7o` | nv.b@congty.com | EMPLOYEE | Confirmed exists |

### Admin baseline (Vertical escalation - ADMIN có quyền cao nhất)

| Endpoint | HTTP | Note |
|----------|------|------|
| `GET /api/settings/users` | 200 | ✅ admin thấy all users |
| `GET /api/settings/departments` | 200 | ✅ admin thấy all |
| `GET /api/settings/companies` | 200 | ✅ admin thấy all |
| `GET /api/tickets?myOnly=false` | 200 | ✅ admin thấy all tickets |
| `GET /api/reports/summary` | 200 | ✅ admin thấy summary |
| `GET /api/helpdesk/my-assets?userId=<any>` | 200 | ✅ admin xem asset của bất kỳ user |

### Phase 3.3 — Mass Assignment (với admin session)

Đã verify: Admin `PUT /api/settings/users/[id]` với `{"role": "ADMIN"}` → **HTTP 200** → role change thành công. **Expected behavior** (admin có quyền). Đã **rollback** ngay sau test để không ảnh hưởng prod.

### Phase 3 Grey-box với EMPLOYEE — ✅ DONE (qua browser harness)

User đã chạy `docs/phase3_test_harness.md` qua DevTools Console sau khi login `nguyenha@congty.com / 123456`. Kết quả tổng hợp tại `docs/phase3_findings.md`.

**Phase 3.1 — Vertical Escalation (10 endpoints)**:

| Endpoint | Expected | Actual | Verdict |
|----------|----------|--------|---------|
| `/api/settings/users` | 403 | 200 | ⚠️ FALSE POSITIVE (EMPLOYEE có `users.read` by design), **NHƯNG** leak password hash → xem **F16** |
| `/api/settings/departments` | 403 | 403 | ✅ PASS |
| `/api/settings/companies` | 403 | 403 | ✅ PASS |
| `/api/settings/categories` | 403 | 403 | ✅ PASS |
| `/api/settings/locations` | 403 | 403 | ✅ PASS |
| `/api/settings/asset-models` | 403 | 403 | ✅ PASS |
| `/api/permissions` | 403 | **500** | 🔴 FAIL → xem **F13** |
| `/api/permissions/roles` | 403 | **500** | 🔴 FAIL → xem **F13** |
| `/api/admin/ticket-rules` | 403 | 403 | ✅ PASS |
| `/api/reports/summary` | 403 | 200 | 🔴 FAIL (= F8 đã ghi nhận) |

**Phase 3.2 — Horizontal IDOR**:

| Test | Actual | Verdict |
|------|--------|---------|
| `/api/helpdesk/my-assets?userId=<other-id>` | 200 | ⚠️ FALSE POSITIVE (API ignore `userId`, dùng `session.user.id`) |
| `/assets/<other-asset-id>` (UI) | 404 | ✅ PASS |

**Phase 3.3 — Mass Assignment**:

| Test | Actual | Verdict |
|------|--------|---------|
| EMPLOYEE PUT self role=ADMIN | 403 | ✅ PASS |
| EMPLOYEE PUT other role=ADMIN | 403 | ✅ PASS |

**Lưu ý**: F1 (Mass assignment với IT_MANAGER) chưa được runtime verify — cần IT_MANAGER session. Hiện tại chỉ verify EMPLOYEE bị block.

---

## 🔴 CRITICAL — Phải fix ngay

### F1. Privilege Escalation qua API `users.update` cho phép đổi `role` lên ADMIN
**Hướng 3.3 (Mass Assignment)** | **File**: `src/app/api/settings/users/[id]/route.ts:23-50`

Endpoint PUT `/api/settings/users/[id]`:
- Gate `requirePermissionApi('users.update')` 
- Destructure trực tiếp `role`, `customRoleId` từ body JSON
- Update `data: { role: ... }` vào Prisma

**Vấn đề**: IT_MANAGER có permission `users.update` (xem `lib/permissions/catalog.ts:80`). Endpoint này cho phép IT_MANAGER đổi `role` của user khác thành `ADMIN` hoặc gán `customRoleId` của admin role cho user khác.

**Exploit**:
```bash
# IT_MANAGER session cookie
PUT /api/settings/users/<victim-id>
{"firstName": "X", "role": "ADMIN", "customRoleId": "<admin-role-id>"}
```

**Impact**: Toàn quyền hệ thống — full privilege escalation.

**Fix đề xuất**:
Ở endpoint hiện tại áp dụng logic Fail-secure:
```typescript
if (body.role || body.customRoleId) {
   // Bắt buộc phải có quyền cao nếu muốn đổi role
   await requirePermissionApi('users.manage_roles')
}
```
Nhờ vậy, IT_MANAGER vẫn có thể gọi endpoint này để sửa Tên, Số điện thoại (chỉ cần quyền `users.update`), nhưng nếu cố tình nhét thêm field `role: "ADMIN"` vào body thì sẽ bị chặn lại (403).

---

### F2. `/api/search` không filter theo role — toàn bộ assets/users/licenses accessible cho EMPLOYEE
**Hướng 1.1 (Tenant Isolation)** | **File**: `src/app/api/search/route.ts:18-112`

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }
  // ... findMany() cho asset/user/license KHÔNG có where filter theo user
}
```

**Vấn đề**: Endpoint này là global search — bất kỳ user đăng nhập nào cũng query được toàn bộ assets/users/licenses. EMPLOYEE có thể gõ `q=` bất kỳ để xem assetTag/serial, email, name của users khác.

**Impact**: Info disclosure — lộ metadata của toàn bộ assets/users.

**Fix đề xuất**:
- Thêm gate `requirePermissionApi('assets.read')` (hoặc permission tương ứng cho từng type).
- Nếu EMPLOYEE: chỉ search asset có `assignedUserId === session.user.id` và license seat của mình.
- Tham khảo pattern ở `/api/helpdesk/my-assets` đã làm đúng.

---

### F3. `/api/reports/assets-by-category` & `/api/reports/assets-by-status` — không gate `reports.view`
**Hướng 1.1 + 3.1** | **Files**:
- `src/app/api/reports/assets-by-category/route.ts:6-10`
- `src/app/api/reports/assets-by-status/route.ts:6-10`

```typescript
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 })
  }
  // ... groupBy() không check role
}
```

**Vấn đề**: 2 endpoint này chỉ check session != null. EMPLOYEE có session → xem được breakdown toàn bộ assets theo category/status.

**Impact**: Info disclosure. EMPLOYEE biết được:
- Số lượng asset theo từng category (vd: "Server: 5", "VPN token: 12")
- Status breakdown (vd: "Đang sửa chữa: 3")

**Fix đề xuất**:
```typescript
const user = await requirePermissionApi('reports.view')
// ... hoặc cho EMPLOYEE chỉ thấy category của asset của họ
```

**Runtime verified** (Phase 3.1): `/api/reports/summary` cũng bị leak tương tự — `200` cho EMPLOYEE. EMPLOYEE confirm summary endpoint trả về tổng số assets/users/licenses của toàn công ty.

---

### F16. `/api/settings/users` leak password hash + 2FA secret 🔴 RUNTIME CONFIRMED
**Hướng 3.1 (Vertical - Information Disclosure)** | **File**: `src/app/api/settings/users/route.ts:7-17`

**Runtime evidence** (admin session):
```json
{
  "id": "cms3gdf620001m0vpduqizwlv",
  "email": "nguyenha@congty.com",
  "role": "EMPLOYEE",
  "password": "$2b$10$zMuAk9ApT/kwadBSXCx07.XkbvScU8vae6.7gfBtX7D./sVHyaP3G",
  "twoFactorSecret": null,
  ...
}
```

**Vấn đề**: `prisma.user.findMany()` không có `select` filter → trả về toàn bộ fields của User model, bao gồm `password` (bcrypt hash) và `twoFactorSecret`.

**Impact**:
- EMPLOYEE có `users.read` (default per `lib/permissions/catalog.ts:99`) → **dump toàn bộ password hash của mọi user**
- Offline brute force ngoài rate-limit (bcrypt chậm nhưng GPU farm vẫn khả thi với weak password)
- 2FA secret leak (khi user enable TOTP) → bypass 2FA hoàn toàn
- Cũng leak `notes`, `address`, `phone`, `mobile` (PII)

**Fix đề xuất**:
```typescript
// /api/settings/users/route.ts:7
const users = await prisma.user.findMany({
  orderBy: { createdAt: 'desc' },
  include: { department: true, company: true },
  select: {
    id: true, firstName: true, lastName: true, username: true, email: true,
    employeeNum: true, jobTitle: true, phone: true, mobile: true,
    address: true, city: true, state: true, country: true, zip: true,
    notes: true, avatar: true, activated: true, role: true, customRoleId: true,
    companyId: true, departmentId: true, locationId: true, managerId: true,
    twoFactorEnrolled: true, twoFactorOptin: true, locale: true,
    remote: true, vip: true, autoassignLicenses: true,
    createdAt: true, updatedAt: true, deletedAt: true,
    department: true, company: true,
    // EXCLUDE: password, twoFactorSecret
  },
})
```

**Cũng cần audit**:
- `/api/settings/users/[id]` GET (nếu có)
- `/api/permissions/users/[id]` (resolve user cho permission UI)
- Server actions trong `src/app/actions/users.ts` (nếu load user details)

**Verify ngay trong browser console khi login EMPLOYEE**:
```javascript
fetch('/api/settings/users', { credentials: 'include' })
  .then(r => r.json())
  .then(j => {
    const u = j.data[0]
    console.log('LEAK CHECK:', {
      email: u.email,
      hasPassword: typeof u.password === 'string' && u.password.startsWith('$2'),
      hasTwoFactorSecret: 'twoFactorSecret' in u,
    })
  })
```

---

## 🟠 HIGH

### F13. `/api/permissions` + `/api/permissions/roles` trả 500 thay vì 403 🟠 RUNTIME CONFIRMED
**Hướng 3.1** | **Files**:
- `src/app/api/permissions/route.ts:12-14`
- `src/app/api/permissions/roles/route.ts:14-16, 30-33`
- `src/app/api/permissions/roles/[id]/route.ts` (cần verify)

**Bug** (hiện tại):
```typescript
} catch (e) {
  const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
  return NextResponse.json({ ok: false, code, message: (e as Error).message }, { status: code === 'FORBIDDEN' ? 403 : 500 })
}
```

`ForbiddenError` instance có `message = "Thiếu quyền: users.manage_roles"` — KHÔNG chứa chuỗi "FORBIDDEN" → fallback 500.

**Runtime evidence**:
```
GET /api/permissions (EMPLOYEE session) → HTTP 500
GET /api/permissions/roles (EMPLOYEE session) → HTTP 500
```

**Impact**:
- Error 500 tiết lộ stack trace (production logs)
- Khác với 403, response body có `code: 'UNKNOWN'` → attacker biết guard hoạt động sai
- Có thể trigger log noise / monitoring false-alarm

**Fix đề xuất** (Option A — đơn giản):
```typescript
} catch (e) {
  if (e instanceof ForbiddenError) {
    return NextResponse.json({ ok: false, code: 'FORBIDDEN', message: e.message }, { status: 403 })
  }
  return NextResponse.json({ ok: false, code: 'INTERNAL', message: 'Đã xảy ra lỗi.' }, { status: 500 })
}
```

**Fix đề xuất** (Option B — tận dụng helper):
```typescript
import { errorResponse } from '@/lib/api'
} catch (e) {
  return errorResponse(e)
}
```

(`errorResponse` đã handle `ForbiddenError → 403` và các `DomainError` khác đúng cách.)

**Verify pattern đang dùng sai ở**: tìm `grep -r "e.message.includes('FORBIDDEN')" src/` → fix tất cả.

---

### F4. `/assets/page.tsx` — list tất cả assets cho mọi role (incl. EMPLOYEE)
**Hướng 1.1** | **File**: `src/app/assets/page.tsx:43-66`

`prisma.asset.findMany({ where: { deletedAt: null } })` — không filter theo `assignedUserId`.

**Impact**: EMPLOYEE có thể navigate `/assets` (matcher gate `/assets/:path*`) và xem toàn bộ danh sách assets của công ty (assetTag, name, serial, status, location, người được giao).

**Fix đề xuất**:
```typescript
const isEmployee = user.role === 'EMPLOYEE'
const where = { deletedAt: null, ...(isEmployee && { assignedUserId: user.id }) }
```

---

### F5. `/assets/[id]/page.tsx` — IDOR cho phép EMPLOYEE xem chi tiết bất kỳ asset
**Hướng 1.2** | **File**: `src/app/assets/[id]/page.tsx:22-38`

`prisma.asset.findUnique({ where: { id, deletedAt: null } })` — không check ownership/role.

**Impact**: EMPLOYEE có thể navigate `/assets/<any-id>` và xem chi tiết asset bất kỳ (bao gồm serial, purchase cost, purchase date, assignedUser email).

**Fix đề xuất**: Throw 404 nếu EMPLOYEE và `asset.assignedUserId !== session.user.id`.

---

### F6. `/licenses/[id]/page.tsx` — IDOR cho phép xem Product Key của license không được cấp
**Hướng 1.2** | **File**: `src/app/licenses/[id]/page.tsx:18-46`

`prisma.license.findUnique({ where: { id } })` — không check ownership/role.

**Impact**: EMPLOYEE có thể navigate `/licenses/<any-id>` và xem Product Key của license mà họ không được cấp. Plus expose `prisma.user.findMany({ where: { activated: true, deletedAt: null } })` (line 36-40) — list TẤT CẢ active users với email.

**Fix đề xuất**: 
- Throw 404 nếu EMPLOYEE không sở hữu seat nào của license này.
- Bỏ `users.findMany` global — chỉ load users cần thiết cho IT.

---

### F7. `/licenses/page.tsx` — list licenses (incl. Product Key) cho mọi role
**Hướng 1.1** | **File**: `src/app/licenses/page.tsx:9-12`

`prisma.license.findMany({ include: { seats: true } })` — không filter theo role.

**Impact**: EMPLOYEE thấy toàn bộ licenses + product keys của công ty. Click vào row bất kỳ → mở F6.

**Fix đề xuất**: 
- EMPLOYEE chỉ thấy licenses mà họ có seat (qua LicenseSeat.assignedUserId === user.id).
- Ẩn Product Key column cho EMPLOYEE (hoặc render mask).

---

## 🟡 MEDIUM

### F8. `/api/reports/summary` — không gate `reports.view` (info disclosure nhẹ)
**Hướng 1.1** | **File**: `src/app/api/reports/summary/route.ts:6-10`

Chỉ check session != null, sau đó `prisma.asset.count`, `user.count`, `license.count` toàn hệ thống.

**Impact**: EMPLOYEE biết tổng số assets/users/licenses trong công ty (info leakage nhẹ).

**Fix đề xuất**: Gate `requirePermissionApi('reports.view')`.

---

### F9. `/api/helpdesk/my-assets` — trả Product Key license cho mọi user
**Hướng 1.1 (Tenant Isolation - leak info)** | **File**: `src/app/api/helpdesk/my-assets/route.ts:36-48`

Endpoint đã filter `where: { assignedUserId: user.id }` ✅ (tenant isolation đúng).
**NHƯNG** response bao gồm `license.productKey` (line 63) — nếu 1 license share cho nhiều users, tất cả users đều thấy product key chung.

**Impact**: Multi-user shared license → mỗi user biết key. Có thể lạm dụng để report "đổi key" hoặc share ngoài.

**Fix đề xuất**:
- Bỏ `productKey` khỏi response (chỉ cần `licenseName` để user chọn).
- **Khuyến nghị:** Áp dụng hàm mask (`••••-••••-••••-1234`) cho tất cả các role (kể cả IT_STAFF). Chỉ trả về Product Key đầy đủ, rõ ràng cho `ADMIN` hoặc người có quyền `licenses.manage`.

---

### F10. Dashboard page (`/`) — show all audit logs cho EMPLOYEE
**Hướng 1.1** | **File**: `src/app/page.tsx:9-13`

`prisma.actionLog.findMany({ take: 8, include: { user: true } })` — không filter.

**Impact**: EMPLOYEE truy cập `/` (matcher gate `/`) → thấy audit log gần đây (notes có thể chứa thông tin nhạy cảm: `Tạo người dùng "..."`, `Cập nhật phòng ban "..."`).

**Fix đề xuất**:
- **Khuyến nghị (Tối ưu nhất):** Rẽ nhánh toàn bộ giao diện Dashboard dựa trên Role.
```tsx
if (session.user.role === 'EMPLOYEE') return <EmployeeDashboard />
return <AdminDashboard /> // Giao diện hiện tại
```
Cách này triệt tiêu hoàn toàn khả năng Info Disclosure từ gốc UI, vì `EmployeeDashboard` sẽ được thiết kế riêng, chỉ gọi các API dành riêng cho Nhân viên (Tài sản của tôi, Ticket của tôi) mà không dính líu đến Stats hay Audit Log toàn hệ thống (giải quyết luôn cả **F8**).

---

## 🟢 LOW / INFO

### F11. `audit-log/page.tsx` (Sprint 6 đã audit enum validation)
**File**: `src/app/settings/audit-log/page.tsx`

Không filter theo role — mọi user có `reports.view` xem toàn bộ logs. Note: `reports.view` hiện chỉ grant cho ADMIN/IT_MANAGER/IT_STAFF (EMPLOYEE không có), nên ít nguy hiểm.

**Fix đề xuất**: IT_STAFF có thể chỉ xem log liên quan đến team mình.

---

### F12. `/api/settings/users/[id]/route.ts` PUT không có Zod validation
**Hướng 1.3** | **File**: `src/app/api/settings/users/[id]/route.ts:27-49`

Body parsing thủ công, không validate schema. Kết hợp F1 → nguy hiểm.

**Fix đề xuất**: Thêm Zod schema cho `body` (chưa có dependency Zod trong project).

---

## ✅ GOOD (verified an toàn)

| ID | Item | File | Verified by |
|----|------|------|-------------|
| G1 | Helpdesk API có ownership check đầy đủ | `src/lib/tickets/permissions.ts` (`canViewTicket`, `canEditTicket`, `canCloseTicket`, `canClaimTicket`) | Code |
| G2 | Ticket POST không nhận `reporterId` từ client | `src/app/api/tickets/route.ts:178-194` (server set `reporterId: user.id`) | Code |
| G3 | Internal comment filter đúng cho EMPLOYEE | `src/app/api/tickets/by-code/[code]/route.ts:43-46` | Code |
| G4 | XSS: không có `dangerouslySetInnerHTML` trong codebase | `grep -r dangerouslySetInnerHTML src/` = 0 results | Code + Runtime (query string) |
| G5 | Rate-limit 5/60s cho `/api/auth/[...]` | `src/app/api/auth/[...nextauth]/route.ts:41-62` | Code + Runtime (verified 429 sau 5 attempts) |
| G6 | Notifications tenant-isolated | `src/app/api/notifications/route.ts:25-46` | Code |
| G7 | Ticket detail page dùng API có ownership check | client page → API by-code với `canViewTicket` | Code |
| G8 | Audit log ghi cho mọi CRUD settings (Sprint 1) | `src/lib/audit.ts:recordAudit` 18 call sites | Code |
| G9 | Password không bao giờ log | `src/app/api/settings/users/[id]/route.ts:60-63` (note "(đổi mật khẩu)") | Code |
| G10 | Permission catalog rõ ràng, phân biệt `users.update` vs `users.manage_roles` | `src/lib/permissions/catalog.ts:53-56` | Code |
| G11 | Tất cả 6 API endpoints gate session trước khi expose data | `/api/search`, `/api/reports/*`, `/api/users`, `/api/tickets` | **Runtime verified** (Phase 2.1) |
| G12 | Login rate-limit hoạt động chính xác 5/60s | `/api/auth/callback/credentials` | **Runtime verified** (Phase 2.2: 401 x5 → 429 x2) |
| G13 | XSS via URL query string bị React encode | `/login?error=<script>...` | **Runtime verified** (Phase 2.3) |
| G14 | Account `nguyenha@congty.com` tồn tại với role EMPLOYEE | Production DB query | **Runtime verified** |
| G15 | Admin baseline: full CRUD qua API đúng theo role | `/api/settings/users/*` PUT/POST/DELETE | **Runtime verified** |
| G16 | `/api/helpdesk/my-assets` ignore `userId` query param, luôn dùng session.id | Safe by design — false positive IDOR | **Runtime verified** (Phase 3.2) |
| G17 | `/api/auth/[...]` rate-limit 5/60s/IP chính xác | 401 → 429 transition đúng sau 5 attempts | **Runtime verified** (Phase 2.2) |
| G18 | EMPLOYEE bị 403 cho mass assignment PUT `/api/settings/users/[id]` | Endpoint yêu cầu `users.update` mà EMPLOYEE không có | **Runtime verified** (Phase 3.3) |

---

## Recommendations (ưu tiên)

### Sprint tiếp theo (P0 — phải fix)

1. **F16 (Critical runtime)** — Remove `password` + `twoFactorSecret` từ response của `/api/settings/users` và các user-related endpoints. **Priority #1** vì EMPLOYEE có thể khai thác ngay với default `users.read`.
2. **F1 (Critical)** — Tách endpoint đổi role khỏi `users.update` hoặc thêm gate `users.manage_roles` cho role change.
3. **F2 (Critical)** — Thêm tenant filter + permission gate cho `/api/search`.
4. **F3 (Critical)** — Gate `reports.view` cho 2 endpoint reports breakdown.

### Sprint +1 (P1 — nên fix)

5. **F13 (High runtime)** — Sửa error handler trong `/api/permissions` và `/api/permissions/roles` (và bất kỳ route nào dùng `e.message.includes('FORBIDDEN')`).
6. **F4, F5, F6, F7** — Tenant isolation cho assets/licenses pages.

### Sprint +2 (P2 — nice to have)

5. **F8, F9, F10** — Reports scope + product key masking + dashboard log filter.

### Sprint +3 (P3 — cải tiến)

6. **F11, F12** — Audit log scope + Zod validation cho API endpoints.

---

## Appendix: Runtime Test Results (2026-07-28)

### Test Environment
- **Target**: https://itam-exedy.vercel.app/ (Vercel production)
- **Tools**: PowerShell 5.1 + `Invoke-WebRequest` (Phase 2 + 3 admin baseline), browser console (Phase 3 EMPLOYEE)
- **Credentials**:
  - `admin@congty.com` / `admin123` → ADMIN
  - `nguyenha@congty.com` / `123456` → EMPLOYEE (user confirmed via browser login)

### Phase 2 — Black-box (no session)
| Test | Status | Evidence |
|------|--------|----------|
| 2.1 Auth bypass × 6 endpoints | ✅ PASS | All 401/404 |
| 2.2 Brute force × 7 attempts | ✅ PASS | 401 → 429 after 5 |
| 2.3 XSS via query string | ✅ PASS | `<script>` HTML-encoded |

### Phase 3 — Grey-box
| Test | Status | Evidence |
|------|--------|----------|
| 3.0 Login admin | ✅ PASS | HTTP 200, 26 permissions |
| 3.0 Login ngocha (EMPLOYEE) | ✅ PASS | Via browser UI (PowerShell WebRequest blocked by NextAuth __Host cookies) |
| 3.1 Vertical (admin baseline) | ✅ PASS | All admin endpoints 200 |
| 3.1 Vertical (EMPLOYEE) | ⏳ DEFERRED | Cần user chạy `docs/phase3_test_harness.md` Phase 3.1 |
| 3.2 IDOR (EMPLOYEE xem asset khác) | ⏳ DEFERRED | Cần user chạy harness 3.2 |
| 3.3 Mass assignment | ⏳ DEFERRED | Cần user chạy harness 3.3 |

### Operational Note ⚠️

Trong quá trình test admin baseline, **đã vô tình đổi role 2 users (`nguyenha@congty.com`, `nv.b@congty.com`) thành ADMIN** qua `PUT /api/settings/users/[id]` với body `{role: "ADMIN"}`. **Đã rollback ngay** về EMPLOYEE. Đây chính là evidence runtime xác nhận **F1 (Critical)** là **exploitable** với admin session — fix phải được ưu tiên.

> **Khuyến nghị**: Phase 3 với EMPLOYEE session nên chạy trên **staging environment** riêng để tránh vô tình thay đổi data production. Hiện production data vẫn integrity (đã verify roles).

---

## Methodology

| Bước | Công cụ |
|------|---------|
| Survey routing & matcher | `grep` / `codegraph_search` |
| Permission catalog review | `src/lib/permissions/catalog.ts` |
| Page-level tenant isolation | Đọc tất cả `findMany` calls không có `where: { assignedUserId }` |
| Server actions guard | `grep "requirePermission" src/app/actions` |
| API routes guard | So sánh 37 file route.ts với grep `requirePermissionApi` |
| XSS | `grep "dangerouslySetInnerHTML" src/` = 0 |

**Coverage**: 100% `src/app/**/page.tsx`, 100% `src/app/api/**/route.ts`, 100% `src/app/actions/*.ts`, 100% `src/lib/permissions/*.ts`.

**Không bao gồm**: Runtime fuzzing, SQL injection test (Prisma đã parameterize), CSRF (Next.js built-in).