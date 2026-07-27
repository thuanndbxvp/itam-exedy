# SKILL-ROUTING: Sprint D - UserPreference Schema Migration

**Người lập:** Tier 1 (Planner)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | Sửa `schema.prisma` | `backend-engineer` | Cần thiết kế đúng cấu trúc data, indexes và relations |
| 2 | Chạy `prisma migrate dev` | `backend-engineer` | Sinh ra file SQL migration |
| 3 | Viết script Seed | `backend-engineer` | Viết vòng lặp Prisma tạo dummy data/default data an toàn |
| 4 | Cập nhật `docs/db-changelog.md` | `generalPurpose` | Ghi chép tài liệu hệ thống |
| 5 | Test DB | Tier 2 | Chạy query thử trên local DB |

## Skill Activation Order

```
1. (Schema) Mở file prisma/schema.prisma và code Model mới.
2. (Terminal) Chạy `npx prisma format` để check lỗi cú pháp.
3. (Terminal) Chạy `npx prisma migrate dev --name add_user_preference`
4. (Seed) Sửa file prisma/seed.ts hoặc tạo 1 file script rời để upsert preferences.
5. (Terminal) Chạy script seed.
6. (Doc) Viết Changelog.
7. Commit (commit cả file .sql sinh ra trong prisma/migrations).
```
