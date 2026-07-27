# WORKFLOW-STATUS: Sprint D - UserPreference Schema Migration

**Người lập:** Tier 1 (Planner)
**Coder:** Tier 2

## Trạng thái hiện tại
`[x] DONE`

## Lịch sử cập nhật
- **[2026-07-28]**: Tier 1 khởi tạo bản vẽ Sprint D. Đặt cờ Blocker. Yêu cầu Tier 2 ưu tiên làm trước khi đụng vào tính năng liên quan đến Email (Sprint B10).
- **[2026-07-28]**: Tier 2 hoàn thành Sprint D. Pushed 1 commit (HEAD = TBD - see git log).

## Commits
| Feature | Commit | Note |
|---------|--------|------|
| Sprint D | TBD | feat(db): Sprint D - UserPreference schema + seed + verify |

## Acceptance Status

### Schema & Migration
- [x] **D1.** `npx prisma format` clean (no syntax error)
- [x] **D2.** SQL applied via `prisma db execute --stdin` (vì DB chưa có `_prisma_migrations` table, không thể `migrate dev` đúng cách)
- [x] **D3.** Table `UserPreference` exists (verified: 28→29 tables)
- [x] **D4.** Relation 1:1 User ↔ UserPreference (UNIQUE trên userId)
- [x] **D5.** Cascade delete: xóa User → xóa Preference (verified bằng `verify-user-preferences.ts`)
- [x] **D6.** Defaults: `emailDigestFrequency=DAILY`, `theme=SYSTEM`
- [x] **D7.** Index `(userId, muteUntil)` cho digest queries

### Data Seeding
- [x] **D8.** `migrate-user-preferences.ts` chạy thành công, 6/6 users seeded
- [x] **D9.** `prisma.user.findUnique({ include: { preference: true } })` returns object (verified cho admin user)
- [x] **D10.** `docs/db-changelog.md` updated với entry 2026-07-28

## Migration Approach Note
DB hiện tại có 28 bảng + 12 enum đã được setup qua raw SQL trước đó (không có `_prisma_migrations` table).
Tại Sprint D:
- **KHÔNG dùng** `prisma migrate dev` (sẽ cố re-create toàn bộ schema → mất data).
- **Dùng** `prisma db execute --stdin` với file SQL thủ công (`prisma/sql/sprint_d_user_preference.sql`).
- Forward sprint muốn add enums/tables mới → vẫn tiếp tục approach này. Khi nào cần formal migration history, có thể `prisma migrate dev --create-only` rồi mark as applied thủ công.

## Deferred (documented, NOT lost)
- **Audit log integration**: UserPreference CRUD hiện không ghi `ActionLog` vì `ItemType` enum vẫn chưa có `USER_PREFERENCE`. B10 sẽ thêm `USER_PREFERENCE` value nếu cần.
- **UI cho User Preferences** (chỉnh email digest frequency, theme): đợi B10.

## Quality Gates
- [x] `npx prisma format` clean
- [x] `npx prisma generate` clean
- [x] `npx tsc --noEmit` clean
- [x] `scripts/verify-user-preferences.ts` PASS (cascade + defaults)
- [x] `scripts/migrate-user-preferences.ts` runs idempotent
