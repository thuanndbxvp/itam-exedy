# Acceptance Criteria - Sprint R.1: Critical Security Hotfix

**Date:** 28/07/2026  
**Status:** DONE

---

## Mục tiêu

Fix các lỗ hổng bảo mật CRITICAL/HIGH được phát hiện trong Security Audit Report.

---

## Security Issues Fixed

### ✅ R.1.1: Rate Limiting cho Login Endpoint

**Issue:** Không có rate limiting → brute force possible

**Fix:** Thêm `checkRateLimit` với 5 attempts / 15 minutes / IP

**Verification:**
- [ ] `POST /api/auth/login` trả về 429 khi vượt quota
- [ ] Response có headers: `Retry-After`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- [ ] Attack simulation: brute force bị chặn sau 5 attempts

**Files Changed:**
- `src/app/api/auth/login/route.ts`

---

### ✅ R.1.2: Rate Limiting cho 2FA OTP

**Issue:** Không có rate limiting → OTP brute force possible (1 triệu combinations)

**Fix:** Thêm `checkRateLimit` với 10 attempts / 5 minutes / IP

**Verification:**
- [ ] `POST /api/auth/login/2fa` trả về 429 khi vượt quota
- [ ] Headers `Retry-After` được trả về
- [ ] Attacker không thể brute-force OTP

**Files Changed:**
- `src/app/api/auth/login/2fa/route.ts`

---

### ✅ R.1.3: User Update Actor Check (Privilege Escalation Prevention)

**Issue:** IT_STAFF có thể sửa thông tin bất kỳ user nào (horizontal privilege escalation)

**Fix:**
1. Thêm `isSelf` check: `actor.id === id`
2. Thêm `isPrivileged` check: `actor.role === 'ADMIN' || 'IT_MANAGER'`
3. IT_STAFF chỉ có thể sửa EMPLOYEE users

**Verification:**
- [ ] IT_STAFF không thể sửa user khác (403 Forbidden)
- [ ] IT_STAFF không thể sửa IT_MANAGER hoặc ADMIN
- [ ] User có thể tự sửa profile của mình
- [ ] ADMIN/IT_MANAGER có thể sửa user khác

**Files Changed:**
- `src/app/api/settings/users/[id]/route.ts`

---

### ✅ R.1.4: Remove Password Update from User PUT

**Issue:** IT_STAFF có thể đổi password của ADMIN qua user PUT endpoint

**Fix:**
1. Loại bỏ `password` field từ PUT endpoint
2. Tạo dedicated endpoint `POST /api/settings/users/[id]/change-password`

**Verification:**
- [ ] `PUT /api/settings/users/[id]` không cho phép update password
- [ ] Trả về lỗi `INVALID_REQUEST` nếu body chứa password
- [ ] `/change-password` endpoint hoạt động đúng

**Files Changed:**
- `src/app/api/settings/users/[id]/route.ts`
- `src/app/api/settings/users/[id]/change-password/route.ts` (NEW)

---

### ✅ R.1.5: Dedicated Password Change Endpoint

**Issue:** Cần endpoint riêng cho password changes với security tốt hơn

**Features Implemented:**
1. Self-service: Yêu cầu current password verification
2. Admin reset: Không cần current password nhưng yêu cầu ADMIN role
3. Rate limiting: 5 changes / 15 minutes / user
4. Password validation: Minimum 8 characters
5. Audit logging: Record PASSWORD_CHANGE action
6. Password reuse prevention: Không cho reuse current password

**Verification:**
- [ ] Self: User phải nhập current password đúng
- [ ] Admin: ADMIN có thể reset password không cần current
- [ ] Rate limit: Bị chặn sau 5 attempts trong 15 phút
- [ ] Minimum length: 8 characters
- [ ] Audit log: Có ghi PASSWORD_CHANGE

**Files Created:**
- `src/app/api/settings/users/[id]/change-password/route.ts`

---

### ✅ R.1.6: EULA Gate Permission Check

**Issue:** Chỉ require authentication, không check permission

**Fix:** Thêm `resolvePermissions` + check `assets.read`

**Verification:**
- [ ] User không có `assets.read` bị 403 Forbidden
- [ ] User có `assets.read` được phép truy cập

**Files Changed:**
- `src/app/api/assets/[id]/eula-gate/route.ts`

---

## Test Scenarios

### Brute Force Protection
```bash
# Test login rate limit
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
# After 5 attempts: should get 429 with Retry-After header
```

### Privilege Escalation Prevention
```bash
# Login as IT_STAFF
curl -X PUT http://localhost:3000/api/settings/users/ADMIN_ID \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"firstName":"Hacked"}'
# Expected: 403 Forbidden
```

### Password Change Security
```bash
# Self-password change requires current password
curl -X POST http://localhost:3000/api/settings/users/SELF_ID/change-password \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"currentPassword":"wrong","newPassword":"NewPass123"}'
# Expected: 403 Invalid current password

# With correct current password
curl -X POST http://localhost:3000/api/settings/users/SELF_ID/change-password \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"currentPassword":"CorrectPass","newPassword":"NewPass123"}'
# Expected: 200 OK
```

---

## Security Metrics

| Metric | Before | After |
|--------|--------|-------|
| Login brute force | Unlimited | 5/15min |
| 2FA OTP brute force | Unlimited | 10/5min |
| Password change rate | N/A | 5/15min |
| User update by non-owner | Allowed | 403 |
| Password via PUT | Allowed | 400 |

---

## Sign-off

- [ ] Code Review: Approved
- [ ] Security Testing: Passed
- [ ] Integration Testing: Passed
