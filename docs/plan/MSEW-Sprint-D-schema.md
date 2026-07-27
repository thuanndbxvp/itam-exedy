# MSEW: Sprint D - UserPreference Schema Migration

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Mục tiêu:** Mở rộng Database để chuẩn bị hệ thống Cấu hình thông báo cho User (Blocker của tính năng Email B10).

## Các bước thực thi chi tiết (Dành cho Tier 2)

### BƯỚC 1: Sửa file Prisma Schema
1. Mở file `prisma/schema.prisma`.
2. Tạo thêm một model `UserPreference` với cấu trúc dự kiến như sau (bạn có thể tuỳ chỉnh enum cho phù hợp):
```prisma
model UserPreference {
  id                   String    @id @default(cuid())
  userId               String    @unique
  emailDigestFrequency String    @default("DAILY") // hoặc dùng Enum: DAILY, WEEKLY, NONE
  muteUntil            DateTime? 
  theme                String    @default("SYSTEM")
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, muteUntil])
}
```
3. Nhớ bổ sung trường `preference UserPreference?` vào bên trong model `User` để Prisma hiểu quan hệ 2 chiều.

### BƯỚC 2: Chạy lệnh Migration
1. Mở Terminal, gõ: `npx prisma format` để đảm bảo không lỗi type.
2. Gõ lệnh: `npx prisma migrate dev --name add_user_preference`
3. Đợi tiến trình sinh ra folder migration SQL. Đừng quên commit file SQL này.

### BƯỚC 3: Viết Script Seed dữ liệu cũ
1. Do database đang có sẵn User, nếu truy vấn `user.preference` sẽ bị rỗng (null). Ta cần khởi tạo dữ liệu.
2. Tạo 1 script tạm (vd: `scripts/migrate-user-preferences.ts`) hoặc nhét vào `prisma/seed.ts` (ở cuối file) đoạn code sau:
```typescript
const users = await prisma.user.findMany({
  where: { preference: null } // Chỉ tìm những người chưa có
})
for (const u of users) {
  await prisma.userPreference.create({
    data: { userId: u.id }
  })
}
console.log(`Migrated ${users.length} user preferences.`);
```
3. Chạy script đó bằng lệnh: `npx ts-node scripts/migrate-user-preferences.ts` (hoặc tuỳ lệnh setup của dự án).

### BƯỚC 4: Cập nhật Changelog
- Mở file `docs/db-changelog.md` (nếu chưa có thì tạo mới ở thư mục gốc docs).
- Ghi log lại ngày hôm nay đã thêm bảng `UserPreference` để phục vụ chức năng Email Digest (B10).
