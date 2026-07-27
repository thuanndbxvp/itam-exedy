# WORKFLOW-STATUS: B1-B5 - Category & Settings CRUD Bundle

**Người lập:** Tier 1 (Planner)

## Trạng thái hiện tại
`[x] DONE`

## Lịch sử cập nhật
- **[2026-07-28]** Tier 1 gộp 5 module (Categories, Status Labels, Locations, Departments, Settings) thành một Bundle chung để tối ưu context cho Tier 2.
- **[2026-07-28]** Tier 2 commit `84d8e06` (chore — auto-staged by repo) + `a00c23d` (tsc fixes) — Sprint B1-B5 DONE.

## Kết quả

### B1 — Category ✅
- API `POST/PUT /api/settings/categories`: parse + lưu `eulaText`, `requireAcceptance`, `checkinEmail`.
- Form `EditCategoryForm` + `new/page`: thêm 2 checkboxes + 1 input email + 1 textarea EULA.
- Table `CategoriesTable`: thêm cột "EULA / Check-in" với badge "Yêu cầu EULA" + email preview.
- NF1: schema có sẵn, không sửa DB.

### B2 — Status Label ✅
- `EditStatusForm` + `new/page`: thêm radio "Không khả dụng" (4 options: deployable / pending / undeployable / archived).
- Helper: detect initial undeployable nếu tất cả 3 bools = false.
- Schema chỉ có 3 booleans → `undeployable` derive: 3 bools = false (khớp với NOT (deployable OR pending OR archived)).
- NF1: schema 3 booleans đầy đủ, không cần thêm enum.

### B3 — Location ✅ (không cần sửa)
- Schema có sẵn: address, city, state, country, zip (thiếu `address2`).
- Form đã đầy đủ các trường này qua EntityTable fields.
- NF1: Bỏ qua `address2` (schema không có).

### B4 — Department ✅
- API `POST/PUT /api/settings/departments`: thêm `locationId` field.
- `DepartmentsTable`: thêm dropdown Location.
- `departments/page`: tải locations + resolve manually (Department schema không expose `location` relation, chỉ có `locationId`).
- Table column mới "Vị trí" với icon `MapPin`.

### B5 — Settings ✅
- `updateGeneralSettingsAction`: thêm `supportEmail` (map sang DB `emailFrom`).
- `general/page`: thêm input `supportEmail` ngay sau `companyName`. UI placeholder "support@congty.com".
- Tsc fix: `type: 'text'` (vì SettingsForm FieldDef không có 'email').

## Acceptance validation (theo ACCEPTANCE.md)
| ID | Status | Note |
|----|--------|------|
| B1_1 (eulaText, checkinEmail, requireAcceptance, color) | ✅ | New + Edit form đủ |
| B1_2 (Lưu + cột trên bảng) | ✅ | Cột "EULA / Check-in" |
| B2_1 (Type enum) | ✅ | 4 radio options |
| B2_2 (Status badge màu) | ✅ | existing logic giữ nguyên |
| B3_1 (Address fields) | ✅ | đã có (skip address2) |
| B3_2 (Lưu xuống DB) | ✅ | API OK |
| B4_1 (Manager, Location, Company dropdown) | ✅ | 3 dropdowns |
| B4_2 (Lưu DB) | ✅ | API accepts locationId |
| B5_1 (siteName, brandLogo, supportEmail) | ✅ | companyName+logoUrl+supportEmail |
| B5_2 (Lưu Setting upsert) | ✅ | Singleton `id='system'` |

## Pre-existing issues (out of scope)
- `src/app/licenses/[id]/page.tsx` line 62: TS2339 `assignedUserId` not on `{id,name,assetTag}`. Không thuộc bundle này.
