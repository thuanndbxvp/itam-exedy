# BẢN VẼ EPIC A: MỞ RỘNG PRISMA SCHEMA (NỀN TẢNG PHASE 1)

**Epic:** A — Schema nền tảng
**Phase:** 1 (MVP+)
**Planner:** Tier 1
**Ngày:** 2026-07-25

---

## 1. Tổng quan

Refactor toàn bộ `prisma/schema.prisma` để clone 5 invariant nghiệp vụ quan trọng nhất từ Snipe-IT (#1, #2, #4, #5, #6) đã chốt trong `PLAN-CLONE-FROM-SNIPEIT.md`.

**Quyết định sếp đã duyệt**:
- Assignment dùng **3 nullable FK** (không polymorphic).
- Soft-delete **BẬT** cho Asset, User, License, LicenseSeat, Category, Location, Department.
- Custom field **DEFER** Phase 4.
- Multi-Company: **tạo model Company + CompanyUser, disable FMCS ở Phase 1** (query coi như 1 tenant).

## 2. Mục tiêu cụ thể

- [ ] Thêm 11 model mới: `AssetModel`, `Category`, `Location`, `Department`, `Manufacturer`, `Supplier`, `Depreciation`, `Company`, `CompanyUser`, `LicenseSeat` (thay thế cấu trúc cũ).
- [ ] Mở rộng `Asset`: 30+ field (purchase, warranty, expected checkin, audit, counters, image, rtdLocationId, 3 FK assignment).
- [ ] Mở rộng `License`: 14 field (expirationDate, terminationDate, reassignable, seats thay seatsTotal, maintained, ...).
- [ ] Mở rộng `User`: thêm `password` (bcrypt), `firstName`/`lastName` (Snipe-IT pattern), `employeeNum`, `jobTitle`, `managerId`, `companyId`, `activated`.
- [ ] Mở rộng `ActionLog`: `itemType`, `targetType`, `targetId`, `oldValues` (Json), `newValues` (Json), `ipAddress`, `userAgent`. Đổi `userId` String → FK.
- [ ] Mở rộng `StatusLabel`: thêm 3 cờ `deployable`, `pending`, `archived`.

## 3. Phạm vi tập trung (scope guard)

**Tier 2 chỉ làm trong epic này**:
1. Thay thế hoàn toàn `prisma/schema.prisma`.
2. Tạo file migration `prisma/migrations/20260725_phase1_schema/migration.sql` (init lại).
3. Cập nhật `prisma/seed.ts` để có dữ liệu cho Phase 1 test.
4. Cập nhật `src/lib/prisma.ts` nếu cần (giữ nguyên).
5. KHÔNG sửa UI trong epic này — để cho Epic D.

**Tier 2 KHÔNG được**:
- Sửa UI (form/list/show).
- Sửa Server Actions (để cho Epic B).
- Sửa middleware (để cho Epic C).
- Thêm logic nghiệp vụ ngoài schema + seed.

## 4. Data flow

```
Mở rộng Schema
  → Migration init (drop + recreate)
    → Seed dữ liệu mẫu Phase 1
      → Chạy `prisma db push` hoặc `prisma migrate dev`
        → Verify bằng `prisma studio`
```

## 5. Rủi ro

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| R1 | Migration drop toàn bộ data cũ | OK vì data cũ là demo; commit riêng để rollback |
| R2 | Prisma 7 syntax khác Prisma 5/6 | Kiểm tra docs Prisma 7 — generator `prisma-client-js`, vẫn dùng `provider = "postgresql"` |
| R3 | Json type chưa có trên Postgres cũ | Prisma 7 mặc định map sang `JSONB` — OK |
| R4 | Quan hệ self (User.manager → User) | Đã support trong Prisma |
| R5 | Quan hệ tree (Location.parent → Location) | Đã support trong Prisma |
| R6 | Cascade delete sai | Rõ ràng `onDelete: Restrict` cho các FK quan trọng; soft-delete nên không cần cascade |

## 6. Files thay đổi

| File | Loại thay đổi | Tổng dòng ước tính |
|---|---|---|
| `prisma/schema.prisma` | Rewrite | ~250 dòng |
| `prisma/seed.ts` | Rewrite | ~180 dòng |
| `prisma/migrations/20260725_phase1_schema/migration.sql` | New | (auto-generated bởi Prisma) |

**Không sửa** `src/lib/prisma.ts`, `.env`, các file UI/Action.

## 7. Tiêu chí nghiệm thu

- [ ] `npx prisma format` exit code 0.
- [ ] `npx prisma validate` exit code 0.
- [ ] `npx prisma generate` exit code 0.
- [ ] `npx prisma db push` (hoặc migrate dev) chạy thành công trên DB local.
- [ ] `npx prisma studio` mở được, có thể thấy 14 model mới.
- [ ] `npx tsx prisma/seed.ts` chạy thành công, insert được dữ liệu mẫu.
- [ ] Có thể query `prisma.asset.findFirst({ include: { status: true, assignedUser: true, licenseSeats: { include: { user: true } } } })` không lỗi.
- [ ] `tsc --noEmit` PASS — **KHÔNG yêu cầu cho A1** (Epic A2 sẽ lo).

## 8. Lệnh cho Tier 2

Sếp copy lệnh này thả vào Terminal cho Tier 2 nó cày Epic A:

```bash
/code epic-A-schema
```

Tier 2 đọc file `MSEW-epic-A-schema.md` để lấy code chi tiết từng step.

---

## 9. Quyết định của Planner (sau khi đọc AUDIT-REPORT từ Tier 2)

**Ngày:** 2026-07-25
**Trạng thái:** ✅ Tier 2 đã đúng khi từ chối code. Bản vẽ MSEW có lỗ hổng nghiêm trọng.

### 9.1 Trả lời 4 câu hỏi Tier 2 nêu trong AUDIT-REPORT

#### Q1: Chọn Đề xuất A, B hay C?

**Chọn Đề xuất B — Tách Epic A thành A1 + A2.**

Lý do:
- Đề xuất A (mở rộng phạm vi) sẽ làm MSEW quá tải — 1 file MSEW chứa cả schema + 7 file patch = khó review.
- Đề xuất C (cấp Tier 2 quyền tự patch) **vi phạm rule Tier 1/Tier 2 separation** — Tier 1 phải thiết kế patch, không phải Tier 2.
- Đề xuất B (tách A1 + A2) cho phép **review chặt từng khúc** và rollback dễ nếu A2 fail.

#### Q2: Chạy `npx prisma db push --force-reset --accept-data-loss` trên Neon DB?

**✅ ĐƯỢC PHÉP — chạy trên Neon DB.**

Lý do:
- DATABASE_URL hiện tại trỏ tới `neondb_owner:...ep-still-bonus-...neon.tech/neondb` — đây là **Neon free-tier / branch development**, không phải production. Data hiện chỉ là seed demo.
- Tuy nhiên, để giảm rủi ro: **Backup DATABASE_URL** vào `.env.backup-before-a1` trước khi chạy.
- Dùng `npx prisma migrate dev --name phase1_schema` thay vì `db push --force-reset` — an toàn hơn vì sinh migration file đúng chuẩn. Nếu fail vì connection pooler Neon, fallback `--force-reset --accept-data-loss`.

#### Q3: Cài `bcryptjs` + `@types/bcryptjs` hay `argon2`?

**Chọn `bcryptjs` + `@types/bcryptjs`.**

Lý do:
- `bcryptjs` thuần JS — không cần native binding → portable, dễ build Next.js 16.
- `argon2` mạnh hơn nhưng cần native build toolchain → rủi ro fail khi deploy.
- Snipe-IT dùng bcrypt → đủ tốt cho Phase 1, Phase 5 sẽ nâng cấp nếu cần.

Tier 2 được phép chạy `npm install bcryptjs @types/bcryptjs` (đã có sẵn trong dependencies tree của các tool trung gian, hoặc sẽ tự thêm).

#### Q4: `ActionLog.userId` FK Restrict, nếu muốn log mà chưa có user thì sao?

**Chọn: giữ FK Restrict + tạo User hệ thống `id = 'system'` ngay trong seed.**

Lý do:
- Đảm bảo mọi log đều có actor thật → audit trail chuẩn.
- User `system` không cần login (password = null, activated = false) — chỉ là "anchor" FK cho mọi action do hệ thống tự động.
- Tier 2 sẽ update `createAsset/checkoutAsset/checkinAsset` để ghi `userId: admin.id` (lấy từ session) hoặc fallback `userId: 'system'` User ID.
- Khi Epic C (Auth thật) chạy, Tier 2 sẽ đọc `session.user.id` và truyền vào — không còn hard-code `'system'`.

### 9.2 Cập nhật PLAN-epic-A-schema thành 2 sub-epic

| Sub-epic | Phạm vi | Tiêu chí nghiệm thu |
|---|---|---|
| **A1: Schema + Seed** | `prisma/schema.prisma` + `prisma/seed.ts` + migration + CHECK constraint | `prisma validate` PASS · `prisma generate` PASS · `prisma migrate dev` PASS · `tsx prisma/seed.ts` PASS · `prisma studio` xem được 14 model · **`tsc --noEmit` KHÔNG yêu cầu PASS** (src/ có thể tạm break) |
| **A2: Consumer Patch** | 7 file `src/` consumer — adapter sang schema mới | `tsc --noEmit` PASS · chạy thử `/`, `/assets`, `/licenses`, `/login` không crash runtime · form `/assets/new`, `/licenses/new` submit thành công |

### 9.3 Các file consumer Tier 2 phải patch ở A2

| File | Cần đổi |
|---|---|
| `src/app/actions/asset.ts` | `assignedToId` → `assignedUserId`; bỏ `model`/`categoryId` trong create signature (chuyển xuống `modelId`); ActionLog.userId lấy từ session hoặc fallback `'system'` User ID |
| `src/app/actions/license.ts` | Bỏ `seatsTotal`; create nested `seats: { create: [...] }` (BƯỚC riêng của A2); ActionLog.userId tương tự |
| `src/app/assets/page.tsx` | `assignedTo` → `assignedUser`; bỏ `getStatusColor(type)` đổi sang check `deployable/pending/archived`; UI fallback sang `firstName`/`lastName` |
| `src/app/assets/new/page.tsx` | Bỏ input `name="model"`; thêm dropdown `modelId` (query AssetModel); sửa `s.type === ...` → `s.deployable/pending`; bỏ `categoryId` input |
| `src/app/licenses/page.tsx` | `lic.seatsTotal` → `lic.seats?.length ?? 0` |
| `src/lib/auth.ts` | `user.name` → `firstName + ' ' + (lastName ?? '')`; import User role mới |
| `src/app/page.tsx` | Tạo User placeholder id `'system'` thật (hoặc dùng admin.userId từ session) trước khi insert log; `recentLogs.actionType` so sánh với enum literal |

### 9.4 Backward compat strategy

Tại Epic A2, Tier 2 KHÔNG xóa hoàn toàn API cũ — chỉ đổi tên field. Ví dụ:
- `createAsset({ assignedToId: ... })` → `createAsset({ assignedUserId: ... })`
- `prisma.asset.findMany({ include: { assignedTo: true } })` → `prisma.asset.findMany({ include: { assignedUser: true } })`

Đây là **breaking change cố ý** (chấp nhận vì MVP chưa có user ngoài admin).

### 9.5 Cập nhật WBS — bổ sung A2 vào plan

Trong `PLAN-CLONE-FROM-SNIPEIT.md` §4.1, Epic A giờ là:
- A1: Schema nền tảng (rewrite schema + seed + CHECK constraint) — **1 ngày**
- A2: Consumer Patch (7 file `src/`) — **0.5 ngày**

Tổng Epic A: ~1.5 ngày.

### 9.6 Lệnh cho Tier 2 sau khi đọc section này

Sếp copy lệnh này thả vào Terminal cho Tier 2 tiếp tục Epic A1 trước:

```bash
/code epic-A1-schema
```

Sau khi A1 xong (tsc vẫn FAIL nhưng prisma validate + seed PASS), Tier 2 sẽ tự xin chuyển sang A2. Tier 1 sẽ xuất `MSEW-epic-A2-consumer-patch.md` sau khi A1 verified.

**⚠️ GHI CHÚ QUAN TRỌNG:** File `MSEW-epic-A-schema.md` hiện tại đang hướng dẫn A1 (không có A2). Nó vẫn dùng được cho A1. Tier 2 KHÔNG cần áp dụng tiêu chí nghiệm thu #7 (`tsc --noEmit` PASS) cho A1 — Tier 1 đã hủy tiêu chí này ở sub-epic A1.