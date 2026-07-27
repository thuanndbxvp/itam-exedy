# Phase 3 Findings — Runtime Grey-box Test

> **Target**: https://itam-exedy.vercel.app/
> **Date**: 2026-07-28
> **Method**: Browser console (PowerShell WebRequest blocked by NextAuth __Host cookies)
> **Account**: nguyenha@congty.com / 123456 (EMPLOYEE)

---

## Phase 3.1 — Vertical Escalation

| Endpoint | Expected | Actual | Verdict | Note |
|----------|----------|--------|---------|------|
| `/api/settings/users` | 403 | 200 | ⚠️ FALSE POSITIVE | EMPLOYEE có `users.read` by design (tra cứu danh bạ). **NHƯNG** response leak password hash + 2FA secret → xem F16 |
| `/api/settings/departments` | 403 | 403 | ✅ PASS | |
| `/api/settings/companies` | 403 | 403 | ✅ PASS | |
| `/api/settings/categories` | 403 | 403 | ✅ PASS | |
| `/api/settings/locations` | 403 | 403 | ✅ PASS | |
| `/api/settings/asset-models` | 403 | 403 | ✅ PASS | |
| `/api/permissions` | 403 | **500** | 🔴 FAIL | Bug: error handler check `e.message.includes('FORBIDDEN')` không match → trả 500. Xem F13. |
| `/api/permissions/roles` | 403 | **500** | 🔴 FAIL | Same bug. Xem F13. |
| `/api/admin/ticket-rules` | 403 | 403 | ✅ PASS | |
| `/api/reports/summary` | 403 | 200 | 🔴 FAIL | F8 đã ghi nhận — info disclosure |
| `/api/audit-log` | 404 | 404 | ⚠️ Note | Endpoint không tồn tại, không phải lỗi auth |

**Verdict**: 6 PASS, 1 expected-200 (false positive), 2 BUG (500 thay vì 403), 1 known leak (F8), 1 404.

---

## Phase 3.2 — Horizontal IDOR

| Test | Actual | Verdict | Note |
|------|--------|---------|------|
| `/api/helpdesk/my-assets?userId=<other-id>` | 200 | ⚠️ FALSE POSITIVE | API ignore `userId` param, luôn filter `where: { assignedUserId: user.id }` → safe by design. |
| `/assets/<other-asset-id>` (UI) | 404 | ✅ PASS | Server Component page chặn (có thể do Not Found hoặc guard). |

**Verdict**: 1 PASS, 1 false positive.

---

## Phase 3.3 — Mass Assignment

| Test | Actual | Verdict | Note |
|------|--------|---------|------|
| EMPLOYEE PUT self role=ADMIN | 403 | ✅ PASS | EMPLOYEE không có `users.update` → bị chặn ngay từ đầu. |
| EMPLOYEE PUT other role=ADMIN | 403 | ✅ PASS | Same. |

**Verdict**: 2 PASS — nhưng KHÔNG coverage F1. F1 cần test với **IT_MANAGER session** (có `users.update`). Cần user khác hoặc staging env.

---

## 🔴 New Critical Finding (xác nhận bằng admin session baseline)

### F16. `/api/settings/users` leak password hash + 2FA secret cho mọi user có `users.read`

**Verified bằng admin session** (Phase 3 admin baseline):

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

**File**: `src/app/api/settings/users/route.ts:7-17` — `prisma.user.findMany()` KHÔNG select filter, trả về toàn bộ fields của User model.

**Impact**:
- EMPLOYEE có `users.read` (default) → dump toàn bộ password hash
- Offline brute force ngoài rate-limit
- 2FA secret leak (khi user enable 2FA) → bypass 2FA hoàn toàn

**Fix đề xuất**:
```typescript
// Thay findMany bằng:
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

**Cũng cần audit** các endpoint `findUnique` user khác (vd: `/api/settings/users/[id]` GET, `/api/permissions/users/[id]`) để chắc chắn không leak.

---

## 🟠 New High Finding

### F13. `/api/permissions` + `/api/permissions/roles` trả 500 thay vì 403

**Files**:
- `src/app/api/permissions/route.ts:12-14`
- `src/app/api/permissions/roles/route.ts:14-16, 30-33`
- `src/app/api/permissions/roles/[id]/route.ts` (cần verify)

**Bug**:
```typescript
} catch (e) {
  const code = e instanceof Error && e.message.includes('FORBIDDEN') ? 'FORBIDDEN' : 'UNKNOWN'
  return NextResponse.json({ ok: false, code, message: (e as Error).message }, { status: code === 'FORBIDDEN' ? 403 : 500 })
}
```

`ForbiddenError` instance có `message = "Thiếu quyền: users.manage_roles"` — KHÔNG chứa chuỗi "FORBIDDEN" → fallback 500.

**Impact**: Error 500 tiết lộ:
- Stack trace (trong production logs)
- Lộ logic "endpoint tồn tại + endpoint cần permission cao hơn"
- Khác với 403, response body có `code: 'UNKNOWN'` thay vì `code: 'FORBIDDEN'` → attacker biết guard hoạt động sai

**Fix đề xuất**:
```typescript
} catch (e) {
  // Check error name (custom Error class) thay vì message.includes
  if (e instanceof ForbiddenError) {
    return NextResponse.json({ ok: false, code: 'FORBIDDEN', message: e.message }, { status: 403 })
  }
  return NextResponse.json({ ok: false, code: 'INTERNAL', message: 'Đã xảy ra lỗi.' }, { status: 500 })
}
```

Hoặc dùng helper đã có `errorResponse(e)` — đã làm đúng ở các route khác.

---

## Summary

| Severity | Count | Items |
|----------|-------|-------|
| 🔴 CRITICAL runtime | 1 | F16 (password hash leak) |
| 🟠 HIGH runtime | 1 | F13 (500 instead of 403) |
| ⚠️ False positive (intentional design) | 2 | `users.read` cho EMPLOYEE, `my-assets` ignore userId |
| ✅ PASS | 8 | (departments, companies, categories, locations, asset-models, ticket-rules, /assets/[id] UI, mass assignment) |

**Total findings cần fix mới**: 2 (F13, F16). F16 là **CRITICAL** — ưu tiên fix ngay.