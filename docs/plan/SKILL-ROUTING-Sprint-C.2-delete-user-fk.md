# SKILL-ROUTING: Sprint C.2 - Delete User FK Fix

**Người lập:** Tier 1 (Planner)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | Sửa `schema.prisma` & Migrate | `backend-engineer` | Thay đổi core DB |
| 2 | Nâng cấp API DELETE User | `backend-engineer` | Thêm logic soft-delete, force delete |
| 3 | Ẩn soft-deleted user (API List) | `backend-engineer` | Thêm filter `deletedAt: null` |
| 4 | Fix UI crash (Ticket, Comment) | `react-reviewer` | Handle trường hợp liên kết User bị `null` do DB SetNull |

## Skill Activation Order

```
1. Mở schema.prisma, sửa 4 field (reporterId, authorId, uploaderId, userId của ActionLog) thành nullable + SetNull.
2. Chạy lệnh: npx prisma migrate dev --name fix_user_fks_nullable
3. Code API DELETE ở src/app/api/settings/users/[id]/route.ts
4. Gõ npx tsc --noEmit để tìm các file UI bị lỗi TypeScript do user object possibly null.
5. Sửa các file UI đó để render "[User đã xóa]" nếu null.
```
