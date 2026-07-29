# 🔴 SECURITY INCIDENT: EMPLOYEE Privilege Bypass Investigation

**Date:** 28/07/2026  
**Severity:** CRITICAL  
**Status:** 🔍 UNDER INVESTIGATION

---

## 1. INCIDENT SUMMARY

User **nguyenha** (EMPLOYEE role) reported ability to access:
- `/maintenances` - requires `assets.read` permission
- `/settings/users` - requires `users.read` permission

According to `SYSTEM_ROLE_PERMISSIONS`, EMPLOYEE role should only have:
```typescript
EMPLOYEE: [
  'helpdesk.view',
  'helpdesk.create_ticket', 
  'helpdesk.comment',
]
```

**Both permissions (`assets.read`, `users.read`) are NOT in EMPLOYEE base permissions.**

---

## 2. TECHNICAL INVESTIGATION

### 2.1 Permission Guards - VERIFIED CORRECT

Both pages have proper server-side permission guards:

**`/maintenances/page.tsx:37`**
```typescript
try {
  await requirePermission('assets.read')
} catch {
  redirect('/')
}
```

**`/settings/users/page.tsx:19`**
```typescript
try {
  await requirePermission('users.read')
} catch {
  redirect('/')
}
```

### 2.2 Permission Resolution - VERIFIED CORRECT

**`src/lib/permissions/resolve.ts:28-56`**
```typescript
export async function resolvePermissions(user: ResolvedUser): Promise<Set<string>> {
  // 1. Base = SYSTEM_ROLE_PERMISSIONS[user.role]
  const base = new Set<string>(SYSTEM_ROLE_PERMISSIONS[user.role] ?? [])
  
  // 2. If customRoleId → merge RoleDefinition.permissions
  // 3. Apply UserPermission override (GRANT/DENY)
  
  return base
}
```

### 2.3 Cache Mechanism

**`src/lib/permissions/resolve.ts:19-20`**
```typescript
const cache = new Map<string, CachedPerms>()
const CACHE_TTL_MS = 60_000 // 60 seconds
```

**Possible issue:** Cache might not be invalidated properly on login.

---

## 3. ROOT CAUSE HYPOTHESIS

### Hypothesis 1: Database Override (MOST LIKELY ⚠️)

User might have a `UserPermission` record in the database granting them `assets.read` or `users.read`:

```sql
SELECT * FROM "UserPermission" 
WHERE "userId" = (SELECT id FROM "User" WHERE email LIKE '%nguyenha%');
```

Or a custom role assignment:
```sql
SELECT "customRoleId" FROM "User" 
WHERE email LIKE '%nguyenha%';
```

### Hypothesis 2: Session/Cache Not Invalidated (POSSIBLE)

After logout/login, the permission cache (60s TTL) might still hold old permissions. The `invalidatePermissionCache()` is NOT called during login flow.

### Hypothesis 3: Cached Session Still Valid

If the user didn't fully logout (cleared cookies), the NextAuth session might still be valid with old permissions.

---

## 4. REQUIRED ACTIONS

### 4.1 Database Investigation (URGENT)

Run these queries to check nguyenha's actual permissions:

```sql
-- Check if nguyenha has custom role
SELECT id, "firstName", "lastName", email, role, "customRoleId"
FROM "User" 
WHERE email LIKE '%nguyenha%' OR "firstName" LIKE '%nguyen%';

-- Check UserPermission overrides
SELECT up.*, p.key as "permissionKey"
FROM "UserPermission" up
JOIN "Permission" p ON up."permissionId" = p.id
JOIN "User" u ON up."userId" = u.id
WHERE u.email LIKE '%nguyenha%';

-- Check if nguyenha has custom role with extra permissions
SELECT rp.*, r.name as "roleName", p.key as "permissionKey"
FROM "RolePermission" rp
JOIN "Role" r ON rp."roleId" = r.id
JOIN "Permission" p ON rp."permissionId" = p.id
WHERE r.id IN (SELECT "customRoleId" FROM "User" WHERE email LIKE '%nguyenha%');
```

### 4.2 Fix: Clear Permission Cache on Login

**File to modify:** `src/app/api/auth/login/route.ts`

Add cache invalidation after successful login:
```typescript
import { invalidatePermissionCache } from '@/lib/permissions/resolve'

// After successful login
invalidatePermissionCache(user.id)
```

### 4.3 Fix: Ensure Proper Cache Invalidation

The `invalidatePermissionCache()` function exists but may not be called everywhere needed.

**Files calling `invalidatePermissionCache`:**
- `src/app/api/settings/users/[id]/route.ts` (line 206)

**Files that SHOULD call it:**
- Login success flow
- Role/permission changes
- Custom role assignment changes

---

## 5. RECOMMENDED FIXES

### Fix 1: Immediate - Database Cleanup

If UserPermission overrides are found, DELETE them:
```sql
DELETE FROM "UserPermission" 
WHERE "userId" = '<nguyenha_user_id>' 
AND "permissionId" IN (
  SELECT id FROM "Permission" WHERE key IN ('assets.read', 'users.read', 'licenses.read')
);
```

### Fix 2: Set customRoleId to NULL

```sql
UPDATE "User" SET "customRoleId" = NULL WHERE email LIKE '%nguyenha%';
```

### Fix 3: Clear All Permission Cache on Login

Add to `src/app/api/auth/login/route.ts`:
```typescript
import { invalidatePermissionCache } from '@/lib/permissions/resolve'

// After finding user
invalidatePermissionCache(user.id)
```

---

## 6. PREVENTION MEASURES

1. **Audit all EMPLOYEE users** for database permission overrides
2. **Add monitoring** for unauthorized access attempts
3. **Implement proper logout** that clears all caches
4. **Add audit log** when permission check fails

---

## 7. NEXT STEPS

| Priority | Action | Owner | Status |
|----------|--------|-------|--------|
| 🔴 P1 | Check nguyenha's database permissions | DBA | PENDING |
| 🔴 P1 | Remove any unauthorized overrides | DBA | PENDING |
| 🟡 P2 | Add cache invalidation on login | Dev | PENDING |
| 🟢 P3 | Audit all EMPLOYEE users | QA | PENDING |

---

**End of Incident Report**
