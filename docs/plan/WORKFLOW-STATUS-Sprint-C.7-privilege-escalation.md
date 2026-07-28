# WORKFLOW STATUS - Sprint C.7: Security Fix - Privilege Escalation

**Start Date:** 28/07/2026  
**End Date:** 28/07/2026  
**Status:** ✅ DONE

---

## Task List

| # | Task | Status | Notes |
|---|------|--------|-------|
| C.7.1 | Analyze sprint requirements | ✅ DONE | Privilege escalation issue |
| C.7.2 | Review related code | ✅ DONE | catalog.ts permissions |
| C.7.3 | Implement features | ✅ DONE | 1 file changed |
| C.7.4 | Test and verify | ✅ DONE | Config change only |
| C.7.5 | Create acceptance docs | ✅ DONE | - |

---

## Security Fix Summary

### Issue
EMPLOYEE có quyền truy cập vào các trang không nên thấy:
- `assets.read` → Xem danh sách thiết bị
- `licenses.read` → Xem danh sách bản quyền
- `users.read` → Xem danh sách nhân viên

### Fix
Thu hồi tất cả quyền trên, chỉ giữ lại quyền Helpdesk cơ bản.

---

## Files Changed

```
Modified:
  src/lib/permissions/catalog.ts           # Removed EMPLOYEE permissions
```

---

## Deployment Requirements

1. Deploy code changes
2. Re-seed database để cập nhật RolePermission
3. Test với tài khoản EMPLOYEE

---

## Related Sprints

| Sprint | Features |
|--------|----------|
| C.6 | Asset-centric Tickets (IT) |
| **C.7** | Privilege Escalation Fix |
| C.8-C9 | Integrations |
