# WORKFLOW STATUS - Sprint R.1: Critical Security Hotfix

**Start Date:** 28/07/2026  
**End Date:** 28/07/2026  
**Status:** ✅ DONE

---

## Task List

| # | Task | Status | Notes |
|---|------|--------|-------|
| R.1.1 | Rate Limiting cho Login | ✅ DONE | 5 attempts / 15 min / IP |
| R.1.2 | Rate Limiting cho 2FA OTP | ✅ DONE | 10 attempts / 5 min / IP |
| R.1.3 | User Update Actor Check | ✅ DONE | IT_STAFF chỉ sửa EMPLOYEE |
| R.1.4 | Remove Password from PUT | ✅ DONE | Sử dụng endpoint riêng |
| R.1.5 | EULA Gate Permission | ✅ DONE | Thêm assets.read check |
| R.1.6 | Dedicated Change-Password Endpoint | ✅ DONE | Self + Admin flows |

---

## Files Changed

```
src/app/api/auth/login/route.ts                     # R.1.1 - Rate limiting
src/app/api/auth/login/2fa/route.ts                # R.1.2 - Rate limiting
src/app/api/settings/users/[id]/route.ts           # R.1.3, R.1.4 - Actor check, remove password
src/app/api/assets/[id]/eula-gate/route.ts        # R.1.5 - Permission check
src/app/api/settings/users/[id]/change-password/   # R.1.6 - NEW endpoint
```

---

## Files Created

```
src/app/api/settings/users/[id]/change-password/route.ts  # NEW - Dedicated password change
```

---

## Acceptance Criteria

- [x] ✅ Login brute force protection (5/15min)
- [x] ✅ 2FA OTP brute force protection (10/5min)
- [x] ✅ Privilege escalation prevention
- [x] ✅ Password change security
- [x] ✅ EULA gate permission check

---

## Next Steps

Sprint R.2: Database Optimization (Indexes)
- Add missing indexes for deletedAt on all models
- Add composite indexes for common query patterns
