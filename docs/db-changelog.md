# DB Changelog

Lịch sử thay đổi schema database. Mỗi entry gồm: ngày, mô tả, file SQL tham chiếu.

---

## 2026-07-28 — Sprint D: UserPreference

### Bối cảnh
- Chuẩn bị cho **B10 (Email Digest / Notification preferences)** — Feature cho phép user chọn tần suất nhận email thông báo hoặc tạm mute.
- DB trước Sprint D chưa có nơi lưu preference cá nhân → cần bảng mới.

### Thay đổi
1. **Thêm enum `EmailDigestFrequency`** với 3 giá trị: `DAILY`, `WEEKLY`, `NONE`.
2. **Thêm enum `UiTheme`** với 3 giá trị: `LIGHT`, `DARK`, `SYSTEM`.
3. **Thêm bảng `UserPreference`** (1:1 optional với `User`):
   - `id` (PK, cuid)
   - `userId` (UNIQUE FK → User.id, **ON DELETE CASCADE**)
   - `emailDigestFrequency` (EmailDigestFrequency, default `DAILY`)
   - `muteUntil` (DateTime?, nullable)
   - `theme` (UiTheme, default `SYSTEM`)
   - `locale` (Text?, user-specific locale override)
   - `createdAt`, `updatedAt`
   - Index: `(userId, muteUntil)` cho query digest job
   - Index: `userId` UNIQUE (enforce 1:1)

### Quan hệ
- `User 1 — 0..1 UserPreference` (1:1 optional)
- Cascade: drop User → drop Preference. Không có chiều ngược lại (Preference không tồn tại độc lập).

### Migration approach
- Sử dụng `prisma db execute` với file SQL thủ công (`prisma/sql/sprint_d_user_preference.sql`) thay vì `prisma migrate dev`.
- Lý do: DB đã có 28 bảng + 12 enum (do setup trước đó qua SQL), không có `_prisma_migrations` history → `migrate dev` bị drift detection sẽ cố re-create toàn bộ schema (mất data).

### Data seeding
- `prisma/seed.ts` cập nhật: khi upsert admin user, đồng thời `upsert` preference của admin.
- `scripts/migrate-user-preferences.ts`: chạy 1 lần để thêm preference mặc định cho 6 user hiện có (idempotent — chạy lại không sao).

### Verification
- `scripts/verify-user-preferences.ts`:
  - Tạo user throwaway + preference
  - Verify defaults: `emailDigestFrequency=DAILY`, `theme=SYSTEM`
  - Delete user → verify preference cascade deleted
  - ✅ PASS

### Files changed
```
prisma/schema.prisma                                (MODIFY: +UserPreference, +User.preference, +2 enums)
prisma/sql/sprint_d_user_preference.sql             (NEW: SQL migration thủ công)
prisma/seed.ts                                      (MODIFY: ensure preference cho admin)
scripts/migrate-user-preferences.ts                 (NEW: idempotent backfill script)
scripts/verify-user-preferences.ts                  (NEW: cascade + defaults test)
docs/db-changelog.md                                (NEW: this file)
docs/plan/WORKFLOW-STATUS-Sprint-D-schema.md       (MODIFY: DONE checklist)
```

### Acceptance
- [x] **D1** `prisma format` clean
- [x] **D2** SQL applied via `db execute --stdin`
- [x] **D3** Table `UserPreference` exists in DB (verified 28→29 tables, enums 12→14)
- [x] **D4** 1:1 relation (Unique constraint trên userId)
- [x] **D5** Cascade delete (verified via `verify-user-preferences.ts`)
- [x] **D6** Defaults: `DAILY`, `SYSTEM`
- [x] **D7** Index `(userId, muteUntil)`
- [x] **D8** `migrate-user-preferences.ts` chạy thành công, 6/6 users seeded
- [x] **D9** `prisma.user.findUnique({ include: { preference: true } })` returns object
- [x] **D10** This changelog updated

### Forward-looking
- B10 sẽ sử dụng `emailDigestFrequency` để schedule digest email job.
- Có thể extend `UserPreference` thêm `notificationChannels` (email, in-app, sms) sau khi B10 vận hành.

---

## Lịch sử trước Sprint D
Không có migration tracking chính thức trước 2026-07-28. Schema có 28 bảng + 12 enum đã được setup qua SQL trực tiếp. Xem `prisma/schema.prisma` cho trạng thái hiện tại.
