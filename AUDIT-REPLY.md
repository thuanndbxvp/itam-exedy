# AUDIT-REPLY — Phản hồi của Tier 1 cho Tier 2

**Người lập:** Tier 1 (Planner / Architect)
**Ngày lập:** 2026-07-25
**Đối tượng:** Tier 2 (Engineer / Coder)
**Trạng thái:** ✅ Tier 2 đã làm đúng — đây là phản hồi chính thức cho AUDIT-REPORT.md

---

## 1. Ghi nhận

Tier 2 đã phát hiện đúng **9 vị trí xung đột** giữa schema mới và `src/` hiện tại. Đây là lỗ hổng thật của MSEW-epic-A-schema.md, không phải copy-paste nhầm. Tier 1 chấp nhận toàn bộ phát hiện.

**Quyết định: áp dụng Đề xuất B** — tách Epic A thành **A1 (Schema)** và **A2 (Consumer Patch)**.

---

## 2. Trả lời 4 câu hỏi trong AUDIT-REPORT §5

### Q1: Chọn Đề xuất A, B hay C?

**Chọn B — Tách Epic A → A1 + A2.**

Lý do:
- Đề xuất A: 1 MSEW chứa 14 model + 7 file patch = quá tải, khó review.
- Đề xuất C: vi phạm rule Tier 1/Tier 2 separation.
- Đề xuất B: review chặt từng khúc, rollback dễ.

→ **PL đã thêm section 9 vào `PLAN-epic-A-schema.md` + tạo `MSEW-epic-A1-schema.md` riêng.**

### Q2: `prisma db push --force-reset` trên Neon DB?

**✅ OK** — chạy được.

DATABASE_URL hiện tại (`neondb_owner:...ep-still-bonus-...neon.tech/neondb`) là **Neon free-tier branch development**, không phải production. Data cũ chỉ là seed demo.

Tuy nhiên, Tier 2 BẮT BUỘC:
1. Backup `.env` thành `.env.backup-before-a1` (BƯỚC 1 của MSEW-A1).
2. **Ưu tiên `npx prisma migrate dev --name phase1_schema`** (sinh migration file đúng chuẩn).
3. Fallback `npx prisma db push --force-reset --accept-data-loss` CHỈ khi Neon pooler chặn migration.

### Q3: `bcryptjs` hay `argon2`?

**Chọn `bcryptjs` + `@types/bcryptjs`.**

Lý do:
- `bcryptjs` thuần JS → portable, dễ build Next.js 16.
- `argon2` cần native binding → rủi ro fail khi deploy.
- Snipe-IT dùng bcrypt → đủ tốt cho Phase 1.

→ Tier 2 được phép chạy `npm install bcryptjs @types/bcryptjs` (theo rule Tier 2 §1 — tự kiểm tra dependency trước khi báo lỗi).

### Q4: `ActionLog.userId` FK Restrict + User 'system'?

**Chọn: giữ FK Restrict + tạo User `id='system'` placeholder trong seed.**

Lý do:
- Audit trail chuẩn — mọi log đều có actor thật.
- User `system` không thể login (password = null, activated = false) — chỉ là FK anchor.
- Tier 2 A2 sẽ update `src/app/actions/asset.ts` để dùng `userId: admin.id` từ session, fallback `'system'`.

→ User `system` đã có trong MSEW-A1 BƯỚC 5, dòng upsert.

---

## 3. Bug Tier 2 KHÔNG phát hiện (PL tự tìm thấy khi review)

Khi review lại `MSEW-epic-A-schema.md`, PL phát hiện **2 bug cú pháp Prisma trong seed.ts**:

| Dòng | Bug | Fix trong MSEW-A1 |
|---|---|---|
| `MSEW-epic-A-schema.md:858` | `seats: 5` — sai vì `seats` là relation field kiểu `LicenseSeat[]`, không thể gán số | XÓA hoàn toàn `seats: 5` — chỉ tạo qua nested `seats: { create: [...] }` |
| `MSEW-epic-A-schema.md:865` | `seatsRel: { create: [...] }` — sai tên relation | ĐỔI thành `seats: { create: [...] }` |

→ Tier 2 KHÔNG được dùng `MSEW-epic-A-schema.md` (file cũ). Phải đọc `MSEW-epic-A1-schema.md` (file mới).

---

## 4. Phạm vi Epic A1 (KHÔNG bao gồm `src/`)

**A1 chỉ sửa:**
- `prisma/schema.prisma` (rewrite toàn bộ)
- `prisma/seed.ts` (rewrite toàn bộ)
- `prisma/sql/phase1_check_constraints.sql` (file mới)
- `prisma/migrations/<timestamp>_phase1_schema/` (auto-generate)

**A1 KHÔNG đụng tới:**
- ~~`src/app/actions/asset.ts`~~ — A2
- ~~`src/app/actions/license.ts`~~ — A2
- ~~`src/app/assets/page.tsx`~~ — A2
- ~~`src/app/assets/new/page.tsx`~~ — A2
- ~~`src/app/licenses/page.tsx`~~ — A2
- ~~`src/lib/auth.ts`~~ — A2
- ~~`src/app/page.tsx`~~ — A2
- ~~`package.json` (chỉ thêm bcryptjs nếu chưa có)~~ — A1 OK (Tier 2 được phép `npm install`)

---

## 5. Tiêu chí nghiệm thu A1 (CẬP NHẬT)

| STT | Tiêu chí | Trạng thái A1 |
|---|---|---|
| 1 | `npx prisma format` PASS | ✅ BẮT BUỘC |
| 2 | `npx prisma validate` PASS | ✅ BẮT BUỘC |
| 3 | `npx prisma generate` PASS | ✅ BẮT BUỘC |
| 4 | `npx prisma migrate dev --name phase1_schema` PASS (hoặc `db push --force-reset`) | ✅ BẮT BUỘC |
| 5 | `npx tsx prisma/seed.ts` PASS (insert 14 model + 5 LicenseSeat + 1 ActionLog) | ✅ BẮT BUỘC |
| 6 | CHECK constraint `asset_assignment_only_one` + `license_seat_assignment_only_one` đã apply | ✅ BẮT BUỘC |
| 7 | `npx prisma studio` hiển thị đủ 14 model + data mẫu | ✅ BẮT BUỘC |
| ~~8~~ | ~~`npx tsc --noEmit` PASS~~ | ❌ **HỦY** cho A1 — sẽ FAIL vì src/ chưa patch. **A2 sẽ lo tiêu chí này.** |

→ Tier 2 chỉ cần đạt 7 tiêu chí (#1-#7) là xong A1. KHÔNG cần #8.

---

## 6. Lệnh tiếp theo cho Tier 2

Sếp copy lệnh này vào Terminal Tier 2:

```bash
/code epic-A1-schema
```

Tier 2 đọc file `docs/plan/MSEW-epic-A1-schema.md` (KHÔNG đọc `MSEW-epic-A-schema.md` — file cũ có bug).

Sau khi A1 verified (7 tiêu chí đầu PASS), Tier 2 xin chuyển sang A2:

```bash
/code epic-A2-consumer-patch
```

PL sẽ xuất `MSEW-epic-A2-consumer-patch.md` cho A2 (patch 7 file trong `src/`).

---

## 7. Lời cảm ơn

Cảm ơn Tier 2 đã dùng Pre-Audit đúng quyền hạn. Việc dừng code ở AUDIT-REPORT là **đúng luật TIER2**, tránh cho dự án bị ship schema + src/ mismatch (sẽ mất hàng giờ debug về sau).

Rule Pre-Audit hoạt động tốt — tiếp tục phát huy.
