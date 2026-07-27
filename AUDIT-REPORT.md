# AUDIT-REPORT — epic-A-schema (Pre-Audit Report)

**Người lập:** Tier 2 (Engineer / Coder)
**Ngày lập:** 2026-07-25
**Trạng thái:** ⛔ **TỪ CHỐI CODE** — chờ Tier 1 phản hồi trước khi thi công

---

## Tóm tắt

MSEW `epic-A-schema` yêu cầu rewrite hoàn toàn `prisma/schema.prisma` + cập nhật `prisma/seed.ts`. Sau khi pre-audit đối chiếu schema mới với source code thực tế trong `src/`, tôi phát hiện **nhiều xung đột nghiêm trọng giữa bản vẽ và hiện trạng** mà bản vẽ chưa tính đến.

Nếu tôi áp dụng đúng 100% BƯỚC 2 → BƯỚC 6 của MSEW như hiện tại, `npx tsc --noEmit` (tiêu chí nghiệm thu #7) **chắc chắn FAIL đỏ**, vì các file `src/` đang gọi field/relation đã bị xóa.

→ Đây là **xung đột logic thực sự**, không phải copy-paste nhầm dòng. Tôi buộc phải dừng lại theo đặc quyền Pre-Audit đã công bố ở `TIER2_PROMPT.md`.

---

## 1. Phát hiện về Dependencies (YÊU CẦU SẾP DUYỆT)

| # | Mục | Trạng thái | Hành động cần |
|---|---|---|---|
| D1 | `bcryptjs` + `@types/bcryptjs` | ❌ Chưa có trong `package.json` | Tier 1 cần quyết: tôi có được phép chạy `npm i bcryptjs @types/bcryptjs` không, hay phải dùng `bcrypt` thuần? |
| D2 | `prisma migrate dev` vs `--create-only` | ⚠️ `--create-only` sinh file nhưng **không apply**. MSEW bước 3 nói lưu file rồi apply bằng `npx prisma migrate dev`. Lệnh này sẽ tạo 1 migration name `phase1_schema`. Tôi sẽ chạy theo đúng. |
| D3 | DB đang dùng **Neon PostgreSQL** (serverless) — không phải local Postgres. Lệnh `npx prisma db push --force-reset` sẽ reset DB production. Cần sếp xác nhận trước khi chạy. |

---

## 2. Phát hiện về XUNG ĐỘT SCHEMA ↔ SOURCE CODE (đây là phần khiến tôi từ chối code)

### 2.1. `Asset.assignedToId` → bị xóa

| Vị trí | Code hiện tại | MSEW yêu cầu | Tác động |
|---|---|---|---|
| `src/app/actions/asset.ts:33-36` | `data: { assignedToId: userId }` | Field `assignedToId` không còn trong schema mới, đổi thành `assignedUserId` | **BROKEN** |
| `src/app/actions/asset.ts:53-57` | `data: { assignedToId: null }` | Đổi thành `assignedUserId: null` | **BROKEN** |
| `src/app/assets/page.tsx:9,99-105` | `include: { ..., assignedTo: true }`, đọc `asset.assignedTo.name` | Relation `assignedTo` không còn; thay bằng `assignedUser`, `assignedLocation`, `assignedAsset` (3 FK nullable) | **BROKEN** |

### 2.2. `Asset.model` (String) → bị tách thành `AssetModel` riêng

| Vị trí | Code hiện tại | MSEW yêu cầu |
|---|---|---|
| `src/app/actions/asset.ts:10` (type) và `:15-16` (create) | `createAsset({ ..., model: string })` → ghi thẳng `model: string` vào Asset | Schema mới: `model` là String cũ bị **XÓA**; thay bằng `modelId: String?` FK sang `AssetModel` |
| `src/app/assets/new/page.tsx:16` | Form gửi `name="model"` (text input) | Không còn field `model`, phải đổi sang chọn `modelId` từ dropdown |

### 2.3. `Asset.categoryId` (cho cả Asset và License)

Hiện trạng: `Asset.categoryId` chỉ là String (không có relation). Schema mới vẫn giữ `categoryId`, nhưng **Asset mới không còn `categoryId`** — nó nằm trên `AssetModel`. Cần rà lại: code `src/app/actions/asset.ts:11` truyền `categoryId` vào create, vậy phải map sang AssetModel.categoryId.

### 2.4. `StatusLabel.type` (String) → bị thay bằng 3 cờ boolean

| Vị trí | Code hiện tại | MSEW yêu cầu |
|---|---|---|
| `src/app/assets/page.tsx:15-22` | `getStatusColor(type: string)` switch theo `'DEPLOYABLE'/'DEPLOYED'/'BROKEN'` | `type` field bị **XÓA**; thay bằng `deployable / pending / archived` (boolean) |
| `src/app/assets/page.tsx:93` | Đọc `asset.status?.type` | Đọc `asset.status?.deployable` boolean |
| `src/app/assets/new/page.tsx:127` | `s.type === 'DEPLOYABLE' ? '🟢 ' : s.type === 'BROKEN' ? '🔴 ' : '🔵 '` | Phải map sang boolean |
| `src/app/page.tsx:9-10` | `count({ where: { statusId: 'status-deployed' } })` | Status id giữ nguyên, OK. Nhưng `recentLogs` đọc `log.actionType` (string so sánh với `'CREATE'/'CHECKOUT'`) — schema mới đổi `actionType` thành enum `ActionType`. TypeScript vẫn so sánh được, nhưng kiểu so sánh với string literal cần kiểm tra. |

### 2.5. `User.name` (String) → bị tách thành `firstName` + `lastName`

| Vị trí | Code hiện tại | MSEW yêu cầu |
|---|---|---|
| `src/lib/auth.ts:22` | `return { ..., name: user.name, email, role }` | `user.name` không còn; phải `firstName + ' ' + (lastName ?? '')` |
| `src/app/assets/page.tsx:102,104` | `asset.assignedTo.name.charAt(0)`, `asset.assignedTo.name` | Tương tự — phải dùng `assignedUser.firstName` |
| `prisma/seed.ts` (cũ) và các `prisma.user.create(...)` chỗ khác | `name: 'Admin IT'`, `name: 'Nguyễn Văn Nhân Viên'` | Field `name` bị xóa; seed mới dùng `firstName`/`lastName` |

### 2.6. `User.role` (String) → đổi sang enum `Role`

| Vị trí | Code hiện tại | MSEW yêu cầu |
|---|---|---|
| `src/lib/auth.ts:22` | `user.role` đang inferred `string` | Giờ là enum `Role` (ADMIN/EMPLOYEE). Vẫn gán vào `token.role` OK, nhưng kiểu token thay đổi. |
| `src/app/actions/asset.ts:23,44,64` | `userId: 'system'` (string) | Schema mới: `ActionLog.userId` là **FK Restrict** tới `User.id`. Cho chuỗi `'system'` không hợp lệ với FK (Prisma sẽ throw lúc tạo log). |

### 2.7. `License.seatsTotal` (Int) → bị xóa

| Vị trí | Code hiện tại | MSEW yêu cầu |
|---|---|---|
| `src/app/actions/license.ts:6` | `createLicense({ ..., seatsTotal: number })` | Field `seatsTotal` không còn; schema mới dùng `seats LicenseSeat[]` (1-N) |
| `src/app/licenses/page.tsx:80` | `{lic.seatsTotal}` | Đọc `lic.seats.length` thay thế |

### 2.8. `ActionLog.userId` từ String thành FK Restrict

| Vị trí | Code hiện tại | MSEW yêu cầu |
|---|---|---|
| `src/app/actions/asset.ts:23,44,64` | `userId: 'system'` (literal string) | FK Restrict tới `User.id`. Nếu không tồn tại User `system`, INSERT sẽ FAIL. |
| `src/app/actions/license.ts:14` | `userId: 'system'` | Tương tự |

### 2.9. `db push --force-reset` chạy trên Neon (production-like DB)

Lệnh này sẽ **DROP TOÀN BỘ DATA** trong database Neon. Tôi chưa thấy trong PLAN-MSEW đoạn xác nhận "data cũ OK mất". Sếp đã tick `[ ]` ở mục "OK vì data cũ là demo", nhưng tôi vẫn cần xác nhận lại lần cuối **trước khi chạy lệnh reset DB thật**.

---

## 3. Đánh giá mức độ theo rule TIER2

Theo `TIER2_PROMPT.md`:

> **Đặc quyền Pre-Audit** ... Nếu phát hiện lỗ hổng logic, xung đột dữ liệu, hoặc kiến trúc không khả thi, **BẠN CÓ QUYỀN TỪ CHỐI CODE**. Hãy lập tức xuất ra file `AUDIT-REPORT.md`.

Tôi đánh giá đây **KHÔNG phải lỗ hổng nhỏ** mà là:
1. **MSEW thiếu 1 task phụ bắt buộc**: trước/sau khi đổi schema, Tier 2 phải đồng thời refactor ít nhất 7 file `src/` đang consumer. Hiện PLAN-MSEW **không có bước nào** trong section 3 động chạm đến UI/Action.
2. **Tiêu chí nghiệm thu #7 (`tsc --noEmit` PASS)** là không khả thi nếu tôi chỉ làm theo MSEW.
3. **MSEW không có kế hoạch cho `db push` an toàn trên Neon serverless** — chỉ giả định DB local.
4. **Schema mới dùng 3 FK nullable (`assignedUserId`/`assignedLocationId`/`assignedAssetId`)**, nhưng code hiện tại (`pages/page.tsx`, `assets/page.tsx`, `actions/asset.ts`) chỉ biết đến 1 FK (`assignedToId`). Nếu không refactor, các page sẽ hiển thị sai "Người/Vị trí giữ" cho mọi asset.

---

## 4. Đề xuất hướng xử lý cho Tier 1

### Đề xuất A — **Mở rộng phạm vi Epic A** (Khuyến nghị)

Thêm 1 bước **BƯỚC 2.5: Adapter patch các file consumer trong `src/`** vào `MSEW-epic-A-schema.md`, tối thiểu:

| File | Cần làm |
|---|---|
| `src/app/actions/asset.ts` | Đổi `assignedToId` → `assignedUserId`; bỏ `model/categoryId` trong create signature (chuyển xuống AssetModel) |
| `src/app/actions/license.ts` | Bỏ `seatsTotal`; create nested `seats: { create: [...] }` |
| `src/app/assets/page.tsx` | Đổi `assignedTo` → `assignedUser`; bỏ `getStatusColor(type)` đổi sang check `deployable/pending/archived`; UI fallback nếu `firstName/lastName` |
| `src/app/assets/new/page.tsx` | Bỏ input `name="model"`; thêm dropdown `modelId`; sửa `s.type === ...` → `s.deployable/pending` |
| `src/app/licenses/page.tsx` | `lic.seatsTotal` → `lic.seats?.length ?? 0` |
| `src/lib/auth.ts` | `user.name` → `firstName + lastName` |
| `src/app/page.tsx` | Tạo User placeholder id `'system'` thật (hoặc dùng admin.userId từ session) trước khi insert log |

→ Sau đó sinh MSEW bổ sung `MSEW-epic-A-schema-step2_5.md` (hoặc viết thêm trong file hiện tại) để Tier 2 đọc.

### Đề xuất B — **Tách nhỏ Epic A**

Tách 2 sub-epic:
- **Epic A1**: rewrite `schema.prisma` + `seed.ts` + CHECK constraint + migration. KHÔNG đụng `src/`. Tiêu chí: `npx prisma validate`, `npx prisma db push` PASS. KHÔNG yêu cầu `tsc --noEmit` PASS.
- **Epic A2 (Patcher)**: refactor 7 file `src/` để khớp schema mới. Tiêu chí: `tsc --noEmit` PASS + chạy thử trang `/assets`, `/licenses`, `/` không crash.

### Đề xuất C — Tôi được phép tự patch src/ theo mức tối thiểu

Nếu sếp muốn tiến nhanh, cấp cho tôi lệnh: "Tier 2 tự patch 7 file consumer ở mức nhỏ nhất để `tsc` PASS". Tôi sẽ ghi `MSEW-epic-A-schema-patch.md` tự sinh (theo rule Pre-Audit) và thi công. NHƯNG đây không khớp với rule "Tier 2 KHÔNG sửa UI/Action" trong PLAN-MSEW hiện tại.

---

## 5. Câu hỏi cần Tier 1 trả lời dứt điểm

Vui lòng tick dứt điểm từng câu dưới đây trước khi tôi tiếp tục:

- [ ] **Q1**: Sếp chọn Đề xuất A, B, hay C? (Tôi recommend **B** — tách Epic A2 để dễ review.)
- [ ] **Q2**: Chạy `npx prisma db push --force-reset --accept-data-loss` trên Neon DB — **OK chứ?** Sếp xác nhận data cũ không còn giá trị.
- [ ] **Q3**: Có được cài `bcryptjs` + `@types/bcryptjs` không, hay dùng module khác (vd `argon2`)?
- [ ] **Q4**: Khi MSEW Tier 2 chạy `createAsset` etc. sau khi schema đổi, có cần sinh thêm 1 User placeholder `id='system'` để pass FK ActionLog.userId hay chuyển sang nullable? Tôi recommend **null + onDelete: SetNull** nhưng cần sếp duyệt (sẽ phá logic hiện tại của dashboard).

---

## 6. Trạng thái Tier 2

⏸ **ĐÃ DỪNG.** Chưa hề động chạm tới bất kỳ file nào. Đợi sếp + Tầng 1 phản hồi AUDIT-REPORT này.

Không có gì phải fix theo luật thoát hiểm 3 lần — đây là dừng có chủ đích.
