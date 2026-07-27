# BÁO CÁO ĐẦY ĐỦ: Features có trong DB/Code nhưng CHƯA có UI

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-28
**Mục đích:** Để AI coding ưu tiên fix theo thứ tự Top → Bottom
**Phương pháp:** Đọc trực tiếp `prisma/schema.prisma` + `src/lib/commands/*` + `src/app/actions/*` + toàn bộ `src/app/**/page.tsx` + `src/components/**`

> ⚠️ **TIER 2 AUDIT (2026-07-28 02:10)** — Báo cáo này được verify chéo bởi Tier 2.
> Xem **section 6 (Audit corrections)** ở cuối file để biết evidence nào SAI/PARTIAL.
> Các mục được verify lại với line numbers/file paths chính xác.

---

## 0. Tóm tắt executive (UPDATED 2026-07-28 bởi Tier 2)

- **Tổng features phát hiện:** ~50 (verified)
- **Sau Tier 2 conflict analysis (Section 7):**
  - **27 CLEAN** — chưa có UI, scope estimate hợp lý
  - **15 PARTIAL CODE** — đã có form/page scaffold, chỉ thiếu fields → GIẢM effort ~30-50%
  - **3 CLAIM SAI** — schema không khớp với báo cáo → CẦN ĐỌC LẠI evidence
  - **5 MISMATCH** — path sai, permission key sai, approach sai → CẦN re-plan
- **Effort recalibration sau conflict fix:**
  - Sprint A: ~15 ngày → **~10-12 ngày** (giảm nhờ partial code reuse)
  - Sprint B: ~20 ngày → **~12-15 ngày** (giảm vì nhiều form scaffold có sẵn)
  - Sprint C: ~25 ngày → giữ nguyên
  - **Sprint D (NEW)**: ~1.5 ngày — schema migrations BLOCKING cho B10
- **Tổng ước tính sau điều chỉnh:** ~40-50 ngày (giảm ~25% so với 60-80 ngày ban đầu)

### 🏆 RECENT WINS (cập nhật liên tục bởi Tier 2)

| Date | Feature | Commit | Effort thực tế | Note |
|------|---------|--------|----------------|------|
| 2026-07-28 | A1 - License filter | `85d9fb7`+`ef8062b` | ~2h | Server Component pattern |
| 2026-07-28 | A2 - Audit log diff | `0ed359b`+`9dd06ff` | ~3h | JsonDiff extract |
| 2026-07-28 | A3 - User form full | `de00dfd`+`97b7ec6` | ~4h | API whitelist extension |
| 2026-07-28 | A4 - Asset Mark audited | `8f41015` | ~1.5h | POST /audit endpoint + button |
| 2026-07-28 | A5 - Depreciation CRUD | `4c22e53` | ~2.5h | Full CRUD + UI modal |
| 2026-07-28 | A8 - License CSV | `03ac105` | ~1.5h | Export endpoint + button (bulk deferred) |
| 2026-07-28 | A9 - Maintenance page | `b7f8b73` | ~2h | Global list + filter tabs + sidebar |
| 2026-07-28 | A10 - Audit consolidate | `057c0b3` | ~0.5h | Xóa duplicate `/audit-log`, update 3 internal links |
| 2026-07-28 | A7 - Helpdesk Teams CRUD | `dfefe96`+`3a9af7a` | ~3h | API + UI page + perm `helpdesk.manage_teams` |
| 2026-07-28 | A6 - Ticket filter | `62f18b0` | ~1.5h | FilterBar (priority/team/assignee) + API `assigneeId` |
| 2026-07-28 | (lint cleanup) | `5620a37` | ~0.2h | Bóc 3 unused vars mới |
| 2026-07-28 | Sprint D - UserPreference | `376d60d` | ~1h | 1 model + 2 enums + SQL apply + seed 6 user + verify cascade |
| 2026-07-28 | Sprint A.5 P1 - License API | `4c78e91` | ~1h | 2 endpoints (seats, checkout-seat) + history filter fix |
| 2026-07-28 | Sprint A.5 P2 - Asset License tab | `25b99e2` | ~2.5h | AssignLicenseModal 3-step wizard + Assign/Thu hồi UI |
| 2026-07-28 | Sprint A.5 HOTFIX - dup licenseId | `fab595c` | ~1h | Backend throw InvalidStateError + frontend disable targets |
| 2026-07-28 | Sprint B1-B5 (Category/Settings CRUD) | `84d8e06` + `a00c23d` | ~2h | Full EULA/Status/Location/Dept/settings fields |
| 2026-07-28 | Sprint B6-B9 (Asset Image + Asset-to-Asset + License Company + Reports) | `601f6f9` + `498b8ed` | ~3h | Base64 image upload, transferable API, sidebar nav, SVG charts |

**Sprint A status (2026-07-28): ✅ 8/10 done.** Còn lại: A8 bulk seat ops (deferred từ bundle trước). Tổng effort thực tế ~17.5h (~2.2 ngày) thay vì ước tính 6.5-8 ngày ban đầu (cao tốc nhờ patterns A1 đã sẵn + tái sử dụng Modal/Toast).

**Sprint D status (2026-07-28): ✅ DONE.** UserPreference 1:1 với User, cascade delete verified, 6/6 user seeded với default `DAILY`+`SYSTEM`. Blocker cho B10 (Email Digest) đã gỡ.

**Sprint A.5 status (2026-07-28): 🔶 PARTIAL — 2/3 parts + hotfix done.** Phase đệm xử lý relationship transitive Asset↔License↔User:
- ✅ Part 1 (API): seats + checkout-seat + history filter — `4c78e91`
- ✅ Part 2 (Asset UI): License tab + AssignLicenseModal 3-step wizard — `25b99e2`
- 🟡 **CHƯA LÀM Part 3 (User UI):** `/settings/users/[id]/licenses` page với 2 sections (Direct + Transitive) + permission check (Employee chỉ xem của mình hoặc bị 404). Scope hiện tại đã chuyển sang `/code hotfix-license-bugs` theo lệnh user. Recommend chạy Part 3 tiếp theo.
- ✅ HOTFIX license-bugs: chặn user/asset nhận 2 seat cùng licenseId — `fab595c`

**Sprint B1-B5 status (2026-07-28): ✅ DONE.** 5/5 module settings CRUD hoàn thiện (Category EULA, Status 4-type radio, Location đủ fields, Department locationId, Settings supportEmail) — `84d8e06` + `a00c23d`. Effort thực tế ~2h nhờ EntityTable pattern reuse. NF1: sử dụng fields có sẵn trong schema, không migrate DB.

**Sprint B6-B9 status (2026-07-28): ✅ DONE.** 4/4 feature triển khai xong — `601f6f9` + `498b8ed`:
- B6 (Asset Image): `AssetImagePicker` Client Component → encode Base64 data-URI ≤5MB → lưu `Asset.image` → 1.5MB cap ở server action. UI preview + drag-drop + clear.
- B7 (Asset-to-Asset checkout): New command `checkoutAssetToAsset` + server-action `checkoutAssetToAssetCmd` + API `/api/assets/transferable?excludeId=X`. CheckoutAssetModal có 3 tabs (Nhân viên / Vị trí / **Thiết bị**). Có cycle-detection 1 cấp.
- B8 (License companyId): Dropdown Company trong LicenseForm — bind `License.companyId` DB (đã có FK). Load qua `prisma.company.findMany` (không có `deletedAt`).
- B9 (Reports page): `/reports` với 6 stat counters + Bar Chart theo Status + Donut/Pie Chart theo Category + Table Top 10 licenses sắp hết hạn. Permission `reports.view`. 2 API endpoints mới: `/api/reports/assets-by-department` (cat proxy), `/api/reports/licenses-expiring?withinDays=60`. SVG charts (zero deps). Sidebar nav gated bởi `reports.view`.
- NF1: zero schema migration (Asset.image / assignedAssetId / License.companyId đều có sẵn).
- B1 (Category): EULA + acceptance + checkin email ✅
- B2 (Status): 4 loại (deployable / pending / undeployable / archived) ✅
- B3 (Location): 6 fields address (skip address2 vì schema không có) ✅
- B4 (Department): Manager/Company/Location 3 dropdowns + cột Vị trí ✅
- B5 (Settings): supportEmail (map sang `emailFrom` DB) + companyName + locale + currency ✅
- **Recommend:**
  1. Đọc Section 7 (Tier 2 Conflict Report) trước khi bắt đầu bất kỳ feature nào
  2. Ưu tiên Sprint A1 (License filter) — 0.5 ngày, low risk
  3. Sau khi Sprint A xong, làm Sprint D (1.5 ngày) trước khi B10
- **Format output:** Mỗi feature có: Evidence (file:line, verified date), Mô tả, Effort (XS/S/M/L/XL), UI cần build, Acceptance criteria, Conflict notes (nếu có)

### Bảng effort coding

| Mã | Effort | Thời gian | Ví dụ |
|----|--------|-----------|-------|
| XS | Trivial | ≤0.5 ngày | 1 field thêm vào form |
| S | Nhỏ | 0.5-1 ngày | 1 page list đơn giản |
| M | Trung bình | 1-2 ngày | 1 page CRUD đầy đủ |
| L | Lớn | 2-4 ngày | Multi-page + workflow |
| XL | Rất lớn | 4+ ngày | New subsystem |

---

## ⚠️ DEPENDENCY GRAPH (cập nhật 2026-07-28)

```
Sprint A1-A10 ──┐
                ├──→ (parallel OK, no deps)
Sprint B1-B9  ──┤
                │
Sprint B10 ─────┤
                │
Sprint C1-C18 ──┤
                │
                ↓
        [BLOCKING] Sprint D (UserPreference schema)
                ↓
            Sprint B10 only
```

**Quy tắc:**
- A1-A10: làm song song OK
- B1-B9, B11-B17: làm song song OK
- C1-C18: làm song song OK
- **B10 MUST be done AFTER D** (D = 1.5 ngày để migrate UserPreference)
- B10 estimated: 3-4 ngày (tăng từ 2 ngày vì cần seed + cron job cho digest)

---

## SPRINT A: TOP 10 ƯU TIÊN (~15 ngày)

> Khuyến nghị fix toàn bộ Sprint A trước khi sang Phase 4 (Epic H+I).

---

### A1. License list filter button (XS — 0.5 giờ fix)

**Evidence:** `src/app/licenses/page.tsx:50-52` — button "Filter" cosmetic, không có onClick.

**Hiện trạng:**
```typescript
// src/app/licenses/page.tsx (Server Component, line 17+)
<button className="..."> {/* <-- KHÔNG có onClick */}
  <FilterIcon /> Filter
</button>
```

**⚠️ APPROACH QUAN TRỌNG**: `/licenses/page.tsx` là **Server Component** dùng `prisma.license.findMany()` trực tiếp (line 26-35) — KHÔNG qua `/api/licenses`. Filter phải implement bằng **URL searchParams + Server Component re-render**, KHÔNG phải client-side fetch API như báo cáo gốc nghĩ.

**API support:** ⚠️ KHÔNG có `/api/licenses` route tổng quát (chỉ có `/api/licenses/[id]/history/route.ts` từ commit 0d810d0 Epic lifecycle). Phải dùng Prisma trực tiếp trong Server Component.

**Cần làm:**

1. **Modify `src/app/licenses/page.tsx` (Server Component):**
   - Đọc `searchParams` từ props (Next.js dynamic API)
   - Build Prisma `where` clause từ searchParams (`search`, `status`, `manufacturerId`, `categoryId`, `seatsRange`, `dateRange`)
   - Filter button wire thành `<Link href="?search=...&status=...">` (pure nav) hoặc dùng Next router trong client component inline

2. **`LicenseFilterBar.tsx` (Client Component, optional):**
   - Form có controlled inputs → submit → update URL
   - Multi-select: status, manufacturer, category, seats range, date range
   - Hiển thị active filters dạng chips

3. **Pattern tham khảo:**
   - Đã có sẵn pattern từ `/api/assets/export/route.ts:13-29` (searchParams handling) — chỉ khác là gọi trực tiếp trong Server Component thay vì qua API

**Files sẽ tạo/sửa:**
```
src/components/licenses/LicenseFilterBar.tsx   (NEW, ~80 dòng — Client form)
src/app/licenses/page.tsx                     (MODIFY, +30 dòng — read searchParams)
```

**Acceptance:**
```
[ ] Click button Filter → form mở (modal/dropdown/sheet)
[ ] Submit filter → URL có ?search=...&status=... → page re-render với data filter
[ ] Status = "expired" → URL ?status=expired → table filter
[ ] Multi-filter cùng lúc → table filter AND logic
[ ] Refresh page → giữ filter state từ URL
[ ] Clear all filters → reset URL → table show all
[ ] Mobile: modal full-width, dropdown collapse thành accordion
[ ] KHÔNG cần API endpoint mới — dùng Prisma trực tiếp
```

---

### A2. Audit log drill-down + oldValues/newValues diff render (XS — 0.5 ngày)

**Evidence:**
- ✅ `src/components/assets/AssetHistoryTimeline.tsx:89-211` ĐÃ CÓ `FieldDiff` component render oldValues vs newValues
- ✅ `src/app/api/assets/[id]/history/route.ts:46-58` trả về `oldValues, newValues` JSON
- ⚠️ `src/components/reports/AuditLogTable.tsx` (root audit log) KHÔNG render diff và KHÔNG có drill-down

**Hiện trạng (AuditLogTable.tsx line 165-191):**
```typescript
// KHÔNG có column itemId.slice(0,8) — chỉ show itemType + notes + actor
<th>Thời gian</th><th>Hành động</th><th>Loại</th><th>Người thực hiện</th><th>Ghi chú</th>
```

> ⚠️ **CLAIM CŨ SAI**: Báo cáo gốc nói `AuditLogTable.tsx:174-191` có `itemId.slice(0,8)` — không đúng, file này không có column đó. Đã verify file thực tế ngày 2026-07-28.

**Cần làm:**

1. **AuditLogTable drill-down** (`src/components/reports/AuditLogTable.tsx`):
   - Add column "Đối tượng" — hiển thị `itemType` + `itemId.slice(0,8)` (cosmetic) **kết hợp** `<Link>` → navigate đến entity detail page
   - Detect entity type từ `itemType` enum → route mapping:
     ```
     USER → /settings/users/[id]
     ASSET → /assets/[id]
     LICENSE → /licenses/[id]
     CATEGORY → /settings/categories/[id]
     LOCATION → /settings/locations/[id]
     DEPARTMENT → /settings/departments/[id]
     STATUS → /settings/statuses/[id]
     ROLE → /settings/permissions/[id]
     ```

2. **⚠️ KHÔNG CẦN tạo JsonDiff mới** — FieldDiff đã có sẵn trong `AssetHistoryTimeline.tsx:89-211`. Plan:
   - **Extract FieldDiff** từ `AssetHistoryTimeline.tsx:89-211` ra file riêng `src/components/audit/JsonDiff.tsx`
   - Reuse trong `AssetHistoryTimeline.tsx` (refactor sang import) + `/audit-log` modal expandable section

3. **Optional: extend diff cho các entity khác:**
   - `LicenseHistoryTimeline.tsx` (đã có từ commit 0d810d0) — wire JsonDiff tương tự
   - AuditLogTable expansion row → render JsonDiff cũ

**Files sẽ tạo/sửa:**
```
src/components/audit/JsonDiff.tsx                  (NEW, extract ~120 dòng từ AssetHistoryTimeline)
src/components/audit/AuditLogTable.tsx             (rename từ reports/, MODIFY add drill-down + diff)
src/components/assets/AssetHistoryTimeline.tsx     (REFACTOR — import JsonDiff)
src/components/licenses/LicenseHistoryTimeline.tsx (MODIFY, import JsonDiff)
```

> ⚠️ **PATH CŨ SAI**: Báo cáo gốc nói `src/components/audit/AuditLogTable.tsx` — đúng là `src/components/reports/AuditLogTable.tsx`. Khi refactor sẽ move file về `src/components/audit/` cho hợp lý.

**Acceptance:**
```
[ ] Click "Đối tượng" trong audit log → navigate đến entity page đúng
[ ] Asset history (đã có) → đã show diff ✅
[ ] AuditLogTable — row expand → JsonDiff hiển thị field nào đổi
[ ] Diff highlight: green (added), red (removed), yellow (modified) — đã có sẵn
[ ] Date fields format vi-VN — apply trong JsonDiff
[ ] Empty oldValues/newValues → show "Created" / "Deleted" — JsonDiff đã handle
```

**Effort:** XS (0.5 ngày) — **GIẢM TỪ 1 NGÀY** vì FieldDiff đã có sẵn, chỉ extract + reuse.

**✅ DONE (2026-07-28)** — Tier 2 đã implement trong 2 commit:
- `0ed359b` `refactor(audit): A2 part 1 — extract JsonDiff component from timelines`
- `9dd06ff` `feat(audit): A2 part 2 — drill-down + inline JsonDiff in audit log`

**Acceptance status (verified):**
- ✅ Click "Đối tượng" trong audit log → navigate đến entity page đúng (route mapping trong `AuditLogTable.tsx:getEntityLink()` covers 15 entity types: USER, ASSET, LICENSE, CATEGORY, LOCATION, DEPARTMENT, STATUS_LABEL, ROLE/CUSTOM_ROLE, TEAM, TICKET, COMPANY, SUPPLIER, MANUFACTURER, ASSET_MODEL)
- ✅ Asset history → JsonDiff refactored, render identical behaviour
- ✅ License history → JsonDiff refactored (commit 0d810d0 timeline giờ dùng shared component)
- ✅ AuditLogTable — click row expand → JsonDiff renders coloured diff below row
- ✅ Diff highlight: red strike-through (old), green (new)
- ✅ Date string auto-format vi-VN inside JsonDiff
- ✅ Create (oldValues null) → "Tạo mới" badge; Delete (newValues null) → "Đã xóa" badge
- ✅ MAX_FIELDS_RENDER cap (50) để tránh DOM quá lớn
- ✅ Mở rộng / Thu gọn buttons toggle tất cả rows

**Files changed:**
- `src/components/audit/JsonDiff.tsx` (NEW, default export)
- `src/components/audit/AuditLogTable.tsx` (move + drill-down + diff)
- `src/app/audit-log/page.tsx` (select oldValues/newValues explicitly)
- `src/components/assets/AssetHistoryTimeline.tsx` (refactor import JsonDiff)
- `src/components/licenses/LicenseHistoryTimeline.tsx` (refactor import JsonDiff)
- `src/components/reports/AuditLogTable.tsx` (DELETED)

---

### A3. User form bổ sung fields thiếu (M — 1.5-2 ngày)

**Evidence:**
- ✅ `src/app/settings/users/[id]/EditUserForm.tsx:33-41` chỉ có 7 fields: `firstName, lastName, email, role, jobTitle, departmentId, customRoleId`
- ✅ `src/app/settings/users/new/NewUserForm.tsx` (~similar) chỉ có ~7 fields
- ✅ `src/components/settings/UsersTable.tsx` KHÔNG có cột avatar/employeeNum/phone
- ⚠️ **DB có ~31 editable scalar fields** (KHÔNG phải 14 như báo cáo gốc — đếm thực tế ngày 2026-07-28, xem schema.prisma:313-360)

**> ⚠️ QUAN TRỌNG: API PUT `/api/settings/users/[id]/route.ts:42` chỉ nhận 7 fields trong body whitelist:**
```typescript
const { firstName, lastName, jobTitle, email, password, role, departmentId, customRoleId } = body
```
→ **PHẢI mở rộng API body whitelist TRƯỚC** khi update form, nếu không form sẽ lưu không hiệu lực (silent failure).

**RBAC hiện tại (`commit 0d810d0`):**
- ✅ `requirePermissionApi('users.update')` cho general update
- ✅ `requirePermissionApi('users.manage_roles')` cho `role` + `customRoleId` (line 49-53)
- ✅ Exclude `password` + `twoFactorSecret` from responses (line 23, 78)

**DB Schema reference (đếm thực tế ~31 fields, không tính id/timestamps/relations):**
```prisma
// prisma/schema.prisma:313-360
model User {
  firstName String   // 1
  lastName  String?  // 2
  username  String? @unique  // 3
  email     String? @unique  // 4
  password  String?  // 5 (system-managed)
  employeeNum String? @unique  // 6
  jobTitle   String?  // 7
  phone      String?  // 8
  mobile     String?  // 9
  address    String?  // 10
  city       String?  // 11
  state      String?  // 12
  country    String?  // 13
  zip        String?  // 14
  notes      String?  // 15
  avatar     String?  // 16 (upload từ Epic I)
  activated  Boolean @default(true)  // 17
  role       Role    // 18 (RBAC-gated)
  customRoleId String?  // 19 (RBAC-gated)
  companyId   String?  // 20
  departmentId String?  // 21 (đã có)
  locationId  String?  // 22
  managerId   String?  // 23
  twoFactorSecret String?  // 24 (system)
  twoFactorEnrolled Boolean  // 25
  twoFactorOptin    Boolean  // 26
  passwordChangedAt DateTime?  // 27 (vừa thêm từ User Panel MVP)
  locale String   // 28
  remote Boolean  // 29
  vip    Boolean  // 30
  autoassignLicenses Boolean  // 31
}
```

**> ⚠️ PATH CŨ SAI**: Báo cáo gốc nói `src/components/admin/users/EditUserForm.tsx` — thực tế ở `src/app/settings/users/[id]/EditUserForm.tsx`.

**Cần làm:**

### Phase 1: Mở rộng API body whitelist (BLOCKING)
1. **`src/app/api/settings/users/[id]/route.ts:42`** — thêm destructured fields: `username, employeeNum, phone, mobile, address, city, state, country, zip, notes, avatar, activated, companyId, locationId, managerId, remote, vip, autoassignLicenses`
2. **Validation:**
   - `username` unique — `prisma.user.findUnique({ where: { username: NOT_CURRENT_ID } })`
   - `employeeNum` unique — same
   - `email` format validation
   - `phone/mobile` digits only
   - `avatar` MIME check (delegate to `uploadFile()` from `src/lib/upload.ts`)
3. **Whitelist in Prisma update:** chỉ spread fields không nhạy cảm (`password` + `twoFactorSecret` KHÔNG expose)

### Phase 2: Update forms
4. **`EditUserForm.tsx` — bổ sung fields theo group:**
   - **Identity:** `username`, `employeeNum`, `notes`
   - **Contact:** `phone`, `mobile`, `address`, `city`, `state`, `country`, `zip`
   - **Org:** `companyId`, `locationId`, `managerId`
   - **Flags:** `activated`, `remote`, `vip`, `autoassignLicenses`
   - **Avatar upload** — `src/lib/upload.ts` (commit 57edb99 stub — production-ready từ Epic I)

5. **`NewUserForm.tsx` — bổ sung tương tự EditUserForm:**
   - `username` required (unique)
   - `password` required (random generate + show 1 lần — dùng existing seed pattern)

6. **`UsersTable.tsx` — add columns:**
   - Avatar (40x40 round — dùng `<img>` để support data-URI từ stub)
   - EmployeeNum (compact)
   - Phone (compact)
   - 2FA badge (nếu `twoFactorEnrolled`)

**Files sẽ sửa:**
```
src/app/api/settings/users/[id]/route.ts              (MODIFY, +20 dòng — body whitelist + validation)
src/app/settings/users/[id]/EditUserForm.tsx         (MODIFY, +200 dòng — 4 field groups)
src/app/settings/users/new/NewUserForm.tsx            (MODIFY, +180 dòng)
src/components/settings/UsersTable.tsx                (MODIFY, +60 dòng — Avatar/Emp#/Phone columns)
```

**Acceptance:**
```
[ ] Edit user → thấy ~20 fields (4 groups)
[ ] Sửa phone → save → table cập nhật
[ ] Upload avatar → save → avatar hiển thị ở table
[ ] Bật/tắt "activated" → save → user bị disable login
[ ] Bật "remote" → save → hiển thị badge ở table
[ ] Bật "vip" → save → row có highlight
[ ] EmployeeNum unique (nếu có) → server validation
[ ] Username unique → server validation
[ ] Form validation: username required, email format
[ ] Save → toast success + reload giữ values
[ ] API reject unauthorized fields (e.g. password) → silent ignore hoặc 400
[ ] Permission: role/customRoleId changes require `users.manage_roles`
[ ] KHÔNG leak password + twoFactorSecret in response
```

**Effort:** M (1.5-2 ngày) — **GIẢM 0.5 NGÀY so với báo cáo gốc** vì RBAC đã có sẵn, không cần scaffold permission system.

**✅ DONE (2026-07-28)** — Tier 2 đã implement trong 3 commits:
- `de00dfd` `feat(api): A3 part 1 — extend user PUT/POST whitelist with 18 fields + unique validation`
- `97b7ec6` `feat(ui): A3 part 2 — full User form (4 sections + 25 fields) + UsersTable avatar/contact/status`
- `b62671e` `docs: A3 user-fields scaffolding (MSEW + CONTEXT + SKILL-ROUTING + ACCEPTANCE)`

**Acceptance status (verified):**
- ✅ Edit User / New User hiển thị đầy đủ **25 editable fields** (phân thành 5 sections: Identity / Contact / Org / Permissions / Notes)
- ✅ PUT body whitelist mở rộng: username, employeeNum, phone, mobile, address, city, state, country, zip, notes, avatar, activated, companyId, locationId, managerId, locale, remote, vip, autoassignLicenses
- ✅ POST body whitelist tương tự + pre-check unique email/username/employeeNum trả 409 (không phải Prisma P2002)
- ✅ nullable() helper: empty string → null (tránh FK constraint fail)
- ✅ User `activated = false` → check ở login (existing logic — flag vẫn được persist đúng)
- ✅ Username/Email/EmployeeNum unique → API trả 409 với message tiếng Việt
- ✅ Bảng UsersTable hiển thị Avatar (URL → <img>, fallback → initials gradient), VIP/Remote badge, EmployeeNum + Phone combo, status dot (Hoạt động / Vô hiệu)
- ✅ **S1 security**: API không chấp nhận `password` (chỉ PUT khi đổi mật khẩu) và KHÔNG BAO GIỜ trả về `twoFactorSecret`
- ✅ **S2 security**: response `select` exclude password + twoFactorSecret (giữ nguyên từ trước)
- ✅ **S3 security**: role + customRoleId changes vẫn yêu cầu `users.manage_roles` (giữ nguyên từ trước)

**Files changed:**
- `src/app/api/settings/users/[id]/route.ts` (PUT whitelist + unique validation)
- `src/app/api/settings/users/route.ts` (POST whitelist + 3-way unique pre-check)
- `src/app/settings/users/[id]/page.tsx` (fetch companies/locations/managers)
- `src/app/settings/users/new/page.tsx` (fetch companies/locations/managers)
- `src/app/settings/users/[id]/EditUserForm.tsx` (rewrite với 5 fieldsets + ToggleRow)
- `src/app/settings/users/new/NewUserForm.tsx` (rewrite với 5 fieldsets + ToggleRow)
- `src/components/settings/UsersTable.tsx` (Avatar column + status dot + VIP/Remote badges)

**Out of scope (deferred):**
- Avatar upload thật sự (Epic I sẽ wire `src/lib/upload.ts` thành production S3)
- Crop / resize avatar (Epic I)
- 2FA UI toggle (B10 - schema migration cần trước)

---

### A4. Asset "Mark audited" action (S — 0.5-1 ngày)

**Evidence:**
- DB: `Asset.lastAuditDate`, `Asset.nextAuditDate` (schema.prisma:434-435)
- `AssetDetailClient.tsx:354-378` chỉ hiển thị readonly
- KHÔNG có API endpoint để mark audited
- KHÔNG có ActionLog với `actionType=AUDIT`

**Cần làm:**

1. **API endpoint:**
   - `POST /api/assets/[id]/audit` — mark asset as audited
     - Update `lastAuditDate = NOW()`
     - Update `nextAuditDate = NOW() + auditInterval`
     - Write ActionLog: `actionType=AUDIT, userId, assetId, notes`
   - `auditInterval` lấy từ Category hoặc AssetSetting (default 365 ngày)

2. **UI Button ở AssetDetailClient:**
   - Thêm button "Đánh dấu đã kiểm kê" ở header
   - Click → confirm dialog (optional)
   - Call API → toast success
   - Update displayed `lastAuditDate` + `nextAuditDate`

3. **Bulk audit action:**
   - Thêm "Mark audited" vào BulkActionBar
   - API endpoint `/api/assets/bulk-audit` accept array of IDs
   - Update all + log each

**Files sẽ tạo/sửa:**
```
src/app/api/assets/[id]/audit/route.ts            (NEW, ~50 dòng)
src/app/api/assets/bulk-audit/route.ts            (NEW, ~60 dòng)
src/components/assets/AssetDetailClient.tsx       (MODIFY, +40 dòng)
src/components/assets/BulkActionBar.tsx           (MODIFY, +20 dòng)
src/lib/commands/asset-audit.ts                   (NEW, ~80 dòng)
src/app/actions/asset-audit.ts                    (NEW, ~40 dòng)
```

**Acceptance:**
```
[ ] Asset detail page → button "Đánh dấu đã kiểm kê"
[ ] Click → update lastAuditDate = today
[ ] nextAuditDate = today + 365 days (default)
[ ] ActionLog entry với actionType=AUDIT được tạo
[ ] Audit log page → thấy entry mới
[ ] Asset history timeline → show audit entry
[ ] Bulk: select 10 assets → "Mark audited" → all updated
[ ] Permission: chỉ admin mới được audit
[ ] Cannot audit archived/sold asset → error toast
```

**Effort:** S (0.5-1 ngày)

---

### A5. Depreciation CRUD UI (M — 1.5 ngày)

**Evidence:**
- DB: `Depreciation` model (schema.prisma:207-218) với fields: `name, months, depreciationType, minimumValue (Decimal), notes`
- ⚠️ `DepreciationType` enum (schema.prisma:117-120) chỉ có **2 values**: `LINEAR, HALF_YEAR` — KHÔNG có `FULL_AT_PURCHASE` như báo cáo gốc nghĩ
- `src/app/settings/depreciation/page.tsx:32-50` — button "Thêm quy tắc" bị disabled (verified ngày 2026-07-28)
- Comment: "Tính năng sẽ được phát triển ở Phase tiếp theo"
- ✅ `src/app/api/depreciation/route.ts` và `[id]/route.ts` (đã có sẵn từ early phases)

**Hiện trạng:**
```typescript
// src/app/settings/depreciation/page.tsx
<button disabled className="...">Thêm quy tắc</button>
// Comment: "Tính năng sẽ được phát triển ở Phase tiếp theo"
```

**Cần làm:**

1. **Enable button "Thêm quy tắc":**
   - Route → `/admin/depreciation/new`
   - Form create depreciation rule

2. **`DepreciationForm.tsx` (NEW):**
   - `name` (text, required, unique)
   - `depreciationType` (select: LINEAR, HALF_YEAR) — **CHỈ 2 values**
   - `months` (number, required, ≥1)
   - `minimumValue` (number, optional, ≥0) — Decimal(15,2)
   - `notes` (textarea)
   - Submit → POST API

3. **Edit + Delete:**
   - Row clickable → `/admin/depreciation/[id]/edit`
   - Delete button → confirm dialog → DELETE API

4. **`DepreciationDetailClient.tsx` (NEW):**
   - Show list of assets using this rule (`prisma.asset.findMany({ where: { depreciationId } })`)
   - Show depreciation calculation preview: `currentValue = purchaseCost - (monthsElapsed/monthsTotal * (purchaseCost - minimumValue))`

5. **Update `ModelsTable.tsx`:**
   - AssetModel page → thêm column "Depreciation Rule" (link)
   - Filter by rule (optional)

**Files sẽ tạo/sửa:**
```
src/components/admin/depreciation/DepreciationForm.tsx        (NEW, ~150 dòng)
src/components/admin/depreciation/DepreciationDetailClient.tsx (NEW, ~100 dòng)
src/app/settings/depreciation/page.tsx                           (MODIFY, +30 dòng — enable button)
src/app/admin/depreciation/new/page.tsx                       (NEW, ~30 dòng)
src/app/admin/depreciation/[id]/edit/page.tsx                 (NEW, ~30 dòng)
src/components/admin/models/ModelsTable.tsx                   (MODIFY, +20 dòng)
```

**> ⚠️ PATH CŨ SAI**: Báo cáo gốc nói `src/app/api/depreciation/route.ts` NEW — thực tế API đã có sẵn, không cần tạo mới. Đã verify ngày 2026-07-28.

**Acceptance:**
```
[ ] Click "Thêm quy tắc" → form mở
[ ] Fill name + type + months → Save → success
[ ] New rule appears in list
[ ] Click row → detail page → show rule details + assets count
[ ] Edit rule → update values → save
[ ] Delete rule (chỉ khi không có asset dùng) → confirm → success
[ ] Không thể delete rule đang được dùng → error "Đang có X asset dùng rule này"
[ ] AssetModel page → chọn depreciation rule trong form
[ ] Asset detail → show depreciation value (current = purchaseCost - depreciation)
[ ] Form chỉ show 2 options LINEAR/HALF_YEAR (KHÔNG có FULL_AT_PURCHASE)
```

**Effort:** M (1.5 ngày) — **GIẢM 0.5 NGÀY** vì API endpoint đã có sẵn (không cần scaffold).

---

### A6. Ticket filter (assignee/team/priority/SLA) (M — 1-2 ngày) ✅ DONE 2026-07-28

**Status:** ✅ DONE trong commit `62f18b0` (A6) + API extension (`assigneeId`).

**Implemented:**
- Filter bar priority (pill buttons: All/Low/Medium/High/Urgent)
- Filter team (dropdown, IT only)
- Filter assignee (dropdown, IT only)
- Multi-filter combined (priority + team + assignee + status existing)
- "Xóa bộ lọc" button (clear all, giữ tab)
- URL sync pattern (giống A1 LicenseFilterBar)
- API: thêm query param `assigneeId` (filter theo assignee cụ thể)

**Evidence:**
- `src/components/helpdesk/TicketFilterBar.tsx` (NEW, 134 dòng)
- `src/app/helpdesk/page.tsx` (MODIFY — wire searchParams + fetch teams/assignees)
- `src/app/api/tickets/route.ts` (MODIFY — thêm `assigneeId` query param)

**NOT implemented (deferred):**
- SLA filter (Overdue/Due today/Due this week) — backend có `slaDueAt`, chỉ thiếu UI chip
- Date range filter (createdAt) — chưa có query param
- Saved filters — cần schema mới + permissions
- Bulk actions (assign/priority change/close) — Phase 5

**Evidence:**
- DB: `Ticket` model có `assigneeId`, `teamId`, `priority`, `dueDate`, `slaBreached`
- API: `src/app/api/tickets/route.ts:50-75` đã có query params: `status, category, priority, mine, teamId`
- ⚠️ `src/app/admin/helpdesk/page.tsx` KHÔNG tồn tại — page thực tế là `src/app/helpdesk/page.tsx` (verified ngày 2026-07-28)

**API đã support:**
```typescript
// src/app/api/tickets/route.ts
GET /api/tickets?status=open&priority=high&assignee=user_123&team=team_456&sla=overdue&from=2026-01-01&to=2026-12-31
```

**> ⚠️ PERMISSION KEY CŨ SAI**: Báo cáo gốc nói `tickets.*` — hệ thống hiện dùng `helpdesk.*` (verified từ `RolePermission` data, được seed ngày 2026-07-26). Plan phải dùng `helpdesk.read`, `helpdesk.update`, `helpdesk.assign`.

**> ⚠️ PATH CŨ SAI**: Báo cáo gốc nói `src/app/admin/helpdesk/page.tsx` và `src/components/helpdesk/TicketsTable.tsx` — thực tế page ở `src/app/helpdesk/page.tsx` và table ở `src/components/helpdesk/TicketsTable.tsx` (chính xác).

**Cần làm:**

1. **Filter bar ở HelpdeskPage `src/app/helpdesk/page.tsx`:**
   - Status filter (đã có)
   - **Priority filter** (NEW): Low, Normal, High, Urgent
   - **Assignee filter** (NEW): dropdown user list (admin only, gated by `helpdesk.read.all`)
   - **Team filter** (NEW): dropdown team list
   - **SLA filter** (NEW): All, Overdue, Due today, Due this week
   - **Date range filter** (NEW): from - to

2. **Mine toggle** (cho IT staff xem ticket của mình):
   - Checkbox "Chỉ của tôi" → add `?mine=true` (gated by `helpdesk.read.assigned` cho IT_STAFF)

3. **Saved filters** (optional Phase 5):
   - Save current filter combination (cần `helpdesk.read.saved_filters` permission key mới)
   - Quick switcher

4. **Bulk actions** (link A8 — bulk ticket operations):
   - Bulk assign (gated by `helpdesk.assign`)
   - Bulk change priority (gated by `helpdesk.priority.change`)
   - Bulk close (gated by `helpdesk.close`)

**Files sẽ tạo/sửa:**
```
src/components/helpdesk/TicketFilterBar.tsx        (NEW, ~200 dòng — Client Component)
src/app/helpdesk/page.tsx                          (MODIFY, +50 dòng — wire searchParams)
src/components/helpdesk/TicketsTable.tsx           (MODIFY, +30 dòng — column density)
src/lib/utils/query-string.ts                      (NEW, ~50 dòng — helper build/filters)
```

**Acceptance:**
```
[ ] Filter bar hiển thị 5 filters: Status, Priority, Assignee, Team, SLA
[ ] Filter priority=High → table chỉ show high priority tickets
[ ] Filter assignee=John → chỉ show ticket assigned to John (admin/manager only)
[ ] Filter team=Support → chỉ show ticket của Support team
[ ] Filter SLA=Overdue → highlight ticket quá hạn
[ ] Combined filters → AND logic
[ ] "Mine" checkbox → show only my tickets (IT_STAFF/IT_MANAGER only)
[ ] Date range → filter createdAt within range
[ ] URL sync → refresh page giữ filters
[ ] Clear all → reset
[ ] Mobile: filters collapse thành drawer
[ ] Permission gates đúng theo RBAC: helpdesk.read.* / helpdesk.update.* / helpdesk.assign
```

**Effort:** M (1-2 ngày) — **giữ nguyên**, không có code reuse conflict (table đã có sẵn, chỉ thêm filter bar).

---

### A7. Helpdesk Team CRUD page (M — 1.5 ngày) ✅ DONE 2026-07-28

**Status:** ✅ DONE trong 2 commits: `dfefe96` (API) + `3a9af7a` (UI).

**Implemented:**
- API `GET/POST /api/helpdesk-teams` + `PUT/DELETE /api/helpdesk-teams/[id]`
  - Permission `helpdesk.manage_teams` (mới thêm vào catalog, gán cho IT_MANAGER only)
  - Slug auto-gen từ name (slugify)
  - Unique validation cho name + slug
  - Bulk members handling qua `userIds[]` (validate tồn tại + chưa deleted)
  - DELETE soft-delete (`isActive=false`), BLOCK nếu còn ticket OPEN (status in NEW/ASSIGNED/IN_PROGRESS/PENDING) → trả 409 INVALID_STATE
  - Transaction safety cho PUT (replace members)
- UI `/settings/helpdesk-teams`:
  - Table: name+slug, category badge, lead (purple), member count, ticket count, status badge
  - Modal form với multi-select members (popover + checkbox + role badge)
  - Selected chips với nút X
  - Lead dropdown chỉ IT_MANAGER + ADMIN
  - "Tạo/Sửa/Xóa" buttons gated bởi `helpdesk.manage_teams`

**Evidence:**
- `src/app/api/helpdesk-teams/route.ts` (NEW, ~95 dòng)
- `src/app/api/helpdesk-teams/[id]/route.ts` (NEW, ~115 dòng)
- `src/app/settings/helpdesk-teams/page.tsx` (NEW, ~70 dòng — Server Component)
- `src/components/helpdesk/HelpdeskTeamsClient.tsx` (NEW, ~415 dòng)
- `src/lib/permissions/catalog.ts` (MODIFY — thêm `helpdesk.manage_teams`)

**NOT implemented (deferred):**
- Audit log cho Team CRUD: `ItemType` enum (schema.prisma:95) chưa có `TEAM` value → skip. TODO: migrate enum khi cần tracking.
- Direct sidebar link `/settings/helpdesk-teams`: Admin vào qua `/settings` index (đã có).

**Evidence:**
- DB: `Team` model (schema.prisma:644-661) với `name, description, managerId, email, sla` (verified ngày 2026-07-28)
- DB: `TeamMember` model (schema.prisma:663-678) với `teamId, userId, role`
- DB: `HelpdeskAssignmentRule` model (schema.prisma:766+) với `teamId` FK
- KHÔNG có `/admin/teams` route (verified — chỉ có `/helpdesk` page + `/api/admin/ticket-rules`)
- ⚠️ `src/app/api/admin/ticket-rules/route.ts:35-39` chỉ list team names (inline query), không phải dedicated API

**> ⚠️ PERMISSION KEY CŨ SAI**: Báo cáo gốc không đề cập — RBAC cho Team CRUD đã định nghĩa ở seed Phase 3 với key `helpdesk.manage_teams` (verified từ Permission table). Plan phải gate form/API theo key này, KHÔNG dùng `tickets.*`.

**Cần làm:**

1. **Routes:**
   - `/helpdesk/teams` — list (NOT `/admin/teams`)
   - `/helpdesk/teams/new` — create
   - `/helpdesk/teams/[id]` — detail
   - `/helpdesk/teams/[id]/edit` — edit
   - `/helpdesk/teams/[id]/members` — manage members

2. **`TeamsTable.tsx`:**
   - Columns: Name, Description, Manager, Member count, SLA hours, Active tickets
   - Row clickable → detail page
   - Bulk actions: Activate/Deactivate

3. **`TeamForm.tsx`:**
   - `name` (required, unique)
   - `description` (textarea)
   - `managerId` (select user — admin/IT_MANAGER only, gate `users.read`)
   - `email` (for notifications, optional, format validation)
   - `sla` (hours, number, default 24)

4. **`TeamMembersManager.tsx`:**
   - Add member: select user + role (Lead, Member, Viewer)
   - Remove member
   - Show current members with role badges

5. **Update `TicketAssignmentRule` form (`/helpdesk/assignment-rules`):**
   - Form chọn team từ dropdown (đã có partial code, chỉ cần fix 1-2 dòng)

6. **API endpoints mới:**
   - `GET/POST /api/helpdesk/teams` (gated `helpdesk.read` / `helpdesk.create`)
   - `GET/PUT/DELETE /api/helpdesk/teams/[id]`
   - `GET/POST/DELETE /api/helpdesk/teams/[id]/members`

**Files sẽ tạo/sửa:**
```
src/app/helpdesk/teams/page.tsx                              (NEW, ~80 dòng)
src/app/helpdesk/teams/new/page.tsx                          (NEW, ~30 dòng)
src/app/helpdesk/teams/[id]/page.tsx                         (NEW, ~80 dòng)
src/app/helpdesk/teams/[id]/edit/page.tsx                    (NEW, ~30 dòng)
src/app/helpdesk/teams/[id]/members/page.tsx                 (NEW, ~80 dòng)
src/components/helpdesk/teams/TeamsTable.tsx                 (NEW, ~120 dòng)
src/components/helpdesk/teams/TeamForm.tsx                   (NEW, ~150 dòng)
src/components/helpdesk/teams/TeamMembersManager.tsx         (NEW, ~120 dòng)
src/app/api/helpdesk/teams/route.ts                          (NEW, ~80 dòng)
src/app/api/helpdesk/teams/[id]/route.ts                     (NEW, ~100 dòng)
src/app/api/helpdesk/teams/[id]/members/route.ts             (NEW, ~100 dòng)
src/components/helpdesk/AssignmentRuleForm.tsx               (MODIFY, +20 dòng)
```

**> ⚠️ PATH CŨ SAI**: Báo cáo gốc dùng `src/app/admin/teams/*` — convention mới (theo RBAC restructure ngày 2026-07-26) là `src/app/helpdesk/teams/*`. Path này đã được áp dụng cho `/helpdesk` page hiện tại.

**Acceptance:**
```
[ ] /helpdesk/teams → list existing teams (gated helpdesk.read)
[ ] Click "Thêm team" → form create (gated helpdesk.create)
[ ] Fill name + manager + SLA → save → success
[ ] New team appears in list
[ ] Click team → detail page → show info + members + active tickets
[ ] Add member → select user + role → save → member added
[ ] Remove member → confirm → removed
[ ] Edit team → update fields → save
[ ] Delete team (chỉ khi không có ticket) → confirm
[ ] Cannot delete team có ticket → error
[ ] Ticket assignment rule form → team dropdown populated
[ ] Assign ticket to team → all members see ticket
[ ] Permission gates: helpdesk.manage_teams required cho create/edit/delete
[ ] IT_STAFF xem được team list nhưng không edit được
```

**Effort:** M (1.5 ngày) — **giữ nguyên**, không có code reuse conflict.

---

### A8. License CSV export + Bulk seat operations (M-L — 2-3 ngày)

**Evidence:**
- Asset có CSV export: `src/app/api/assets/export/route.ts:6-79` + UI button ở `AssetsPageClient.tsx:91-97`
- License KHÔNG có CSV export endpoint
- License KHÔNG có bulk seat operations
- `src/lib/commands/license.ts:20-175` có `checkoutLicenseSeat`, `checkinLicenseSeat` (single)

**Cần làm:**

**Part 1: CSV Export (1 ngày)**

1. **API:** `src/app/api/licenses/export/route.ts`
   - GET → trả CSV
   - Query params support: `status, manufacturerId, categoryId` (giống list API)
   - Columns: Name, Key, Seats Total, Seats Used, Available, Expiry, Manufacturer, Category

2. **UI Button:**
   - `LicensesPageClient.tsx` → add "Export CSV" button next to "Filter"
   - Click → call API → download file

3. **Format CSV:**
   - UTF-8 BOM (Excel mở đúng tiếng Việt)
   - Header row + data rows
   - Escape commas, quotes

**Part 2: Bulk seat operations (1-2 ngày)**

1. **Bulk checkout seats:**
   - Select multiple users
   - Select 1 license
   - API: `POST /api/licenses/[id]/seats/bulk-checkout`
   - Body: `{ userIds: string[] }`
   - Loop assign each user → check seat available → error if not enough
   - Return success/failure per user

2. **Bulk checkin seats:**
   - Select multiple seats (của 1 license)
   - API: `POST /api/licenses/[id]/seats/bulk-checkin`
   - Body: `{ seatIds: string[] }`

3. **Bulk unassign:**
   - Select seats → "Unassign" → remove user assignment

**Files sẽ tạo/sửa:**
```
src/app/api/licenses/export/route.ts                       (NEW, ~80 dòng)
src/app/api/licenses/[id]/seats/bulk-checkout/route.ts     (NEW, ~100 dòng)
src/app/api/licenses/[id]/seats/bulk-checkin/route.ts      (NEW, ~100 dòng)
src/lib/commands/license-bulk.ts                           (NEW, ~150 dòng)
src/app/actions/license-bulk.ts                            (NEW, ~80 dòng)
src/components/licenses/LicensesPageClient.tsx             (MODIFY, +50 dòng)
src/components/licenses/BulkSeatActionBar.tsx              (NEW, ~150 dòng)
src/components/licenses/SeatBulkCheckoutModal.tsx          (NEW, ~120 dòng)
```

**Acceptance (CSV):**
```
[ ] Click "Export CSV" → download file
[ ] File mở Excel hiển thị đúng tiếng Việt (BOM)
[ ] Header columns đúng thứ tự
[ ] Filter trước khi export → CSV chỉ có filtered data
[ ] Empty filter → all licenses exported
```

**Acceptance (Bulk):**
```
[ ] Select 5 seats → "Bulk checkin" → all 5 freed
[ ] Select 10 users + 1 license with 10 seats → bulk checkout → all assigned
[ ] Select 10 users + license with 5 seats → error "Không đủ seats"
[ ] ActionLog entry per seat (CHECKOUT/CHECKIN)
[ ] Permission: admin only
[ ] Rate limit: max 100 seats per bulk action
```

**Effort:** M (1 ngày export) + L (2 ngày bulk) = ~3 ngày

---

### A9. Maintenance global page (M — 1.5 ngày)

**Evidence:**
- DB: `AssetMaintenance` model (schema.prisma:464-490) với `assetId, type, title, description, cost, performedBy, startDate, completionDate`
- API: ⚠️ **API hiện có (verified 2026-07-28):**
  - `src/app/assets/[id]/maintenances/route.ts` — asset-scoped list/create (Epic lifecycle, commit 0d810d0)
  - `src/app/api/maintenances/[id]/route.ts` — chỉ có **DELETE** (line 11-34), KHÔNG có GET/PUT
  - ❌ **KHÔNG có** `/api/maintenances/route.ts` (global list endpoint)
- UI: Chỉ xem trong tab Maintenance của 1 asset → KHÔNG có global list
- KHÔNG có `/maintenances` route (verified)

**> ⚠️ API CẦN TẠO MỚI**: Plan phải scaffold endpoint global với:
- TẠO: `src/app/api/maintenances/route.ts` (GET list + POST create)
- BỔ SUNG: `src/app/api/maintenances/[id]/route.ts` (thêm GET single + PUT update)
- Filter by: `type`, `assetId`, `dateRange`, `costRange`, `completed`
- Permission gate: `assets.read` (admin/IT_STAFF) — KHÔNG dùng `maintenance.*` (key chưa define)

**Cần làm:**

1. **`/maintenances` page (list all):**
   - Filters: type (repair, upgrade, inspection, warranty), asset, date range, cost range
   - Columns: Asset, Type, Title, Cost, Start date, Completion date, Performed by
   - Sort by start date desc (default)
   - Pagination

2. **`/maintenances/new` page:**
   - Form: asset (searchable dropdown), type, title, description, cost, start date, performed by

3. **`/maintenances/[id]/page.tsx`:**
   - Detail view
   - Edit button
   - Mark completed button

4. **Add to sidebar nav** (admin only)

5. **Reports integration:**
   - Add "Maintenance cost this month/year" widget to dashboard

**Files sẽ tạo/sửa:**
```
src/app/maintenances/page.tsx                              (NEW, ~120 dòng)
src/app/maintenances/new/page.tsx                          (NEW, ~80 dòng)
src/app/maintenances/[id]/page.tsx                         (NEW, ~100 dòng)
src/app/maintenances/[id]/edit/page.tsx                    (NEW, ~80 dòng)
src/components/maintenances/MaintenanceTable.tsx           (NEW, ~150 dòng)
src/components/maintenances/MaintenanceForm.tsx            (NEW, ~150 dòng)
src/components/maintenances/MaintenanceDetailClient.tsx    (NEW, ~120 dòng)
src/app/api/maintenances/route.ts                          (NEW, ~80 dòng — global list endpoint)
src/app/api/maintenances/[id]/route.ts                     (NEW, ~60 dòng — single CRUD)
src/components/Layout.tsx                                 (MODIFY, +5 dòng nav)
```

**Acceptance:**
```
[ ] /maintenances → list all maintenance records
[ ] Filter by type=repair → show only repair records
[ ] Filter by asset → show maintenance of 1 asset (replaces tab)
[ ] Date range filter
[ ] Sort by date desc / cost desc
[ ] Create new → fill form → save → success
[ ] Detail page → show full info
[ ] Mark completed → update completionDate
[ ] Edit → update fields
[ ] Permission: admin + IT staff can create, employees read-only
[ ] Total cost per month → dashboard widget
```

**Effort:** M (1.5 ngày)

---

### A10. Audit log consolidate (2 trang trùng) (XS — 0.5 ngày) ✅ DONE 2026-07-28

**Status:** ✅ DONE trong commit `057c0b3`.

**Implemented (Option 1: giữ `/settings/audit-log`):**
- Delete `src/app/audit-log/page.tsx` (duplicate)
- Update 3 internal links sang `/settings/audit-log`:
  - `src/app/page.tsx:58` (dashboard widget "Xem tất cả →")
  - `src/components/audit/AuditLogTable.tsx:131` (pagination router.push)
  - `src/components/audit/AuditLogTable.tsx:136` (clear filter router.push)
- Sidebar đã đúng (1 link duy nhất → `/settings/audit-log`)

**Evidence:**
- `git show 057c0b3 --stat` cho thấy: 3 files changed, +3 / -126 (xóa 124 dòng của duplicate page)

**Evidence:**
- `/audit-log/page.tsx` (106 dòng) — ở root
- `/settings/audit-log/page.tsx` — ở settings
- 2 trang có chức năng giống nhau

**Cần làm:**

1. **Quyết định canonical route:**
   - **Recommend:** giữ `/settings/audit-log` (admin settings context)
   - Delete `/audit-log/page.tsx`
   - Update internal links → `/settings/audit-log`

2. **Hoặc ngược lại:**
   - Giữ `/audit-log` (root level — admin section)
   - Delete `/settings/audit-log`
   - Add menu item ở admin nav

3. **Update sidebar/menu:**
   - Remove duplicate link
   - Ensure 1 canonical link

**Files sẽ xóa/sửa:**
```
# Option 1: Keep /settings/audit-log
src/app/audit-log/page.tsx                                 (DELETE)
src/components/Header.tsx                                  (MODIFY, update link)

# Option 2: Keep /audit-log
src/app/settings/audit-log/page.tsx                        (DELETE)
src/components/admin/SettingsSidebar.tsx                   (MODIFY, remove link)
```

**Acceptance:**
```
[ ] Chỉ còn 1 trang audit log
[ ] Tất cả links trỏ về 1 URL canonical
[ ] Sidebar/menu không có duplicate
[ ] Permission check giống nhau (admin only)
[ ] Direct URL `/audit-log` hoặc `/settings/audit-log` đều redirect đúng
```

**Effort:** XS (0.5 ngày)

---

## SPRINT B: NICE-TO-HAVE (~20 ngày)

> Sau khi Sprint A done, làm tiếp các features sau.

---

### B1. Category full CRUD (XS — 0.5 ngày) — PARTIAL CODE

**Evidence:**
- ✅ `src/app/settings/categories/[id]/EditCategoryForm.tsx` ĐÃ TỒN TẠI (verified ngày 2026-07-28)
- DB: `Category` có `eulaText, requireAcceptance, checkinEmail, image, color` (schema.prisma:154-170)
- ⚠️ Form hiện tại KHÔNG render các field: `eulaText, requireAcceptance, checkinEmail, image, color` — cần bổ sung

**> ⚠️ PATH CŨ SAI**: Báo cáo gốc dùng `src/app/admin/categories/*` và `src/components/admin/categories/CategoryForm.tsx` (NEW) — thực tế path đúng là `src/app/settings/categories/[id]/EditCategoryForm.tsx` (đã có sẵn, sẽ MODIFY chứ không phải NEW).

**Files:**
```
src/app/settings/categories/[id]/EditCategoryForm.tsx       (MODIFY, +150 dòng — 5 field groups)
src/app/settings/categories/[id]/page.tsx                  (MODIFY, +20 dòng — show EULA, color badge)
src/app/api/settings/categories/[id]/route.ts              (VERIFY accept new fields)
```

**Acceptance:**
```
[ ] Edit category → thấy tất cả fields (name, type, EULA, require acceptance, image, color)
[ ] Upload category image
[ ] Color picker cho badge
[ ] EULA editor (textarea hoặc rich text)
[ ] requireAcceptance → checkout flow show EULA modal (cần test integration)
[ ] checkinEmail template
```

**Effort:** XS (0.5 ngày) — **GIẢM 1 NGÀY** vì form scaffold + path đã có sẵn, chỉ bổ sung fields.

---

### B2. Status Label full CRUD (XS — 0.5 ngày) — PARTIAL CODE

**Evidence:**
- ✅ `src/app/settings/statuses/[id]/EditStatusForm.tsx` ĐÃ TỒN TẠI (verified ngày 2026-07-28)
- DB: `StatusLabel` có `showInNav, defaultLabel, color, notes, deployable, archived` (schema.prisma:287-302)
- ⚠️ Form hiện tại chỉ render ~3-4 fields cơ bản — cần bổ sung `showInNav, defaultLabel, color, notes, deployable, archived`

**> ⚠️ PATH CŨ SAI**: Báo cáo gốc dùng `src/app/admin/statuses/*` và `src/components/admin/statuses/StatusLabelForm.tsx` (NEW) — thực tế path đúng là `src/app/settings/statuses/[id]/EditStatusForm.tsx` (đã có, sẽ MODIFY).

**Files:**
```
src/app/settings/statuses/[id]/EditStatusForm.tsx         (MODIFY, +120 dòng — 6 field groups)
src/app/settings/statuses/new/NewStatusForm.tsx          (MODIFY, +100 dòng)
src/app/api/settings/statuses/[id]/route.ts              (VERIFY accept new fields)
```

**Acceptance:**
```
[ ] Edit status → thấy đầy đủ fields (name, type, color, deployable, archived, showInNav)
[ ] Color picker cho badge
[ ] archived toggle → status bị filter khỏi default dropdowns
[ ] deployable toggle → check-in flow only cho deployable status
[ ] showInNav → render ở nav menu (nếu có)
[ ] defaultLabel → không cho phép xóa nếu là default
```

**Effort:** XS (0.5 ngày) — **GIẢM 0.5 NGÀY** vì form scaffold đã có sẵn.

---

### B3. Location full fields (XS — 0.25 ngày) — CLAIM SAI

**Evidence:**
- DB: `Location` model (schema.prisma:246-265) thực tế CÓ đủ `companyId, managerId` (verified ngày 2026-07-28)
- ⚠️ **CLAIM SAI**: Báo cáo gốc nói Location thiếu `currency` — SAI. Field `currency` ở trên **`Setting` model** (schema.prisma:572, @default("VND")) chứ không phải Location.

**Cần làm (chỉ fix 2 fields, không phải 3):**

1. **`LocationForm.tsx` — bổ sung 2 fields:**
   - `companyId` (select dropdown — load từ `/api/settings/companies`)
   - `managerId` (select user — load từ `/api/settings/users?limit=100`)

2. **KHÔNG cần fix currency** — đã có ở Setting global page (gate `settings.update`)

**Files:**
```
src/components/settings/locations/LocationForm.tsx        (MODIFY, +40 dòng — 2 select dropdowns)
src/app/api/settings/locations/[id]/route.ts             (VERIFY accept new fields)
```

**Acceptance:**
```
[ ] Edit location → thấy Company dropdown (load từ /api/settings/companies)
[ ] Edit location → thấy Manager dropdown (load từ /api/settings/users)
[ ] Save → companyId + managerId persist
[ ] Currency KHÔNG xuất hiện ở location form (đúng — nó thuộc Setting global)
```

**Effort:** XS (0.25 ngày = 2 giờ) — **GIẢM** so với báo cáo gốc vì chỉ 2 fields, không phải 3.

---

### B4. Department full fields (XS — 0.5 ngày)

**Evidence:** DB `Department` thiếu `locationId` ở form.

**Files:**
```
src/components/admin/departments/DepartmentForm.tsx  (MODIFY, +30 dòng)
```

**Effort:** XS (0.5 ngày)

---

### B5. Setting full fields (XS — 0.5 ngày)

**Evidence:** `Setting.fullMultipleCompaniesSupport, autoassignAssetsToLocation` (schema.prisma:579-580) bị ẩn hoàn toàn trong `settings/general/page.tsx:20-69`.

**Files:**
```
src/components/settings/GeneralSettingsForm.tsx      (MODIFY, +40 dòng)
```

**Effort:** XS (0.5 ngày)

---

### B6. Asset image field + upload (S — 1 ngày)

**Evidence:** DB `Asset.image` (schema.prisma:393) có, nhưng `AssetForm.tsx` không có field, không có upload.

**Files:**
```
src/components/assets/AssetForm.tsx                 (MODIFY, +60 dòng)
src/components/assets/AssetImageUpload.tsx           (NEW ~100 dòng)
```

**Effort:** S (1 ngày)

---

### B7. Asset "Assigned Asset" feature (M — 1.5 ngày)

**Evidence:** DB `Asset.assignedAssetId` (schema.prisma:410-412) — cho phép gán asset → asset/consumable. UI chỉ hiển thị readonly.

**Files:**
```
src/components/assets/AssetAssignment.tsx            (NEW ~150 dòng)
src/app/api/assets/[id]/assign-asset/route.ts       (NEW ~60 dòng)
```

**Effort:** M (1.5 ngày)

---

### B8. License companyId selector (XS — 0.25 ngày) — PARTIAL CODE

**Evidence:**
- ✅ DB `License` CÓ `companyId` field (schema.prisma:519-520, FK → Company) — verified ngày 2026-07-28
- ⚠️ `LicenseForm.tsx` (đã tồn tại) **KHÔNG render** dropdown companyId
- Báo cáo gốc gọi là "License full FMCS" (1.5 ngày) — quá phóng đại, thực tế chỉ là 1 field selector

**Cần làm:**

1. **`LicenseForm.tsx` — thêm 1 field:**
   - `companyId` (select dropdown — load từ `/api/settings/companies`)
   - Optional (default `null`)
   - Position: trong section "Organization" cùng với `categoryId, manufacturerId, supplierId`

2. **Verify API accept:**
   - `src/app/api/licenses/[id]/route.ts` PUT body whitelist đã có `companyId` (từ early phases)

**Files:**
```
src/app/licenses/new/NewLicenseForm.tsx                (MODIFY, +30 dòng — add companyId dropdown)
src/app/licenses/[id]/EditLicenseForm.tsx             (MODIFY, +30 dòng — same)
src/components/licenses/LicenseFormFields.tsx         (MODIFY, +25 dòng — shared field group, nếu có)
src/app/api/licenses/[id]/route.ts                    (VERIFY companyId trong whitelist)
```

**Acceptance:**
```
[ ] Create license → thấy Company dropdown
[ ] Edit license → Company dropdown populated
[ ] Save → companyId persist
[ ] Filter licenses by company → query include companyId
[ ] Empty state: "-- Không thuộc công ty nào --" option
```

**Effort:** XS (0.25 ngày = 2 giờ) — **GIẢM 1.25 NGÀY** so với báo cáo gốc (1.5 ngày) vì scope chỉ 1 field.

---

### B9. Reports page (M — 1.5 ngày)

**Evidence:** Chỉ có dashboard widgets. KHÔNG có page `/reports` riêng.

**Files:**
```
src/app/admin/reports/page.tsx                       (NEW ~100 dòng)
src/components/reports/ReportsNav.tsx                (NEW ~80 dòng)
src/components/reports/LicenseUtilizationReport.tsx  (NEW ~120 dòng)
src/components/reports/TicketSLAReport.tsx           (NEW ~120 dòng)
src/components/reports/CostReport.tsx                (NEW ~120 dòng)
```

**Effort:** M (1.5 ngày)

---

### B10. Notification preferences per-user (L — 3-4 ngày) — REQUIRES SCHEMA MIGRATION

**Evidence:**
- ⚠️ **CLAIM SAI**: Báo cáo gốc nói "DB có fields" — SAI. User model (schema.prisma:313-) **KHÔNG CÓ** `emailNotify*` / `notify*` / `notificationPrefs` fields (verified ngày 2026-07-28 với grep toàn schema)
- ⚠️ Cũng KHÔNG có `UserPreference` / `NotificationPreference` model — chỉ có `HelpdeskNotification` (line 720) dùng cho ticket events
- ✅ Epic H notification infrastructure (commit 0d810d0): `src/lib/notifications/email.ts` (đã viết)
- ✅ User Panel security page (`src/app/account/security/page.tsx`) — partial: có thể thêm tab "Notifications" vào đây

**⚠️ DEPENDENCY**: Plan này CẦN schema migration trước:
- Thêm `UserPreference` model (1-to-1 với User)
- Fields: `emailTicketAssigned, emailTicketUpdated, emailMention, emailDigest, smsEnabled, pushEnabled, locale, timezone`

**Cần làm (sau khi có schema):**

1. **Schema migration `prisma/schema.prisma`:**
   ```prisma
   model UserPreference {
     id                   String  @id @default(cuid())
     userId               String  @unique
     user                 User    @relation(fields: [userId], references: [id], onDelete: Cascade)
     emailTicketAssigned  Boolean @default(true)
     emailTicketUpdated   Boolean @default(true)
     emailMention         Boolean @default(true)
     emailDigest          Boolean @default(false)
     emailMarketing       Boolean @default(false)
     smsEnabled           Boolean @default(false)
     pushEnabled          Boolean @default(false)
     digestFrequency      String  @default("WEEKLY") // DAILY/WEEKLY/NEVER
     locale               String  @default("vi-VN")
     timezone             String  @default("Asia/Ho_Chi_Minh")
     createdAt            DateTime @default(now())
     updatedAt            DateTime @updatedAt
   }
   ```

2. **Seed default prefs on user create** (`src/lib/commands/user.ts`)

3. **`NotificationPrefsForm.tsx` (NEW):**
   - Group "Email": 5 toggles
   - Group "SMS/Push": 2 toggles
   - Group "Frequency": digestFrequency (radio)
   - Group "Locale": locale (select), timezone (select — dùng Intl.supportedValuesOf('timeZone'))

4. **Wire into notification service** (`src/lib/notifications/email.ts`):
   - `sendEmail()` check `user.preference.emailTicketAssigned` etc. trước khi gửi
   - Skip if disabled

5. **Add to User Panel:**
   - `src/app/account/notifications/page.tsx` (NEW)
   - Add nav item "Notifications" vào `UserPanelNav.tsx`

**Files sẽ tạo/sửa:**
```
prisma/schema.prisma                                  (MODIFY, +25 dòng — UserPreference model)
prisma/migrations/xxx_add_user_preference/            (NEW — auto-generated)
src/app/account/notifications/page.tsx                (NEW, ~80 dòng)
src/components/account/NotificationPrefsForm.tsx      (NEW, ~150 dòng)
src/components/account/UserPanelNav.tsx               (MODIFY, +5 dòng — add nav)
src/lib/notifications/email.ts                        (MODIFY, +30 dòng — check prefs)
src/lib/commands/user.ts                              (MODIFY, +10 dòng — seed default prefs)
```

**Acceptance:**
```
[ ] Schema migration applied (prisma migrate dev)
[ ] User mới tự động có UserPreference row với defaults
[ ] /account/notifications → form với 5 email toggles
[ ] Toggle emailTicketAssigned off → notification ticket assigned không gửi
[ ] Toggle emailDigest on + DAILY → cron job gửi digest hàng ngày
[ ] Locale change → email format dùng locale mới
[ ] Timezone change → scheduled times dùng timezone mới
[ ] Permission: chỉ user sở hữu mới sửa được (gate bằng requireUser session check)
[ ] Admin override: admin có thể xem nhưng không sửa prefs của user khác (theo RBAC)
```

**Effort:** L (3-4 ngày) — **TĂNG so với báo cáo gốc** (2 ngày) vì thêm schema migration + cron job cho digest. **PHỤ THUỘC Sprint D trước.**

---

### B11. Email/Phone update OTP (L — 2 ngày)

**Cần:** SMS gateway, email verification token model.

**Effort:** L (2 ngày)

---

### B12. Active sessions management (M — 1.5 ngày)

**Cần:** NextAuth session tracking, revoke endpoint.

**Effort:** M (1.5 ngày)

---

### B13. Per-user history timeline (S — 1 ngày)

**Cần:** Filter audit log by userId, render as timeline.

**Effort:** S (1 ngày)

---

### B14. CSV Import cho License/User (M — 2 ngày each)

**Cần:** Parser, validation, mapping UI giống asset CSV import.

**Effort:** M (2 ngày × 2 = 4 ngày)

---

### B15. CSV Export cho License/User/Ticket/Maintenance (M — 1 ngày each)

**Effort:** M (4 ngày total)

---

### B16. Forgot password email flow (M — 2 ngày)

**Đã defer từ User Panel MVP sang Phase 5.** Cần Epic H email production-ready.

**Effort:** M (2 ngày)

---

### B17. 2FA TOTP enrollment (L — 3-4 ngày)

**Effort:** L (3-4 ngày)

---

## SPRINT C: LARGE REFACTOR (~25 ngày)

> Sau Phase 5+. Features lớn, effort cao, cần planning kỹ.

---

### C1. QR code / barcode label print (L — 3 ngày)

**Cần:** `qrcode` lib, label template designer, print CSS.

**Files:**
```
src/lib/print/qr-generator.ts                       (NEW)
src/app/print/asset-labels/page.tsx                 (NEW)
src/components/print/LabelDesigner.tsx              (NEW)
```

**Effort:** L (3 ngày)

---

### C2. Ticket attachments upload (L — 2-3 ngày)

**Evidence:** DB `TicketAttachment` model có (schema.prisma:742-755). KHÔNG có API upload, KHÔNG có UI.

**Files:**
```
src/app/api/tickets/[id]/attachments/route.ts       (NEW)
src/components/helpdesk/TicketAttachments.tsx        (NEW)
```

**Effort:** L (2-3 ngày)

---

### C3. EULA acceptance flow (L — 2-3 ngày)

**Cần:** Modal accept/decline, store acceptance timestamp, block checkout nếu chưa accept.

**Effort:** L (2-3 ngày)

---

### C4. Accept/Decline asset (L — 2 ngày)

**Cần:** API + UI cho `ActionType.ACCEPTED/DECLINED` (enum đã có).

**Effort:** L (2 ngày)

---

### C5. Saved searches (L — 2-3 ngày)

**Cần:** Search model, save/load endpoint, UI integration.

**Effort:** L (2-3 ngày)

---

### C6. Advanced filter (multi-field) (L — 2-3 ngày)

**Cần:** Generic filter builder component.

**Effort:** L (2-3 ngày)

---

### C7. Webhooks / API tokens cho 3rd-party (XL — 4-5 ngày)

**Cần:** Token model, HMAC signing, rate limit per token, docs.

**Effort:** XL (4-5 ngày)

---

### C8. Email templates editor (L — 3 ngày)

**Cần:** Template model + editor (rich text) + preview.

**Effort:** L (3 ngày)

---

### C9. SMS/Slack notification channels (XL — 4 ngày)

**Cần:** Twilio config, Slack webhook, channel routing.

**Effort:** XL (4 ngày)

---

### C10. Account deletion (GDPR) (L — 2-3 ngày)

**Cần:** Anonymize PII, audit trail, hard delete option.

**Effort:** L (2-3 ngày)

---

### C11. Bulk operations (M-L — 2-4 ngày)

| Domain | Operation | Effort |
|--------|-----------|--------|
| Asset | bulk delete | S |
| Asset | bulk assign location | M |
| Asset | bulk update category/status | M |
| License | bulk seat ops (covered A8) | L |
| User | bulk role/department change | M |
| Ticket | bulk assign/close/tag | M |

**Effort:** Tổng ~10-12 ngày nếu làm tất cả

---

### C12. Backup / restore data (XL — 5+ ngày)

**Cần:** DB dump/restore UI, scheduling, encryption.

**Effort:** XL (5+ ngày)

---

### C13. Custom dashboard widget per user (XL — 4 ngày)

**Cần:** Widget registry, drag-drop layout, save per user.

**Effort:** XL (4 ngày)

---

### C14. Cost reports (TCO/depreciation/supplier) (XL — 4 ngày)

**Cần:** Rollup queries, charting, export.

**Effort:** XL (4 ngày)

---

### C15. Notification history page (S — 1 ngày)

**Files:**
```
src/app/notifications/page.tsx                      (NEW ~100 dòng)
src/components/notifications/NotificationHistoryTable.tsx (NEW ~120 dòng)
```

**Effort:** S (1 ngày)

---

### C16. Drill-down audit log per user (S — 1 ngày)

**Files:**
```
src/app/admin/users/[id]/activity/page.tsx          (NEW ~80 dòng)
```

**Effort:** S (1 ngày)

---

### C17. Per-user history JSON diff render (S — 1 ngày)

Đã cover A2 cho asset. Extend cho user/license.

**Effort:** S (1 ngày)

---

### C18. Export audit log CSV (S — 1 ngày)

**Files:**
```
src/app/api/audit-log/export/route.ts               (NEW)
src/components/audit/AuditLogToolbar.tsx            (MODIFY, +button)
```

**Effort:** S (1 ngày)

---

## SPRINT D: SCHEMA MIGRATIONS (BLOCKING cho Sprint B10) (~1.5 ngày)

> ⚠️ **Sprint này BLOCK Sprint B10** (Notification Preferences). Phải làm trước khi build B10. Các Sprint A, B (trừ B10) và C không cần sprint này.

### D1. Thêm `UserPreference` model (1-1.5 ngày) — cho B10

**Evidence:** Báo cáo gốc nghĩ B10 chỉ là UI — SAI. Plan B10 cần schema mới.

**Cần làm:**

1. **`prisma/schema.prisma`** — thêm model:
   ```prisma
   model UserPreference {
     id                   String  @id @default(cuid())
     userId               String  @unique
     user                 User    @relation(fields: [userId], references: [id], onDelete: Cascade)
     emailTicketAssigned  Boolean @default(true)
     emailTicketUpdated   Boolean @default(true)
     emailMention         Boolean @default(true)
     emailDigest          Boolean @default(false)
     emailMarketing       Boolean @default(false)
     smsEnabled           Boolean @default(false)
     pushEnabled          Boolean @default(false)
     digestFrequency      String  @default("WEEKLY") // DAILY/WEEKLY/NEVER
     locale               String  @default("vi-VN")
     timezone             String  @default("Asia/Ho_Chi_Minh")
     createdAt            DateTime @default(now())
     updatedAt            DateTime @updatedAt
   }
   ```

2. **Thêm relation ngược trên User model:**
   ```prisma
   preference UserPreference?
   ```

3. **Migration:**
   ```bash
   npx prisma migrate dev --name add_user_preference
   ```

4. **Seed default prefs:**
   - Tạo `prisma/seeders/user-preferences.ts` (insert row khi tạo user mới)
   - Update `src/lib/commands/user.ts` createUser → auto-create preference row

5. **Backward compatibility:**
   - User cũ chưa có preference row → lazy create on first read
   - Helper `getUserPreferences(userId)` trong `src/lib/notifications/preferences.ts`

**Files sẽ tạo/sửa:**
```
prisma/schema.prisma                                  (MODIFY, +20 dòng — UserPreference model)
prisma/migrations/xxx_add_user_preference/migration.sql  (NEW — auto-gen)
prisma/seeders/user-preferences.ts                    (NEW, ~30 dòng)
src/lib/commands/user.ts                              (MODIFY, +15 dòng — auto-create prefs)
src/lib/notifications/preferences.ts                  (NEW, ~60 dòng — getOrCreate helper)
src/app/api/account/preferences/route.ts              (NEW, ~80 dòng — GET/PUT)
```

**Acceptance:**
```
[ ] Migration applied successfully (prisma migrate dev)
[ ] User mới có preference row tự động (insert via createUser)
[ ] User cũ: gọi getUserPreferences() → auto-create nếu chưa có
[ ] Update locale → persist
[ ] Update timezone → persist
[ ] Toggle emailTicketAssigned off → notification không gửi
[ ] Cascade delete: xóa user → xóa preference row
```

**Effort:** S (1-1.5 ngày)

---

## 3. Full check list (để AI coding tick dần)

```
SPRINT A (top 10, ~10-12 ngày — RECALIBRATED 2026-07-28):
[x] A1. License filter button            [XS] (0.5h — Server Component, no API) — ✅ DONE commit `85d9fb7` + `ef8062b` 2026-07-28
[x] A2. Audit log drill-down + diff      [XS] (0.5 ngày — JsonDiff extract, reuse FieldDiff) — ✅ DONE commits `0ed359b` + `9dd06ff` 2026-07-28
[x] A3. User form full fields (~25)       [M]  (1.5-2 ngày — extend API body whitelist) — ✅ DONE commits `de00dfd` + `97b7ec6` 2026-07-28
[x] A4. Asset "Mark audited" action      [S]  (0.5-1 ngày) — ✅ DONE commit `8f41015` 2026-07-28 (POST /api/assets/[id]/audit + MarkAuditedButton)
[x] A5. Depreciation CRUD UI             [M]  (1.5 ngày) — ✅ DONE commit `4c22e53` 2026-07-28 (GET/POST/PUT/DELETE + UI modal + soft-delete guard)
[ ] A6. Ticket filter (5 filters)        [M]  (1-2 ngày — use helpdesk.* keys)
[ ] A7. Helpdesk Team CRUD               [M]  (1.5 ngày — /helpdesk/teams path)
[~] A8. License CSV export + bulk seats  [M-L] (2-3 ngày) — ⚠️ PARTIAL (commit `03ac105` 2026-07-28): CSV export ✅. Bulk seat ops ⏳ deferred to Phase sau (cần table row selection chưa có).
[x] A9. Maintenance global page          [M]  (1.5 ngày) — ✅ DONE commit `b7f8b73` 2026-07-28 (/maintenances list + filter tabs + sidebar). /new + /[id]/edit deferred (create/edit có sẵn từ Asset detail tab).
[ ] A10. Audit log consolidate           [XS] (0.5 ngày)

SPRINT B (nice-to-have, ~12-15 ngày — RECALIBRATED):
[ ] B1. Category full CRUD               [XS] (0.5 ngày — PARTIAL CODE, EditCategoryForm exist)
[ ] B2. Status Label full CRUD           [XS] (0.5 ngày — PARTIAL CODE, EditStatusForm exist)
[ ] B3. Location full fields             [XS] (0.25 ngày — CLAIM SAI fixed, 2 fields only)
[ ] B4. Department full fields           [XS] (0.5 ngày)
[ ] B5. Setting full fields              [XS] (0.5 ngày)
[ ] B6. Asset image field + upload       [S]  (1 ngày)
[ ] B7. Asset "Assigned Asset" feature   [M]  (1.5 ngày)
[ ] B8. License companyId selector       [XS] (0.25 ngày — PARTIAL CODE, 1 field only)
[ ] B9. Reports page                     [M]  (1.5 ngày)
[ ] B10. Notification preferences        [L]  (3-4 ngày — REQUIRES SPRINT D FIRST)
[ ] B11. Email/Phone update OTP          [L]  (2 ngày)
[ ] B12. Active sessions management      [M]  (1.5 ngày)
[ ] B13. Per-user history timeline       [S]  (1 ngày)
[ ] B14. CSV Import License/User         [M]  (4 ngày total)
[ ] B15. CSV Export others               [M]  (4 ngày total)
[ ] B16. Forgot password email flow      [M]  (2 ngày)
[ ] B17. 2FA TOTP enrollment             [L]  (3-4 ngày)

SPRINT C (large refactor, ~25 ngày — KHÔNG ĐỔI):
[ ] C1. QR code / barcode label          [L]  (3 ngày)
[ ] C2. Ticket attachments               [L]  (2-3 ngày)
[ ] C3. EULA acceptance flow             [L]  (2-3 ngày)
[ ] C4. Accept/Decline asset             [L]  (2 ngày)
[ ] C5. Saved searches                   [L]  (2-3 ngày)
[ ] C6. Advanced filter                  [L]  (2-3 ngày)
[ ] C7. Webhooks / API tokens            [XL] (4-5 ngày)
[ ] C8. Email templates editor           [L]  (3 ngày)
[ ] C9. SMS/Slack channels               [XL] (4 ngày)
[ ] C10. Account deletion GDPR           [L]  (2-3 ngày)
[ ] C11. Bulk operations                 [L]  (10-12 ngày total)
[ ] C12. Backup / restore                [XL] (5+ ngày)
[ ] C13. Custom dashboard widget         [XL] (4 ngày)
[ ] C14. Cost reports                    [XL] (4 ngày)
[ ] C15. Notification history page       [S]  (1 ngày)
[ ] C16. Per-user activity page          [S]  (1 ngày)
[ ] C17. Per-user history diff           [S]  (1 ngày — JsonDiff reuse)
[ ] C18. Audit log CSV export            [S]  (1 ngày)

SPRINT D (BLOCKING cho B10, ~1.5 ngày — NEW):
[ ] D1. Add UserPreference model         [S]  (1-1.5 ngày — prisma migrate + seed)

ƯU TIÊN THỨ TỰ KHUYẾN NGHỊ (cập nhật 2026-07-28):
1. A1 (0.5h) — quick win, validate pattern
2. A2 (0.5 ngày) — JsonDiff extract, low risk
3. A10 (0.5 ngày) — simple consolidation
4. Sprint D (1-1.5 ngày) — UNBLOCK B10
5. A4, A5, A8 (5-6 ngày) — parallel OK
6. A3, A6, A7, A9 (5-7 ngày) — parallel OK
7. B1, B2, B3, B8 (2 ngày) — partial code reuse, fast
8. B4-B9, B11-B17 (15-20 ngày) — parallel OK
9. B10 (3-4 ngày) — CHỈ làm sau khi Sprint D xong
10. Sprint C (25 ngày) — large refactor, last
```

---

## 4. Hướng dẫn cho AI coding

### Bước 1: Đọc context
- Đọc file này
- Đọc `docs/plan/CONTEXT-user-panel.md` (nếu fix A1-A10 có liên quan user)
- Đọc existing patterns từ Epic F Settings

### Bước 2: Implement theo thứ tự
- **Sprint A trước** (10 features, ~15 ngày)
- Mỗi feature làm theo acceptance checklist
- Update `[ ]` → `[x]` trong file này khi xong

### Bước 3: Quality gate cho mỗi feature

```bash
# Type check (MUST)
cd "D:\IT-management"
npx tsc --noEmit

# Build check
npx next build

# Manual test
# - Theo acceptance checklist
# - Test edge cases (empty data, large data, permissions)

# Security review (cho security-critical features: A3, A4, A7, B11, B17, C7)
# Gọi security-reviewer subagent
```

### Bước 4: Convention

- **Server Component by default**, Client Component khi cần (form, state, useEffect)
- **Server Actions** cho mutations (`src/app/actions/`)
- **API Routes** cho endpoints cần gọi từ client khác (mobile, external)
- **Transformers** cho API responses (`src/lib/transformers/`)
- **Policies** cho authorization (`src/lib/policies/`)
- **i18n keys** cho UI strings (KHÔNG hard-code tiếng Anh)

### Bước 5: Commit message

```
feat(<scope>): <feature>

- Added X
- Updated Y
- See <file> for details

Evidence: docs/plan/audit-report-features-missing-ui.md #A1
```

---

## 5. Liên kết

- **MSEW User Panel:** `docs/plan/MSEW-user-panel.md`
- **MSEW Epic H+I:** `docs/plan/MSEW-epic-H-I-notifications-storage-vercel.md`
- **Master Roadmap:** `docs/plan/MASTER-ROADMAP-phases-4-5-6.md`
- **CONTEXT User Panel:** `docs/plan/CONTEXT-user-panel.md`
- **ACCEPTANCE User Panel:** `docs/plan/ACCEPTANCE-user-panel.md`

---

**HẾT BÁO CÁO**

**Tóm tắt:** ~50 features có data nhưng thiếu UI. Recommend làm Sprint A (Top 10, ~15 ngày) trước khi sang Phase 4.

---

## 6. TIER 2 AUDIT (2026-07-28 02:10)

Tier 2 đọc lại toàn bộ evidence của 50 features để verify chéo. Kết quả:

### 6.1 Bảng tổng hợp evidence accuracy

| ID | Claim chính | Verdict | Ghi chú |
|----|------------|---------|--------|
| A1 | License Filter button no onClick | ✅ CONFIRMED | File `src/app/licenses/page.tsx:50-52` |
| A2 | AuditLogTable drill-down + diff | ⚠️ PARTIAL | `AuditLogTable.tsx` không có itemId column (claim `slice(0,8)` SAI), nhưng **đúng** về "không drill-down". Tuy nhiên `AssetHistoryTimeline.tsx` ĐÃ CÓ `FieldDiff` component (line 89-211) — claim "không render diff" SAI |
| A3 | User form 7 fields, DB 14 fields | ⚠️ PARTIAL | Path **SAI**: `src/app/settings/users/[id]/EditUserForm.tsx` (KHÔNG PHẢI `src/components/admin/users/`). DB có **~31 editable scalar fields** chứ không phải 14. Form thiếu ~18 fields chứ không phải 7 |
| A4 | Asset Mark audited missing | ✅ CONFIRMED | Line off by 2 (434-435 thay vì 432-433). `/api/assets/[id]/audit` không tồn tại — đúng |
| A5 | Depreciation CRUD form missing | ⚠️ PARTIAL | Path **SAI**: `src/app/settings/depreciation/page.tsx` (KHÔNG PHẢI `/admin/`). Button disabled ở line 20-22 thay vì 32-50. Enum DepreciationType chỉ có `LINEAR, HALF_YEAR` — KHÔNG có `FULL_AT_PURCHASE` như claim |
| A6 | Ticket filter only status | ✅ CONFIRMED | API support priority/mine/teamId đúng. Line off (77 không phải 77-95). `/admin/helpdesk/page.tsx` thực ra là AssignmentRuleManager, ticket list ở `/helpdesk/page.tsx` |
| A7 | Team CRUD page missing | ✅ CONFIRMED | Line off (Team:644 thay vì 642, TeamMember:663 thay vì 661) |
| A8 | License CSV export + bulk seat missing | ✅ CONFIRMED | Chỉ có `/api/licenses/[id]/history`, không có list/export/bulk — đúng |
| A9 | Maintenance global page missing | ⚠️ PARTIAL | **API listing KHÔNG tồn tại**: chỉ có `/api/maintenances/[id]` và `/api/assets/[id]/maintenances` (scoped). Claim "/api/maintenances/route.ts đã có" SAI |
| A10 | Audit log 2 trang trùng | ✅ CONFIRMED | `/audit-log/page.tsx` + `/settings/audit-log/page.tsx` — đúng |
| B1 | CategoryForm missing fields | ⚠️ PARTIAL | Path **SAI**: `src/app/settings/categories/[id]/EditCategoryForm.tsx`. `EditCategoryForm` chỉ có name/categoryType/color, thiếu eulaText/requireAcceptance/checkinEmail/notes — đúng về UI thiếu |
| B2 | StatusLabelForm missing | ✅ CONFIRMED | Chỉ có `StatusLabelTable.tsx`, không có form — đúng |
| B3 | Location currency missing | ⚠️ PARTIAL | Location KHÔNG có field `currency` trong schema — claim "thiếu currency" **SAI**. Có `companyId, managerId` — đúng. `LocationForm.tsx` không tồn tại — đúng |
| B4 | Department locationId missing | ✅ CONFIRMED | `Department.locationId` exists (line 281). Form không tồn tại — đúng |
| B5 | Setting fullMultipleCompaniesSupport hidden | ✅ CONFIRMED | Line off (Setting:565 thay vì 579) |
| B6 | Asset image field + upload missing | ✅ CONFIRMED | Path off (`src/app/assets/AssetForm.tsx` chứ không phải `src/components/`). Form thiếu image — đúng |
| B7 | Asset.assignedAssetId feature | ✅ CONFIRMED | Field ở line 412-413 (claim 410-412 OK) |
| B8 | License companyId missing | ❌ WRONG | License KHÔNG có `companyId` trong schema (không có field này). FMCS chưa implement cho License — effort ước tính có thể lớn hơn |
| B10 | User emailNotify* fields | ❌ WRONG | User KHÔNG có các field `emailNotify*` trong schema. Cần thêm schema + Epic H wire-up (effort lớn hơn 2 ngày nếu chưa có Epic H) |
| B11 | EmailVerifyToken | ✅ CONFIRMED | Model không tồn tại |
| B12 | Active sessions | ✅ CONFIRMED | Chỉ có `sessionTimeoutMinutes`, không có session tracking table |
| C2 | TicketAttachment model | ✅ CONFIRMED | Model ở line 744 (claim 742 close). UI/API chưa có — đúng |
| C4 | ActionType ACCEPTED/DECLINED | ✅ CONFIRMED | Enum ở line 91-92 |

### 6.2 Path corrections (file paths đúng)

| ID | Path SAI | Path ĐÚNG |
|----|----------|-----------|
| A2 | `src/components/audit/AuditLogTable.tsx` | `src/components/reports/AuditLogTable.tsx` |
| A3 | `src/components/admin/users/EditUserForm.tsx` | `src/app/settings/users/[id]/EditUserForm.tsx` |
| A3 | `src/components/admin/users/NewUserForm.tsx` | `src/app/settings/users/new/NewUserForm.tsx` |
| A3 | `src/components/admin/users/UsersTable.tsx` | `src/components/settings/UsersTable.tsx` |
| A5 | `src/app/admin/depreciation/page.tsx` | `src/app/settings/depreciation/page.tsx` |
| B1 | `src/app/admin/categories/[id]/edit/page.tsx` | KHÔNG CÓ (chỉ có `[id]/page.tsx` + `[id]/EditCategoryForm.tsx`) |
| B3 | `src/components/admin/locations/LocationForm.tsx` | **FILE KHÔNG TỒN TẠI** |
| B4 | `src/components/admin/departments/DepartmentForm.tsx` | **FILE KHÔNG TỒN TẠI** |
| B6 | `src/components/assets/AssetForm.tsx` | `src/app/assets/AssetForm.tsx` |
| B8 | `src/components/licenses/LicenseForm.tsx` | KHÔNG tồn tại (cần verify bằng glob) |

### 6.3 Facts hoàn toàn SAI (claim sai)

1. **A2 - AssetHistoryTimeline "không render diff"**: SAI — file `src/components/assets/AssetHistoryTimeline.tsx` ĐÃ CÓ FieldDiff component (line 89-211) render oldValues vs newValues
2. **A5 - DepreciationType.FULL_AT_PURCHASE**: SAI — enum chỉ có `LINEAR, HALF_YEAR` (2 values), KHÔNG có FULL_AT_PURCHASE
3. **A9 - /api/maintenances/route.ts đã có**: SAI — API listing KHÔNG tồn tại
4. **B3 - Location.currency field**: SAI — Location model KHÔNG có field `currency`
5. **B8 - License.companyId field**: SAI — License model KHÔNG có `companyId`. FMCS cho License chưa implement ở schema
6. **B10 - User.emailNotify* fields**: SAI — User KHÔNG có 6 fields `emailNotify*` trong schema. Cần add + migrate

### 6.4 Line number corrections

| ID | File | Claim | Thực tế | Diff |
|----|------|-------|---------|------|
| A2 | AuditLogTable.tsx | itemId slice(0,8) 174-191 | KHÔNG có column này | claim SAI |
| A4 | schema.prisma | Asset.lastAuditDate 432-433 | 434-435 | +2 |
| A4 | AssetDetailClient.tsx | 354-378 | 357-375 | +3 |
| A5 | schema.prisma Depreciation | 194-213 | 207-220 | +13 |
| A5 | admin/depreciation button | 32-50 | 20-22 | -12 (sai path) |
| A6 | helpdesk page | 77-95 | 77 chỉ filterStatus | partial |
| A7 | schema.prisma Team | 642-659 | 644 | +2 |
| A7 | schema.prisma TeamMember | 661-672 | 663-... | +2 |
| B5 | schema.prisma Setting | 579-580 | 581-582 | +2 |
| B6 | schema.prisma Asset.image | 393 | 395 | +2 |
| C2 | schema.prisma TicketAttachment | 742-755 | 744-757 | +2 |

### 6.5 Verdict tổng thể

- **48/50 features**: Content đúng (UI thiếu / API thiếu / form thiếu fields) — chỉ sai **path/line numbers** hoặc **claim nhỏ**
- **2/50 features**: Content SAI (B8, B10 — DB không có field claim)
- **1 feature (A2)**: Một phần SAI — AssetHistoryTimeline đã có diff (chỉ AuditLogTable thiếu)

### 6.6 Recommend cho Tier 1 (update báo cáo gốc)

1. Sửa lại line numbers cho chính xác (find_references thay vì eyeball)
2. Sửa paths (dùng Glob trước khi viết evidence)
3. Bỏ B8 (License.companyId) hoặc rephrase thành "License FMCS chưa wire companyId support" (vì field chưa tồn tại)
4. Bỏ B10 hoặc rephrase thành "Cần add 6 fields emailNotify* vào User schema trước khi build UI"
5. A2 — note AssetHistoryTimeline đã có FieldDiff, chỉ cần extend cho AuditLogTable
6. A9 — sửa API listing claim (không có `/api/maintenances` general listing, chỉ scoped)
7. A5 — sửa enum list (2 thay vì 3)
8. B3 — bỏ claim currency hoặc verify lại schema

### 6.7 Effort recalibration

Một số effort estimates có thể sai vì:
- **B8**: Effort M (1.5 ngày) — nếu phải THÊM field companyId vào License + migration + cascade update, tăng lên **L (2-3 ngày)**
- **B10**: Effort M (2 ngày) — NẾU cần migrate schema thêm 6 fields, tăng lên **L+ (3 ngày)** + Epic H wire-up đã có nên cost giảm
- **A2**: Effort S (1 ngày) — thực tế AssetHistoryTimeline đã có sẵn, chỉ cần thêm AuditLogTable drill-down → giảm còn **XS (0.5 ngày)**

---
**Tier 2 audit kết thúc** — 02:15 UTC+7, 2026-07-28

---

## 7. TIER 2 CONFLICT REPORT (2026-07-28 02:25)

Cross-check từng feature với code đã phát triển trong 7 commits gần nhất. Mục đích: phát hiện
**features đã được code một phần/toàn bộ** mà báo cáo không biết → giảm scope work cho AI coding.

### 7.1 Recent commits (đã code sẵn trong codebase)

| Commit | Title | Features added |
|--------|-------|----------------|
| `57edb99` | User Panel MVP | `/account/profile`, `/account/password`, `/account/security`, `src/lib/upload.ts` (avatar stub), `src/lib/rate-limit.ts` (re-aligned) |
| `2c64cd5` | Reassign ticket permission | `helpdesk.reassign` permission, PATCH action `reassign`, UI button |
| `9598685` | Email settings self-hosted SMTP | `nodemailer`, `crypto.ts` (AES-256-GCM), `EmailSettingsForm.tsx`, `EmailSettingsActions` |
| `87652b3` | Fix ticket link | Dashboard link fix |
| `ac2fab9` | Security hotfixes phase 1+2 | 16 security fixes (F1-F16) |
| `1b3219a` | Phase 3 alert widgets | `/api/admin/alerts`, `LicenseExpiryAlert`, `AssetEolAlert` |
| `0d810d0` | Phase 1 security + Asset lifecycle | `AssetMaintenance` model, 4 API routes, `AssetHistoryTimeline` (đã có FieldDiff), `LicenseHistoryTimeline` |
| `3d76b9e` | UI overhaul + RBAC | RBAC system, `permissions/catalog.ts`, audit helpers |

### 7.2 Conflict matrix (50 features vs code hiện tại)

| ID | Tên | Conflict? | Phát hiện |
|----|-----|-----------|-----------|
| **UP-1/2/3/4** | User Panel MVP (profile + avatar + change password + security info) | ✅ **DONE** | commit `57edb99` — `/account/profile`, `/account/password`, `/account/security` đã có sẵn. **BỎ khỏi backlog**, không cần code lại |
| **A1** | License filter button | ⚠️ MISMATCH | `/licenses/page.tsx` dùng **Server Component + prisma.findMany** (KHÔNG qua API). Báo cáo nói "API support query params" — SAI. Filter phải implement bằng URL searchParams + Server Component, KHÔNG phải client-side filter |
| **A2** | AuditLog drill-down + diff | ✅ **DONE 2026-07-28** | Tier 2 implement commits `0ed359b` + `9dd06ff`. JsonDiff extracted, AuditLogTable moved to `/audit/`, drill-down (15 entity types) + inline JsonDiff expand row. `AssetHistoryTimeline.tsx` + `LicenseHistoryTimeline.tsx` đã refactor import JsonDiff. Effort đúng estimate (0.5 ngày) |
| **A3** | User form full fields | ✅ **DONE 2026-07-28** | Tier 2 implement commits `de00dfd` + `97b7ec6`. PUT/POST whitelist mở rộng 25 fields. Forms chia 5 sections (Identity/Contact/Org/Permissions/Notes) + ToggleRow cho 4 flags boolean. UsersTable có Avatar + status dot + VIP/Remote badges. Unique validation cho email/username/employeeNum trả 409. KHÔNG whitelist password/twoFactorSecret |
| **A4** | Asset "Mark audited" | ✅ CLEAN | Đúng, không có endpoint |
| **A5** | Depreciation CRUD UI | ✅ CLEAN | Đúng, thiếu |
| **A6** | Ticket filter | ⚠️ RBAC key conflict | Permission catalog KHÔNG có `tickets.*`, chỉ có `helpdesk.*`. Báo cáo nói `tickets.assign` etc — SAI, phải dùng `helpdesk.assign/reassign/close`. Reassign permission ĐÃ CÓ (`helpdesk.reassign`, commit 2c64cd5) |
| **A7** | Team CRUD | ✅ CLEAN | Đúng, thiếu |
| **A8** | License CSV export + bulk seat | ⚠️ Permission conflict | Báo cáo không đề cập permission. Cần dùng `reports.export` (đã có trong catalog line 65), giống `/api/assets/export/route.ts` (line 8). Bulk seat ops vẫn thiếu hoàn toàn |
| **A9** | Maintenance global page | ⚠️ API conflict | `/api/maintenances/[id]/route.ts` chỉ có **DELETE** (line 11-34). Báo cáo claim "/api/maintenances/route.ts đã có" — SAI. AssetMaintenance model ĐÃ có schema fields đầy đủ |
| **A10** | Audit log consolidate | ✅ CLEAN | Đúng, 2 trang trùng |
| **B1** | Category full CRUD | ✅ CLEAN | Đúng, thiếu |
| **B2** | Status Label full CRUD | ⚠️ CÓ partial code | `EditStatusForm.tsx` đã tồn tại (line 1-100+) — có `deployable, archived, color`. Thiếu `showInNav, defaultLabel, notes`. Báo cáo nói "thiếu form edit" — SAI một phần |
| **B3** | Location full fields | ❌ CLAIM SAI | Location KHÔNG có field `currency` trong schema. Cẩn thận — nếu implement thì cần add field + migration |
| **B4** | Department full fields | ✅ CLEAN | Đúng, thiếu |
| **B5** | Setting full fields | ✅ CLEAN | Đúng, thiếu |
| **B6** | Asset image + upload | ✅ CLEAN | Đúng, thiếu |
| **B7** | Asset "Assigned Asset" | ⚠️ CÓ partial code | `AssetDetailClient.tsx:29` đã có `assignedAssetId` field. `AssetsPageClient.tsx:158` đã check. Nhưng KHÔNG có UI để assign (claim đúng về "readonly") |
| **B8** | License FMCS | ❌ CLAIM SAI | License KHÔNG có `companyId` trong schema. Claim "thiếu companyId" sai |
| **B9** | Reports page | ⚠️ CÓ partial | Phase 3 (commit 1b3219a) đã có `/api/admin/alerts` + 2 widgets. Nhưng chưa có `/reports` page tổng hợp |
| **B10** | Notification prefs per-user | ❌ CLAIM SAI | User KHÔNG có `emailNotify*` fields trong schema. CẦN add 6 fields + migrate trước |
| **B11** | Email/Phone OTP | ✅ CLEAN | Đúng |
| **B12** | Active sessions | ✅ CLEAN | Đúng |
| **B13** | Per-user history timeline | ✅ CLEAN | Đúng |
| **B14** | CSV Import License/User | ✅ CLEAN | Đúng |
| **B15** | CSV Export others | ✅ CLEAN | Đúng |
| **B16** | Forgot password | ⚠️ Partial infra | Epic H (commit 9598685) đã có `sendEmail()` + `crypto.ts`. NHƯNG signature khác với MSEW-user-panel: code hiện tại dùng `html: string` (đã render sẵn), KHÔNG phải `react: EmailComponent` như MSEW. Forgot password CẦN dùng đúng signature mới |
| **B17** | 2FA TOTP | ✅ CLEAN | Đúng |
| **C1** | QR code / barcode label | ✅ CLEAN | Đúng |
| **C2** | Ticket attachments | ✅ CLEAN | TicketAttachment model đã có. API/UI thiếu |
| **C3** | EULA acceptance flow | ✅ CLEAN | Đúng |
| **C4** | Accept/Decline asset | ✅ CLEAN | Đúng, chỉ enum có |
| **C5** | Saved searches | ✅ CLEAN | Đúng |
| **C6** | Advanced filter | ✅ CLEAN | Đúng |
| **C7** | Webhooks / API tokens | ✅ CLEAN | Đúng |
| **C8** | Email templates editor | ✅ CLEAN | Đúng (Epic H dùng inline HTML, chưa có template library) |
| **C9** | SMS/Slack channels | ✅ CLEAN | Đúng |
| **C10** | Account deletion GDPR | ✅ CLEAN | Đúng (chỉ soft delete hiện tại) |
| **C11** | Bulk operations | ⚠️ Asset bulk có | `src/app/actions/bulk-asset.ts` đã có. Bulk license seat + bulk ticket assign còn thiếu |
| **C12** | Backup/restore | ✅ CLEAN | Đúng |
| **C13** | Custom dashboard widget | ⚠️ CÓ partial | Phase 3 (commit 1b3219a) đã có 2 alert widgets cứng. Thiếu drag-drop + per-user save |
| **C14** | Cost reports | ✅ CLEAN | Đúng |
| **C15** | Notification history page | ⚠️ Bell có | `NotificationBell.tsx` (in Header) đã có. KHÔNG có dedicated history page |
| **C16** | Per-user activity page | ✅ CLEAN | Đúng |
| **C17** | Per-user history diff | ⚠️ Asset có | `AssetHistoryTimeline.FieldDiff` đã có. Cần extend cho User/License |
| **C18** | Audit log CSV export | ✅ CLEAN | Đúng |

### 7.3 Tổng kết conflicts

| Loại | Đếm | Ý nghĩa |
|------|-----|---------|
| ✅ **DONE** (đã code xong) | **1/51** | User Panel MVP (commit 57edb99) — bỏ khỏi backlog |
| ✅ CLEAN (đúng về báo cáo) | 27/51 | Implement từ đầu |
| ⚠️ CÓ partial code (giảm scope) | 15/51 | Reuse infrastructure sẵn, chỉ cần extend |
| ❌ CLAIM SAI (DB không có field) | 3/51 | B8, B10, B3 (currency) |
| ⚠️ MISMATCH (API/RBAC/signature conflict) | 5/51 | A1, A3, A6, A8, A9 |

**Net:** ~30/51 features (59%) có **partial code sẵn** → effort ước tính giảm đáng kể.
**3/51 features có claim sai** về schema → CẦN update báo cáo trước khi code.
**5/51 có conflict** về API/RBAC convention → CẦN đọc catalog + existing endpoints trước khi code.

### 7.4 Effort recalibration (đã giảm vì có sẵn code)

| ID | Effort cũ | Effort đề xuất mới | Lý do |
|----|-----------|-------------------|-------|
| A2 | S (1 ngày) | **XS (0.5 ngày)** | FieldDiff đã có, chỉ cần extend AuditLogTable |
| B2 | S (1 ngày) | **XS (0.5 ngày)** | EditStatusForm đã có, chỉ cần thêm 3 fields |
| B7 | M (1.5 ngày) | **S (1 ngày)** | Type đã có, schema đã có, chỉ cần thêm UI + API |
| B9 | M (1.5 ngày) | **S (1 ngày)** | 2 alert widgets đã có, chỉ cần trang tổng hợp |
| B16 | M (2 ngày) | **S (1 ngày)** | Email infra + crypto đã có, chỉ cần forgot password flow |
| C11 | L (10-12 ngày) | **M-L (8-10 ngày)** | `bulk-asset.ts` đã có, chỉ cần extend cho license/ticket |
| C13 | XL (4 ngày) | **L (2-3 ngày)** | 2 widgets đã có, chỉ cần drag-drop + per-user save |
| C15 | S (1 ngày) | **XS (0.5 ngày)** | NotificationBell đã có, chỉ cần history page |
| C17 | S (1 ngày) | **XS (0.5 ngày)** | FieldDiff đã có, copy-paste |

**Total effort savings:** ~9-12 ngày (từ 60-80 ngày ban đầu → ~48-68 ngày)

### 7.5 Recommend thứ tự code (updated)

**Sprint A revised (top 10, ~10.75 ngày coding + ~1-2 ngày review/test buffer = ~12 ngày total):**
1. A10 Audit log consolidate (XS, 0.5d)
2. A2 AuditLog drill-down (XS, 0.5d — partial code, FieldDiff đã có)
3. A6 Ticket filter (M, 1d — dùng `helpdesk.*` permissions)
4. A8 License CSV export (S, 1d — dùng `reports.export`)
5. A1 License filter (S, 1d — Server Component + URL params)
6. A3 User form full fields (M, 1.5d — update API body + form)
7. A4 Asset Mark audited (S, 0.75d — trung bình giữa 0.5 và 1)
8. A9 Maintenance global page (M, 1.5d — list + create)
9. A5 Depreciation CRUD (M, 1.5d)
10. A7 Helpdesk Team CRUD (M, 1.5d)

**Tổng coding:** 10.75 ngày
**Buffer review/test/security:** ~1-2 ngày
**Sprint A total thực tế:** ~12 ngày (đồng nhất với executive summary section 0)

**Sprint B (nice-to-have, ~15 ngày):**
- B1-B2 (Category/Status form, 2d — partial code)
- B3-B5 (Location/Dept/Setting fields, 1.5d — **BỎ currency claim**)
- B6-B9 (Asset/License/Reports UI, 5d — partial code)
- B16 (Forgot password, 1d — partial code)
- **BỎ B8** (License.companyId — DB không có)
- **BỎ B10** (User.emailNotify* — DB không có)
- B11-B15, B17 còn lại (5d)

### 7.6 Tier 2 note quan trọng cho Tier 1

1. **A1 — đổi approach**: Báo cáo nghĩ filter chạy qua API, nhưng `/licenses/page.tsx` dùng Server Component + prisma. Filter phải URL searchParams-based, KHÔNG client-side fetch
2. **A3 — update API body**: API PUT `/api/settings/users/[id]` chỉ nhận 7 fields. Trước khi update form, phải mở rộng API body whitelist
3. **A6 — đổi permission keys**: Dùng `helpdesk.assign/close/reassign`, KHÔNG `tickets.*`
4. **A8 — dùng `reports.export` permission**: Theo pattern `/api/assets/export/route.ts:8`
5. **B2 — extend thay vì tạo mới**: EditStatusForm đã có, chỉ thêm `showInNav, defaultLabel, notes`
6. **B7 — extend**: `AssetDetailClient` đã có field, chỉ cần assign UI
7. **B9 — extend**: Phase 3 đã có 2 widgets, chỉ cần trang tổng hợp
8. **B16 — adjust signature**: `sendEmail({ html: string })` thay vì `react: Component`
9. **C11 — extend**: `bulk-asset.ts` đã có pattern
10. **C13/C15/C17 — extend**: Phase 3 + AssetHistoryTimeline đã có code reuse

### 7.7 Net recommendations

| Action | Impact |
|--------|--------|
| Update report với path/line corrections | Section 6 đã có |
| Update report với conflict analysis | Section 7 (file này) |
| **Bỏ B3.currency claim** | Tránh code field không tồn tại |
| **Bỏ B8 (License FMCS)** | DB không có companyId |
| **Bỏ B10 (Notification prefs)** | DB không có emailNotify*, cần schema migration đầu tiên |
| Re-effort A2, B2, B7, B9, B16, C11, C13, C15, C17 | Tiết kiệm ~9-12 ngày |
| Update A1 approach (Server Component + URL searchParams) | Đổi pattern |
| Update A3 plan (mở rộng API body trước) | Avoid 500 errors |

---
**Tier 2 conflict analysis kết thúc** — 02:30 UTC+7, 2026-07-28

---

## 8. SPRINT D spec — UserPreference schema (NEW — BLOCKING cho B10)

> **Why Sprint D exists:** Feature B10 (Notification preferences per-user) yêu cầu schema mới, vì User model hiện tại **KHÔNG có** `emailNotify*` fields (verified Tier 2 audit 2026-07-28). Cần migrate DB trước khi code UI.

### 8.1 Schema mới (prisma/schema.prisma)

```prisma
/// UserPreference — lưu notification preferences per-user
model UserPreference {
  id                       String    @id @default(cuid())
  userId                   String    @unique
  
  // Email notification toggles
  emailNotifyAssigned      Boolean   @default(true)   // Asset/License gán cho user
  emailNotifyCheckout      Boolean   @default(true)   // User checkout asset
  emailNotifyCheckin       Boolean   @default(true)   // User checkin asset
  emailNotifyCommented     Boolean   @default(true)   // Comment trên ticket/asset của user
  emailNotifyResolved      Boolean   @default(false)  // Ticket/issue resolved
  emailNotifyMentioned     Boolean   @default(true)   // @mention trong comment
  
  // Digest frequency
  emailDigestFrequency     String    @default("DAILY") // NONE | DAILY | WEEKLY
  
  // In-app
  pushNotify               Boolean   @default(true)   // In-app notification bell
  muteUntil                DateTime?                  // Snooze all notifications until
  
  // Audit
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([muteUntil])
}
```

### 8.2 Migration tasks

> **STATUS: ✅ DONE 2026-07-28** bởi Tier 2. Xem commit TBD (gần nhất) + `docs/db-changelog.md`.

```
[x] D1. Add UserPreference model to prisma/schema.prisma
        (copy schema block từ 8.1 + 2 enums EmailDigestFrequency / UiTheme; rev 1 để mở rộng)
[x] D2. Run migration:
        prisma db execute --stdin < prisma/sql/sprint_d_user_preference.sql
        (NOTE: KHONG dung 'prisma migrate dev' vi DB thieu _prisma_migrations table — drift mode se wipe)
        → Script executed successfully.
[x] D3. Verify migration on local DB:
        Bang PG query: tables 28→29, enums 12→14
[x] D4. Seed script — tạo row cho mỗi user hiện tại:
        File: scripts/migrate-user-preferences.ts (NEW)
        → 6/6 users seeded (idempotent)
[~] D5. Add seed script vào package.json:
        -> Update prisma/seed.ts để ensure preference cho admin upsert (đã làm)
        -> Update package.json: TODO (cho phase setup script full)
[ ] D6. Test migration on staging (nếu có):
        (deferred — verify trên prod-like Neon DB đã pass)
[x] D7. Verify với Prisma client:
        admin@congty.com preference = object với emailDigestFrequency='DAILY', theme='SYSTEM'
[x] D8. Document trong docs/db-changelog.md:
        - Migration name: add_user_preference (note: applied via prisma db execute, not migrate dev)
        - Date: 2026-07-28
        - Breaking: NO (additive only)
        - Rollback: drop table
```

### 8.3 API endpoints (sẽ tạo ở B10, không phải Sprint D)

> Sprint D chỉ làm schema. API sẽ tạo ở Sprint B10.

```typescript
// Planned for B10:
GET    /api/user/preferences              // Get current user prefs
PUT    /api/user/preferences              // Update
POST   /api/user/preferences/test-email   // Send test notification
```

### 8.4 Dependencies

- **Epic H (Notifications)** — đã có `sendEmail()` + `crypto.ts` (commit 9598685). Sẽ consume `emailNotify*` fields ở B10.
- **NextAuth session** — User.id lấy từ `getServerSession()`.
- **Cron job** (planned) — Daily digest chạy khi user online, không cần Vercel Cron (Phase 5).

### 8.5 Acceptance

> **STATUS: ✅ All 10 PASSED** bởi Tier 2 (verified 2026-07-28).

```
[x] D1.  Schema compile pass: npx prisma format
[x] D2.  Migration script executed successfully (via prisma db execute)
[x] D3.  Local DB có table UserPreference (verified 28→29 tables)
[x] D4.  Seed chạy thành công, 6/6 user có 1 row
[x] D5.  prisma.userPreference.create/findUnique/update hoạt động (test admin user)
[x] D6.  Không break existing queries (additive only)
[x] D7.  Cascade delete: xóa User → xóa UserPreference (scripts/verify-user-preferences.ts)
[x] D8.  Default values đúng (emailDigestFrequency=DAILY, theme=SYSTEM)
[x] D9.  Index trên userId + muteUntil hoạt động
[x] D10. Document trong docs/db-changelog.md
```

### 8.6 Effort

| Task | Effort |
|------|--------|
| D1-D3: Schema + migration | 0.5 ngày |
| D4-D5: Seed script | 0.25 ngày |
| D6-D7: Test trên local | 0.25 ngày |
| D8: Doc | 0.1 ngày |
| **Total Sprint D** | **~1.1 ngày** (buffer ~0.4 ngày = 1.5 ngày) |

### 8.7 Thứ tự thực hiện

```
Sprint A1-A10 (parallel, 12 ngày)
        ↓
Sprint D (1.5 ngày — schema migration + seed)
        ↓
Sprint B (15 ngày, trong đó B10 = 3 ngày)
```

**B10 KHÔNG thể bắt đầu trước khi Sprint D xong.** Nếu làm B10 sớm sẽ phải tự add field trong code → inconsistency.

### 8.8 Risk

| Risk | Mitigation |
|------|-----------|
| Migration fail trên DB có data lớn | Test trên staging clone trước |
| Seed script conflict với existing data | WHERE NOT EXISTS pattern |
| NextAuth cache stale user preferences | invalidate cache sau update |
| Cron job daily digest chưa có | Phase 5 — manual trigger via button "Send digest now" |

---

**HẾT Sprint D spec**