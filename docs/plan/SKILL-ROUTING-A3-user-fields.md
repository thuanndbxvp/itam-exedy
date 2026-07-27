# SKILL-ROUTING: A3 - User form bổ sung fields

**Người lập:** Tier 1 (Planner)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | Mở rộng API route `[id]/route.ts` | `backend-engineer` | Cần cẩn thận với bảo mật và Prisma payload validation |
| 2 | Cập nhật `EditUserForm.tsx` | `react-reviewer` | Form lớn, cần UI tổ chức gọn gàng (tabs/sections) |
| 3 | Cập nhật `UsersTable.tsx` | `ui-styling` | Thêm cột Avatar, Cần xử lý style không vỡ layout |
| 4 | Manual test | Manual browser | Test form submit và error handling |
| 5 | Commit | Tier 2 tự commit | |

## Skill Activation Order

```
1. Read schema.prisma:313-360 để lấy toàn bộ danh sách fields.
2. Sửa file API /api/settings/users/[id]/route.ts
3. Sửa EditUserForm.tsx và NewUserForm.tsx
4. Sửa UsersTable.tsx
5. tsc + build
6. Manual test
7. Commit
```
