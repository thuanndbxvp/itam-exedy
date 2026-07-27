# BẢN VẼ TỔNG QUAN: HỌC HỎI TỪ SNIPE-IT (Snipe-IT → IT-Management)

**Ngày:** 2026-07-25
**Planner:** Tier 1 (Kiến trúc sư)
**Mục tiêu:** Lập bản vẽ tổng quan để đội ngũ phát triển **D:\IT-management** (Next.js 16 + Prisma + Postgres + Tailwind v4) **học hỏi/clone các tính năng** từ **C:\laragon\www\snipeit** (Laravel 12 + PHP 8.2 + AdminLTE 2) mà **không phụ thuộc code PHP**, mà chỉ clone **LOGIC NGHIỆP VỤ**.

> **Tinh thần chỉ đạo:**
> - Không clone cú pháp Laravel → Node.js. Chỉ clone **invariant nghiệp vụ** (luật sống còn, state machine, workflow).
> - Tận dụng lợi thế của Next.js (Server Actions, App Router, RSC, type-safety end-to-end) để implement **gọn hơn** Snipe-IT.
> - Tránh "over-engineering": chỉ clone những gì app 100-500 nhân sự **thực sự cần** (bỏ qua LDAP, SAML, Multi-Company ở MVP).

---

## 1. Tổng quan tình hình hai codebase

### 1.1 `D:\IT-management` (app Next.js hiện tại — MVP)

| Hạng mục | Hiện trạng |
|---|---|
| **Stack** | Next.js 16.2 + React 19 + TypeScript 5 + Tailwind v4 + Prisma 7 + PostgreSQL + NextAuth.js 4 |
| **Database schema (Prisma)** | 5 model: `User`, `StatusLabel`, `Asset`, `License`, `LicenseSeat`, `ActionLog` |
| **Auth** | NextAuth CredentialsProvider, email-only, **không kiểm tra password** (hardcoded TODO) |
| **UI** | Tailwind + Lucide icons; sidebar + header + dashboard; table list Assets/Licenses; form "create" cho từng |
| **CRUD hiện có** | `createAsset`, `checkoutAsset`, `checkinAsset`, `createLicense` — toàn bộ gán `userId: 'system'` |
| **Trang** | `/`, `/login`, `/assets`, `/assets/new`, `/licenses`, `/licenses/new` |
| **Điểm yếu nghiêm trọng** | (a) Assignment dùng 1 FK `assignedToId` thẳng → **sai nghiệp vụ** (không phân biệt user/location/asset); (b) `Category` không có model riêng, hardcode 4 option trong `<select>`; (c) không có `Location`/`Department`; (d) `ActionLog.userId` là string thay vì FK; (e) `Asset.notes`/`notes`/`orderNumber`/`purchaseDate`/`purchaseCost`/`warrantyMonths`/`expectedCheckin`/`nextAuditDate`/`image` đều **thiếu**; (f) license chỉ có `seatsTotal` count, chưa có bảng `LicenseSeat` với FK chi tiết; (g) `checkout`/`checkin` không validate state; (h) "category" là string `"laptop"` thay vì FK; (i) middleware `authorized: () => true` (bypass auth); (j) UI không có dashboard theo role, không có audit, không có report, không có bulk action |

### 1.2 `C:\laragon\www\snipeit` (Snipe-IT — codebase nguồn để học)

| Hạng mục | Quy mô |
|---|---|
| **Models** | 60+ Eloquent model |
| **Controllers** | 80+ controller (chia theo entity) |
| **Routes API** | 200+ endpoint tại `/api/v1/*` (OAuth2 qua Passport) |
| **Routes Web** | 400+ route (resource + custom) |
| **Migration** | 200+ migration, kế thừa 10 năm |
| **Language files** | 82 file/ngôn ngữ (đã việt hóa sang `vi-VN`) |
| **Notification classes** | 25 class (Slack/Teams/Google Chat/Markdown mail) |
| **Cron commands** | 6 alert commands |
| **Reports** | 15 method trong ReportsController + Custom Report builder |
| **Permissions** | 36+ permission key, hierarchical policy (`SnipePermissionsPolicy` + `CheckoutablePermissionsPolicy`) |

### 1.3 So sánh "gap" cần lấp

| Domain | IT-Management MVP | Snipe-IT (target để clone) | Mức độ ưu tiên |
|---|---|---|---|
| **Auth** | Email only, no password | Credentials + LDAP + SAML + 2FA + OAuth2 | Cơ bản: thêm password; bỏ LDAP/SAML/2FA (giai đoạn 1) |
| **Asset model** | 8 field, 1 FK assign | 30+ field, polymorphic assign, custom fields | **P0** |
| **Status label** | 3 hardcoded seed | Dynamic + 4 meta-type (pending/deployable/undeployable/archived) | **P0** |
| **Category** | String enum | Model riêng + EULA + require_acceptance | **P1** |
| **Location** | Thiếu | Tree parent/children + manager + company | **P1** |
| **Department** | Thiếu | Manager + unique trong company | **P2** |
| **Manufacturer** | Thiếu | Model + URL + support contact | **P2** |
| **AssetModel** | Thiếu | Template (category + manufacturer + depreciation + custom fields) | **P1** |
| **License model** | Chỉ tên + seats count | License + N LicenseSeat rows + reassignable + expiration | **P0** |
| **ActionLog** | string `userId`, no old/new diff | Polymorphic + old_values/new_values + IP/UA | **P0** |
| **Checkout/Checkin** | Gán thẳng, không validate | Domain command + transaction + side effects | **P0** |
| **Bulk actions** | Không có | Bulk checkout/checkin/edit/delete/restore | **P3** |
| **Reports** | Dashboard mini | 15 report + Custom Report builder | **P3** |
| **Settings** | Không có | Singleton + cache + 200 setting field | **P2** |
| **Alerts/Cron** | Không có | 6 cron command + email + Slack/Teams | **P4** |
| **Labels/QR** | Không có | Template pattern + TCPDF | **P4** |
| **Audit workflow** | Không có | next_audit_date + audit form | **P2** |
| **EULA Acceptance** | Không có | Polymorphic CheckoutAcceptance + PDF + signature | **P4** |
| **Kits** | Không có | PredefinedKit + auto checkout | **P4** |
| **Maintenance** | Khế có | Maintenance + cost + duration | **P4** |
| **Import/Export CSV** | Không có | Streaming + formula injection guard | **P3** |
| **Accessories/Consumables/Components** | Không có | 3 entity + quantity tracking | **P3** |
| **Multi-Company (FMCS)** | Không có | Tenant boundary qua global scope | **P4** |

---

## 2. Nguyên tắc kế thừa (Heritage Principles)

Tôi đúc kết **8 invariant nghiệp vụ** từ Snipe-IT mà IT-Management BẮT BUỘC phải clone — bất kể implementation language. Đây là "di sản nghiệp vụ" giá trị nhất:

### Invariant #1 — Status label là dữ liệu cấu hình, không phải enum cứng

**Snipe-IT**: status labels là row trong bảng `status_labels` với 3 cờ `deployable`, `pending`, `archived`. Meta-type suy ra: `PENDING | DEPLOYABLE | UNDEPLOYABLE | ARCHIVED`. Broken/Lost chỉ là 2 label mẫu thuộc `UNDEPLOYABLE`, admin có thể tạo label mới (vd: "Đang sửa chữa", "Thanh lý").

**Clone cho IT-Management**: thay vì enum `DEPLOYABLE | DEPLOYED | BROKEN`, dùng bảng `StatusLabel` với cờ. **DEPLOYED là derived state** = `assignedTo IS NOT NULL`.

### Invariant #2 — Assignment là domain command, không phải CRUD field

**Snipe-IT**: `Asset.assigned_to` + `assigned_type` (polymorphic) — User/Location/Asset. **KHÔNG BAO GIỜ** gán thẳng bằng PATCH. Phải qua `Asset::checkOut()` → validate → set fields → fire event `CheckoutableCheckedOut` → ghi `Actionlog` → tăng counter.

**Clone cho IT-Management**: Tạo domain command riêng (`checkoutAsset`, `checkinAsset`) đặt trong `src/app/actions/`. **Cấm** cho user gọi `prisma.asset.update({data:{assignedToId}})` trực tiếp. Middleware/guard kiểm tra.

### Invariant #3 — Phân biệt RTD location và current location

**Snipe-IT**: `Asset.rtd_location_id` (nơi asset quay về sau checkin) vs `Asset.location_id` (vị trí hiện tại). Checkout cập nhật current; checkin thường reset về RTD.

**Clone cho IT-Management**: Schema có cả 2 trường. UI cho admin chọn RTD lúc tạo asset; checkin tự động `locationId = rtdLocationId`.

### Invariant #4 — License = 1 product + N seat rows

**Snipe-IT**: `licenses` (1 row/product) ↔ `license_seats` (N row). Seat gán cho `User` HOẶC `Asset`. Khi tăng seats → insert N row; khi giảm seats → chỉ delete seat rảnh (không được delete seat đang gán). Seat có flag `unreassignable_seat=true` sau checkin license `reassignable=false`.

**Clone cho IT-Management**: Tách 2 bảng. Seed tự sinh N row `LicenseSeat` qua Prisma `$transaction` trong `static::created` hook (Prisma middleware hoặc application code).

### Invariant #5 — ActionLog bất biến + polymorphic + diff

**Snipe-IT**: `action_logs` có `item_type` + `item_id` (morphTo) + `target_type` + `target_id` (morphTo) + `action_type` + `user_id` (actor) + `note` + `signature_filename` + IP/UA + `old_values`/`new_values` (JSON).

**Clone cho IT-Management**: Schema `ActionLog` phải có cả `itemId` + `itemType`, **CẤM DELETE/UPDATE ActionLog row** ở application layer.

### Invariant #6 — Mọi action phải qua transaction + lockForUpdate cho race condition

**Snipe-IT**: `License::freeSeat(lock: true)` → `SELECT ... FOR UPDATE`. Cùng lúc 2 admin checkout cùng license → chỉ 1 thắng.

**Clone cho IT-Management**: Dùng Prisma `$transaction` với isolation level `Serializable` cho mọi checkout/checkin/audit. Prisma 7 chưa support raw `SELECT FOR UPDATE` qua ORM, dùng `prisma.$queryRaw` hoặc `pg_advisory_xact_lock`.

### Invariant #7 — Capabilities trả từ backend, frontend chỉ hiển thị

**Snipe-IT**: `AssetsTransformer` trả `available_actions: ['checkout', 'checkin', 'edit', ...]`. Frontend dùng để ẩn/hiện button, nhưng **backend authorize lại** trong policy trước khi thực thi.

**Clone cho IT-Management**: Trong Next.js, trả object `capabilities` từ server component, kiểm tra ở client component. **Cả client component nút Sửa đều phải check session thật**.

### Invariant #8 — Custom field per AssetModel, không phải metadata tùy ý

**Snipe-IT**: `AssetModel.fieldset_id` → `custom_fields` (def) + `custom_field_values` (value per asset). Có thể đánh dấu "display at checkout/checkin/audit", encrypt, default value.

**Clone cho IT-Management**: Bỏ qua giai đoạn 1 (100-500 nhân sự chưa cần). Phase 4.

---

## 3. Lộ trình Phase (đã điều chỉnh so với `BRAINSTORM-ARCHITECTURE.md`)

Phase dưới đây **THAY THẾ** lộ trình cũ trong `BRAINSTORM-ARCHITECTURE.md` (chỉ giữ Phase 1 = MVP, các phase sau mở rộng theo Snipe-IT).

### 📍 Phase 1: Core MVP+ (Hoàn thiện Asset & License đúng nghiệp vụ) — **ƯU TIÊN HIỆN TẠI**

**Mục tiêu**: Khắc phục 10 điểm yếu nghiêm trọng đã nêu ở §1.1 + clone 5 invariant quan trọng nhất (#1, #2, #4, #5, #6).

**Phạm vi**:
- **Mở rộng Prisma schema**:
  - `Asset`: thêm `notes`, `orderNumber`, `purchaseDate`, `purchaseCost`, `warrantyMonths`, `expectedCheckin`, `nextAuditDate`, `lastAuditDate`, `lastCheckout`, `lastCheckin`, `requestable`, `image`, `rtdLocationId`, `checkoutCounter`, `checkinCounter`
  - `Asset`: tách assignment thành `assignedUserId` + `assignedLocationId` + `assignedAssetId` (chỉ 1 trong 3 được non-null tại một thời điểm — dùng DB constraint)
  - `AssetModel` (model mới): `categoryId`, `manufacturerId`, `depreciationId`, `modelNumber`, `requireSerial`, `eol` (months)
  - `Category` (model mới): `name`, `categoryType` (ASSET/LICENSE/...), `eulaText`, `requireAcceptance`, `checkinEmail`, `color`
  - `Location` (model mới): `name`, `address`, `city`, `country`, `parentId` (tree), `managerId`, `companyId`
  - `Department` (model mới): `name`, `managerId`, `companyId`
  - `Manufacturer`, `Supplier`, `Depreciation`: tối thiểu CRUD
  - `StatusLabel`: thêm cờ `deployable`, `pending`, `archived`
  - `License`: thêm `productKey`, `seats`, `expirationDate`, `terminationDate`, `reassignable`, `maintained`, `categoryId`, `manufacturerId`, `supplierId`, `purchaseDate`, `purchaseCost`, `orderNumber`, `notes`
  - `LicenseSeat`: model mới (`licenseId`, `assignedUserId?`, `assignedAssetId?`, `notes`, `unreassignableSeat`)
  - `ActionLog`: thêm `itemType`, `targetType`, `targetId`, `oldValues` (Json), `newValues` (Json), `ipAddress`, `userAgent`. Đổi `userId` từ String → FK.
- **Auth cứng lại**:
  - Thêm password field vào `User` (bcrypt qua `bcryptjs`).
  - Thay middleware `authorized: () => true` → kiểm tra session thật.
  - Role-based: `ADMIN | EMPLOYEE`.
- **Server Actions viết lại**:
  - `checkoutAsset(assetId, targetUserId | targetLocationId | targetAssetId, options)` → transaction + validate status `deployable` + `availableForCheckout` + update `assignedToXxx` + clear các field khác + ghi `ActionLog` (actionType=CHECKOUT, oldValues + newValues).
  - `checkinAsset(assetId, options)` → clear `assignedXxx` + reset location về `rtdLocationId` + ghi `ActionLog`.
  - `checkoutLicenseSeat(licenseId, seatId?, targetUserId | targetAssetId)` → transaction + lock seat + check `freeSeat` + FMCS guard (skip nếu chưa bật company) + ghi `ActionLog`.
  - `checkinLicenseSeat(seatId)` → clear assignment + set `unreassignableSeat` nếu license không reassignable.
  - `bulkCheckoutAssets(ids, targetUserId)`, `bulkDeleteAssets(ids)` (chỉ xóa khi `assignedToXxx IS NULL`).
- **UI**:
  - Trang `/assets/[id]` (show) hiển thị: tabs **Details**, **History** (action log), **Files** (mock), **Edit** / **Checkin** / **Clone** / **Delete** (với capability check từ server).
  - Trang `/licenses/[id]` (show) hiển thị: tabs **Seats** (assigned + available), **History**.
  - Form checkout/checkin với note bắt buộc nếu `requireCheckoutNotes`.
  - Search/filter/sort trong bảng asset + license.
- **Master data CRUD**:
  - Categories (`/categories`), Locations (`/locations`), Departments (`/departments`), Status Labels (`/status-labels`), Asset Models (`/asset-models`).
- **Seed mở rộng**: thêm `Location: "Văn phòng HN"`, `Department: "IT"`, `AssetModel: "MacBook Pro M2"`, `Category: "Laptop"`, v.v.

**Tiêu chí nghiệm thu** (Acceptance):
- [ ] Không thể checkout asset có status `undeployable` (Broken).
- [ ] Checkin asset tự động `locationId = rtdLocationId`.
- [ ] Tăng license `seats` từ 5 → 7 tự động insert 2 row `LicenseSeat`.
- [ ] Giảm license `seats` từ 7 → 5 mà đang có 6 seat gán → save fail với message rõ ràng.
- [ ] Checkout license seat 2 cùng lúc từ 2 tab khác nhau → chỉ 1 thắng (transaction test).
- [ ] Asset delete bị chặn nếu đang assigned; phải checkin trước.
- [ ] `ActionLog` ghi old + new values mỗi lần checkout.
- [ ] Audit trail tại `/assets/[id]` show đầy đủ lịch sử create/checkout/checkin.

### 📍 Phase 2: Asset Catalog & Finance (clone AssetModel, Manufacturer, Depreciation)

**Mục tiêu**: Quản lý catalog chuẩn + khấu hao + EOL.

- **Schema**: đầy đủ `AssetModel` (fieldset, EOL, default category, depreciation).
- **Depreciation engine**: tính `book_value = purchase_cost - (purchase_cost / months * months_elapsed)`.
- **Warranty expiration** = `purchaseDate + warrantyMonths`.
- **EOL** = `purchaseDate + AssetModel.eol months` (override bằng `asset.eolExplicit`).
- **UI**:
  - `/asset-models/[id]` show số lượng available/assigned/archived.
  - `/reports/depreciation` dạng bảng (asset × book value).
  - Filter `?eol_within=30` ở `/assets` → warning badge cho asset sắp hết EOL.

**Acceptance**:
- [ ] `/reports/depreciation` show tổng nguyên giá, tổng khấu hao lũy kế, giá trị còn lại.
- [ ] Asset có `purchaseDate + warrantyMonths` hiển thị `warrantyExpires` tự động.

### 📍 Phase 3: Accessories, Consumables, Components, Bulk Actions

**Mục tiêu**: Quản lý vật tư + thao tác hàng loạt.

- **3 entity mới**: `Accessory` (số lượng + checkout/checkin), `Consumable` (xuất là mất), `Component` (gắn vào asset qua pivot `components_assets` với `quantity`).
- **Inventory alert**: cron kiểm tra `remaining < min_amt` → gửi email.
- **Bulk actions** tại `/assets`:
  - Bulk edit (model, status, location, warranty, notes)
  - Bulk delete (chỉ khi không assigned)
  - Bulk checkout (1 user, nhiều asset)
  - Bulk restore (asset soft-deleted)
  - Bulk label print (sinh QR PDF — dùng `qrcode` npm + `pdfkit` hoặc `jsPDF`)
- **Import/Export CSV**:
  - Streaming qua `route handler` của Next.js + `PapaParse` (client-side preview) hoặc `csv-parse` (server).
  - Formula injection guard: thêm `'` trước `=+-@`.

**Acceptance**:
- [ ] Bulk delete 10 asset đang assigned → từ chối + liệt kê tag bị loại.
- [ ] Import 100 asset từ CSV → preview 5 dòng đầu trước khi commit.
- [ ] Xuất CSV `/assets` có 1000 row → download không OOM (streaming).

### 📍 Phase 4: Advanced (Audit, Maintenance, Reports, Kits, EULA, Alerts)

**Mục tiêu**: Workflow nghiệp vụ nâng cao + multi-channel.

- **Audit workflow**: `lastAuditDate`, `nextAuditDate`, scan form `/assets/audit?tag=LAP-001`.
- **Maintenance**: `Maintenance` model + cost + supplier + duration + complete log.
- **Custom Report builder**: chọn cột + filter + export CSV streaming.
- **Predefined Kits**: 1 kit = N (asset models + license seats + accessories + consumables); checkout kit → tạo instance asset cho mỗi model + assign tất cả.
- **EULA Acceptance**: polymorphic `CheckoutAcceptance`; checkout asset từ category có `requireAcceptance=true` → tạo pending acceptance; user nhận email → ký tên → set `acceptedAt`.
- **Email + Slack/Teams notifications**: dùng `nodemailer` + `axios` webhook; notification class pattern.
- **Cron alerts**: 6 command tương tự Snipe-IT (low inventory, expiring warranty, expiring license, audit due, expected checkin, acceptance reminder).

**Acceptance**:
- [ ] Audit `/assets?audit=due` hiển thị asset sắp đến hạn kiểm kê.
- [ ] Checkout kit "Developer" → tự động tạo 1 Laptop + 1 Phone + assign 1 Adobe seat.
- [ ] Cron `low-inventory-alerts` gửi email khi `remaining < min_amt`.

### 📍 Phase 5: Enterprise (Multi-Company, LDAP/SAML, 2FA, Mobile API)

**Mục tiêu**: Mở rộng cho tập đoàn đa công ty + SSO + mobile app.

- **FMCS**: thêm `Company` model + `CompanyUser` pivot + global Prisma middleware filter theo `companyId`.
- **LDAP/SCIM**: import user + auto-assign license qua LDAP group.
- **2FA**: TOTP qua `otplib` + QR enrollment.
- **OAuth2 API** cho mobile app: dùng `next-auth` + `oauth2-server` hoặc custom JWT.

---

## 4. Kế hoạch triển khai Phase 1 (chi tiết)

### 4.1 Phân rã công việc (Work Breakdown Structure)

```
Phase 1 (MVP+)
├── Epic A: Schema nền tảng (1 ngày)
│   ├── A1: Mở rộng Asset model theo Invariant #2
│   ├── A2: Tạo AssetModel, Category, Location, Department, Manufacturer, Supplier, Depreciation
│   ├── A3: Tách License → License + LicenseSeat theo Invariant #4
│   └── A4: Mở rộng ActionLog theo Invariant #5
│
├── Epic B: Domain commands (2 ngày)
│   ├── B1: checkoutAsset/checkinAsset theo Invariant #2 + #6
│   ├── B2: checkoutLicenseSeat/checkinLicenseSeat theo Invariant #4 + #6
│   ├── B3: bulkCheckoutAssets + bulkDeleteAssets
│   └── B4: createAsset / updateAsset có validate status + custom field
│
├── Epic C: Auth & authorization (1 ngày)
│   ├── C1: Thêm password (bcrypt) cho User
│   ├── C2: Middleware kiểm tra session thật (bypass)
│   └── C3: Capabilities trả từ server component (Invariant #7)
│
├── Epic D: UI Asset/License (2 ngày)
│   ├── D1: Trang show asset (`/assets/[id]`) với tabs Details/History
│   ├── D2: Trang show license (`/licenses/[id]`) với seats tabs
│   ├── D3: Form checkout/checkin với note
│   └── D4: Search/filter/sort table
│
├── Epic E: Master data CRUD (1.5 ngày)
│   ├── E1: Categories / Locations / Departments CRUD
│   ├── E2: StatusLabels / AssetModels CRUD
│   └── E3: Manufacturers / Suppliers / Depreciations CRUD
│
└── Epic F: Seed + verify (0.5 ngày)
    ├── F1: Mở rộng seed (Location, Department, AssetModel, Category)
    └── F2: Acceptance test thủ công theo checklist Phase 1
```

**Tổng effort**: ~8 ngày làm việc (1 người fulltime) hoặc ~3 sprint nếu 2 người.

### 4.2 Tech stack bổ sung cho Phase 1

| Thư viện | Mục đích | Lý do |
|---|---|---|
| `bcryptjs` | Hash password cho NextAuth Credentials | Không cần native binding như `bcrypt` |
| `zod` | Validate form input (Server Action) | Type-safe runtime check, kết hợp được với TypeScript |
| `react-hook-form` + `@hookform/resolvers` | Form management | Giảm boilerplate so với raw useState |
| `@tanstack/react-table` | Table có sort/filter/pagination client-side | Đã đề cập trong BRAINSTORM |
| `@tanstack/react-query` | Server state cache, optimistic update | Đã đề cập trong BRAINSTORM |
| `date-fns` | Format ngày theo locale | Lightweight hơn moment |

**Không cần thêm** cho Phase 1: charting library, PDF library, barcode library — để dành cho Phase 2+.

### 4.3 Cấu trúc file mục tiêu sau Phase 1

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                 # sidebar + header + middleware check
│   │   ├── page.tsx                   # dashboard
│   │   ├── assets/
│   │   │   ├── page.tsx               # list (table)
│   │   │   ├── new/page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx           # show
│   │   │   │   ├── edit/page.tsx
│   │   │   │   ├── checkout/page.tsx
│   │   │   │   └── history/page.tsx
│   │   │   └── bulk/page.tsx          # bulk action dispatcher
│   │   ├── licenses/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── edit/page.tsx
│   │   │       └── checkout/[seatId?]/page.tsx
│   │   ├── users/
│   │   ├── categories/
│   │   ├── locations/
│   │   ├── departments/
│   │   ├── status-labels/
│   │   ├── asset-models/
│   │   ├── manufacturers/
│   │   └── suppliers/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── webhooks/                   # dành cho Phase 4
│   └── actions/
│       ├── asset.ts                    # createAsset, updateAsset, checkoutAsset, checkinAsset
│       ├── license.ts                  # createLicense, checkoutLicenseSeat
│       ├── license-seat.ts             # checkinLicenseSeat
│       ├── bulk-asset.ts               # bulkCheckoutAssets, bulkDeleteAssets
│       ├── user.ts                     # createUser, updateUser, deleteUser
│       ├── master-data.ts              # generic CRUD cho category/location/...
│       └── _lib/
│           ├── prisma-transaction.ts   # helper wrap $transaction với retry
│           ├── audit-log.ts            # writeActionLog helper
│           ├── validation.ts           # zod schemas
│           └── policy.ts               # capability check
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── session.ts                      # getCurrentUser thật
│   └── capabilities.ts                 # getUserCapabilities(userId, itemType, itemId)
├── components/
│   ├── shell/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── ui/                             # shadcn-style primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── badge.tsx
│   │   └── dialog.tsx
│   └── forms/
│       ├── AssetForm.tsx
│       ├── CheckoutForm.tsx
│       └── ...
└── types/
    ├── next-auth.d.ts
    └── domain.ts                       # AssetStatus enum, ActionType enum, etc.
```

### 4.4 Những file KHÔNG cần tạo ở Phase 1 (delay sang Phase sau)

- `src/lib/labels.ts` (PDF generation)
- `src/lib/ldap.ts`, `src/lib/saml.ts` (SSO)
- `src/lib/two-factor.ts` (TOTP)
- `src/app/api/v1/*` (REST API cho mobile) — Phase 5
- `src/app/maintenance/`, `src/app/components/`, `src/app/accessories/`, `src/app/consumables/` — Phase 3
- `src/app/kits/`, `src/app/reports/custom` — Phase 4
- `src/app/settings/branding` — Phase 2

---

## 5. Đối chiếu với quy tắc TIER 1 (Planner)

### 5.1 Tuân thủ hệ thống 2 tầng

- File này là **PLAN tổng quan**, KHÔNG đi vào chi tiết code. Mỗi Epic A-F sẽ có file `PLAN-<epic>.md` + `MSEW-<epic>.md` riêng.
- TIER 2 (Coder) **không được đọc trực tiếp file này** — chỉ đọc `MSEW-<epic>.md` tương ứng sau khi Planner duyệt.
- TIER 3 (Auditor) đọc `docs/DOMAIN-KNOWLEDGE.md` + file này để verify logic.

### 5.2 Không viết code trong file này

Đúng theo rule "Tuyệt đối không tự viết code trực tiếp vào file source code". File này chỉ chứa markdown bản vẽ.

### 5.3 Câu hỏi cần sếp chốt trước khi xuất MSEW Epic A

Trước khi Tier 2 bắt đầu Epic A (schema), tôi cần sếp quyết 4 câu hỏi:

1. **Asset assignment**: dùng **polymorphic** (`assignedToId` + `assignedToType`) hay **3 nullable FK** (`assignedUserId` + `assignedLocationId` + `assignedAssetId`)?
   - Polymorphic: gần Snipe-IT, schema gọn, query phức tạp hơn.
   - 3 FK: query đơn giản, validation dễ, có thể DB constraint đảm bảo chỉ 1 trong 3 non-null.
   - **Khuyến nghị**: 3 FK (cleaner cho Postgres + Prisma relation).

2. **Soft-delete**: dùng `deletedAt` (Prisma middleware) hay hard-delete?
   - Snipe-IT dùng soft-delete cho asset/user.
   - **Khuyến nghị**: soft-delete (giữ lịch sử audit đầy đủ).

3. **Custom field**: có cần implement ở Phase 1 không?
   - Snipe-IT có custom field per AssetModel.
   - Với 100-500 nhân sự, có thể hardcode trong form trước.
   - **Khuyến nghị**: DEFER sang Phase 4 (Custom Report builder).

4. **Multi-Company (FMCS)**: có cần ở Phase 1 không?
   - Snipe-IT mặc định bật FMCS = off.
   - **Khuyến nghị**: tạo model `Company` + `CompanyUser` pivot ngay từ Phase 1 (rất khó retrofit), nhưng **disable FMCS** (mọi query coi như 1 tenant).

### 5.4 Lệnh cho Tier 2 (sau khi sếp duyệt 4 câu trên)

Sếp copy lệnh này thả vào Terminal cho Tier 2 nó cày Epic A (sau khi tôi xuất `MSEW-epic-A-schema.md`):

```bash
/code epic-A-schema
```

---

## 6. Rủi ro & giảm thiểu

| # | Rủi ro | Xác suất | Tác động | Giảm thiểu |
|---|---|---|---|---|
| R1 | **Refactor schema** phá vỡ code hiện có | Cao | Cao | Backup branch trước khi bắt đầu Epic A; viết migration script |
| R2 | **Performance** khi eager-load nhiều relation | Trung bình | Trung bình | Prisma 7 hỗ trợ `include` lồng nhau — đo bằng console.time ở dev |
| R3 | **LockForUpdate** không hoạt động đúng qua Prisma | Trung bình | Cao | Dùng `prisma.$transaction` với isolation level `Serializable` (Prisma 7 hỗ trợ) |
| R4 | **Time zone bug** (Date vs DateTime Prisma) | Cao | Thấp | Quy ước: mọi date lưu UTC; hiển thị theo `Intl.DateTimeFormat` locale user |
| R5 | **i18n Việt** cho các thông báo lỗi | Thấp | Thấp | Snipe-IT đã việt hóa xong (82 file), copy pattern từ đó |
| R6 | **Custom field ảnh hưởng schema** | Thấp | Trung bình | DEFER sang Phase 4; form cứng trước |

---

## 7. Kết luận

**IT-Management hiện tại** chỉ là **MVP skeleton** (chưa phải MVP sản phẩm). Snipe-IT cung cấp **bản đồ đường đi rõ ràng** để nâng cấp:

- 5/8 invariant đã clone ngay ở **Phase 1** (8 ngày).
- 2/8 invariant tiếp theo ở **Phase 2-3** (5 ngày).
- 1/8 invariant cuối (custom field) defer **Phase 4**.

**Không cần clone y nguyên code Laravel.** Chỉ cần clone:
- 8 invariant nghiệp vụ (đã liệt kê).
- Workflow chính (checkout/checkin/audit/EOL).
- Tư duy "derived state" (DEPLOYED/RTD) thay vì enum cứng.
- ActionLog bất biến + polymorphic.
- Capability pattern (backend trả quyền, frontend hiển thị).

Sau Phase 1, app sẽ đạt **~60% tính năng** của Snipe-IT bản community, đủ dùng cho 100-500 nhân sự nội bộ.

---

**Câu hỏi chốt cho sếp trước khi xuất MSEW Epic A:**
1. Asset assignment: **3 nullable FK** (khuyến nghị) hay **polymorphic**?
2. Soft-delete: **bật** (khuyến nghị) hay hard-delete?
3. Custom field: **DEFER Phase 4** (khuyến nghị) hay implement Phase 1?
4. Multi-Company: **model + disable** (khuyến nghị) hay bỏ qua hẳn?

Sau khi sếp trả lời, tôi sẽ xuất `PLAN-epic-A-schema.md` + `MSEW-epic-A-schema.md` để Tier 2 thi công.