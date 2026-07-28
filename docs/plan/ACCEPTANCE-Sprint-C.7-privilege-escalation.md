# Acceptance Criteria - Sprint C.7: Security Fix - Privilege Escalation

**Date:** 28/07/2026  
**Status:** ✅ DONE

---

## Mục tiêu

Vá lỗ hổng bảo mật **Broken Access Control / Privilege Escalation**. Thu hồi các quyền cấp cao mà tài khoản `EMPLOYEE` đang có nhưng không nên có.

---

## Security Issue

### Before (Vulnerable)
```
EMPLOYEE có quyền:
  - assets.read     → Xem toàn bộ danh sách thiết bị ❌
  - licenses.read   → Xem toàn bộ danh sách bản quyền ❌
  - users.read      → Xem toàn bộ danh sách nhân viên ❌
  - helpdesk.*      → Helpdesk cơ bản ✅
```

### After (Secure)
```
EMPLOYEE có quyền:
  - helpdesk.view          → Xem ticket của mình ✅
  - helpdesk.create_ticket → Tạo ticket mới ✅
  - helpdesk.comment       → Bình luận ticket ✅
```

---

## Change Made

**File:** `src/lib/permissions/catalog.ts`

```typescript
// Before (Vulnerable)
EMPLOYEE: [
  'assets.read',
  'licenses.read',
  'helpdesk.view',
  'helpdesk.create_ticket',
  'helpdesk.comment',
  'users.read',
],

// After (Secure) — Sprint C.7
EMPLOYEE: [
  'helpdesk.view',
  'helpdesk.create_ticket',
  'helpdesk.comment',
],
```

---

## Expected User Experience After Fix

| Test Case | Expected Result |
|-----------|-----------------|
| EMPLOYEE login | Sidebar KHÔNG còn menu "Người dùng", "Thiết bị", "Bản quyền" |
| EMPLOYEE visit `/settings/users` | Hiển thị 403 Forbidden hoặc redirect về trang chủ |
| EMPLOYEE visit `/assets` | Hiển thị 403 Forbidden hoặc redirect về trang chủ |
| EMPLOYEE visit `/licenses` | Hiển thị 403 Forbidden hoặc redirect về trang chủ |
| EMPLOYEE visit `/helpdesk` | ✅ Hoạt động bình thường |
| EMPLOYEE tạo ticket | ✅ Hoạt động bình thường |
| EMPLOYEE chọn "Tài sản của tôi" | ✅ Hoạt động bình thường |

---

## Deployment Note

Sau khi deploy, cần **re-seed database** để cập nhật RolePermission cho EMPLOYEE:

```bash
npx prisma db seed
# Hoặc chạy lại seed script
```

Hoặc có thể chạy SQL trực tiếp để cập nhật:

```sql
-- Xóa quyền cũ của EMPLOYEE
DELETE FROM "RolePermission" 
WHERE "roleId" IN (SELECT id FROM "Role" WHERE name = 'EMPLOYEE');

-- Insert quyền mới
INSERT INTO "RolePermission" ("roleId", "permissionId", "granted")
SELECT r.id, p.id, true
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.name = 'EMPLOYEE'
AND p.key IN ('helpdesk.view', 'helpdesk.create_ticket', 'helpdesk.comment');
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/lib/permissions/catalog.ts` | Thu hồi quyền từ EMPLOYEE |

---

## Sign-off

- [x] Code Review: Approved
- [x] Security Assessment: Passed
- [ ] Re-seed Database: Pending
- [ ] Manual Testing: Pending
