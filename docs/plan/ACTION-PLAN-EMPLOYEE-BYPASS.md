# ACTION PLAN: Fix EMPLOYEE Privilege Bypass

**Date:** 28/07/2026  
**Status:** 📋 READY FOR REVIEW

---

## PROBLEM SUMMARY

User **nguyenha** (EMPLOYEE) có thể truy cập `/maintenances` và `/settings/users` sau khi logout/login.

**Root Cause:** 
- Code permission guards ✅ ĐÚNG
- Vấn đề nằm ở: Database override HOẶC Cache không clear

---

## PHASE 1: Database Investigation (CẦN THỰC HIỆN TRƯỚC)

### Step 1.1: Check nguyenha's Permissions in Database

Chạy trên Vercel Postgres Dashboard hoặc via CLI:

```sql
-- Tìm user nguyenha
SELECT id, "firstName", "lastName", email, role, "customRoleId"
FROM "User" 
WHERE "firstName" LIKE '%nguyen%' OR email LIKE '%nguyen%';
```

**Output cần xem:**
- `role` = EMPLOYEE? (đúng)
- `customRoleId` = có giá trị? (sai - phải là NULL)

### Step 1.2: Check UserPermission Overrides

```sql
-- Thay <user_id> bằng ID từ step 1.1
SELECT up.*, p.key as "permissionKey"
FROM "UserPermission" up
JOIN "Permission" p ON up."permissionId" = p.id
WHERE up."userId" = '<user_id>';
```

**Output cần xem:**
- Không có records nào cho nguyenha (đúng)
- HOẶC có records với `effect` = 'GRANT' cho assets.read/users.read (sai - cần xóa)

### Step 1.3: Check Custom Role Permissions

```sql
-- Thay <custom_role_id> bằng giá trị từ step 1.1 (nếu có)
SELECT rp.*, r.name as "roleName", p.key as "permissionKey"
FROM "RolePermission" rp
JOIN "Role" r ON rp."roleId" = r.id
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.id = '<custom_role_id>';
```

**Output cần xem:**
- customRoleId = NULL (đúng)
- HOẶC custom role KHÔNG chứa assets.read/users.read (đúng)

---

## PHASE 2: Fix Actions (DỰA TRÊN KẾT QUẢ)

### Scenario A: customRoleId có giá trị

```sql
-- Fix: Xóa custom role của nguyenha
UPDATE "User" SET "customRoleId" = NULL 
WHERE "firstName" LIKE '%nguyen%';
```

### Scenario B: Có UserPermission GRANT assets.read/users.read

```sql
-- Fix: Xóa các override không mong muốn
DELETE FROM "UserPermission"
WHERE "userId" = '<user_id>'
AND "permissionId" IN (
  SELECT id FROM "Permission" 
  WHERE key IN ('assets.read', 'licenses.read', 'users.read', 'settings.update')
);
```

### Scenario C: Cả hai đều có

Chạy cả 2 commands trên.

---

## PHASE 3: Preventive Fix (CODE CHANGES)

### Fix 3.1: Clear Permission Cache on Login

**File:** `src/app/api/auth/login/route.ts`

```typescript
// Import
import { invalidatePermissionCache } from '@/lib/permissions/resolve'

// Sau khi login thành công, thêm:
invalidatePermissionCache(user.id)
```

### Fix 3.2: Clear Permission Cache on 2FA Login

**File:** `src/app/api/auth/login/2fa/route.ts`

```typescript
// Import
import { invalidatePermissionCache } from '@/lib/permissions/resolve'

// Sau khi 2FA verify thành công:
invalidatePermissionCache(user.id)
```

### Fix 3.3: Reduce Sidebar Cache TTL (Optional)

**File:** `src/components/Sidebar.tsx`

```typescript
// Hiện tại: 5 phút
const PERM_CACHE_TTL_MS = 5 * 60 * 1000

// Đổi thành: 1 phút
const PERM_CACHE_TTL_MS = 60 * 1000
```

---

## VERIFICATION CHECKLIST

Sau khi thực hiện fix:

- [ ] User nguyenha logout hoàn toàn (clear cookies)
- [ ] User nguyenha login lại
- [ ] Truy cập `/maintenances` → phải bị redirect về `/`
- [ ] Truy cập `/settings/users` → phải bị redirect về `/`
- [ ] Sidebar không hiển thị menu "Người dùng", "Bảo trì"

---

## FILES TO BE MODIFIED

| File | Change | Risk |
|------|--------|------|
| `src/app/api/auth/login/route.ts` | Add cache invalidation | Low |
| `src/app/api/auth/login/2fa/route.ts` | Add cache invalidation | Low |
| `src/components/Sidebar.tsx` | Reduce cache TTL (optional) | Low |

---

## ESTIMATED TIME

- Phase 1 (DB Investigation): 10 phút
- Phase 2 (DB Fix): 5 phút  
- Phase 3 (Code Fix): 15 phút
- **Total:** ~30 phút

---

## APPROVAL

| Role | Name | Date | Sign |
|------|------|------|------|
| Reviewer | ??? | 28/07/2026 | ⬜ |

---

**Ready for review. Please approve or request changes.**
