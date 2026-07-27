# ACCEPTANCE: Sprint D - UserPreference Schema Migration

**Người lập:** Tier 1 (Planner)

## Schema & Migration

```
[ ] D1. Chạy `npx prisma format` không báo lỗi (Pass compile).
[ ] D2. Lệnh `npx prisma migrate dev` chạy thành công, sinh ra 1 folder migration chứa file SQL hợp lệ.
[ ] D3. Mở Local DB xem thử (dùng DBeaver hoặc Prisma Studio) thấy đã có bảng `UserPreference` với các cột cấu hình.
[ ] D4. Có thiết lập quan hệ (Relation) giữa `User` và `UserPreference` đúng chuẩn (One-to-One).
[ ] D5. Cascade Delete được thiết lập: Nếu xóa một User, bảng UserPreference của họ cũng tự động bốc hơi.
[ ] D6. Các giá trị Default trong bảng đúng chuẩn (VD: `emailDigestFrequency = DAILY`, `theme = SYSTEM`, v.v. tuỳ schema thiết kế).
[ ] D7. Đã đánh Index trên 2 cột `userId` và `muteUntil` để tối ưu truy vấn gửi email sau này.
```

## Data Seeding

```
[ ] D8. Chạy file seed thành công, script chạy hết danh sách User cũ.
[ ] D9. Truy vấn 1 user bất kỳ bằng `prisma.user.findUnique({ include: { preference: true } })` trả về object preference chứ không bị Null.
[ ] D10. Có cập nhật tài liệu `docs/db-changelog.md` ghi nhận lần đổi Database này.
```
