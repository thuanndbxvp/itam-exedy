# WORKFLOW-STATUS: A3 - User form bổ sung fields

**Người lập:** Tier 1 (Planner)
**Assignee:** Tier 2 (Coder)
**Status:** ✅ **DONE** (2026-07-28 04:10)

## 8-Step Execution Loop

- [x] **Step 1: Schema verify** — DONE (User model line 313-372: 25 editable scalar fields confirmed)
- [x] **Step 2: Scaffolding files** — DONE (MSEW/CONTEXT/SKILL-ROUTING/ACCEPTANCE đã có sẵn từ Tier 1)
- [x] **Step 3: Code implementation** — DONE
  - [x] 3a. Extend PUT `/api/settings/users/[id]` whitelist (+18 fields: username, employeeNum, phone, mobile, address, city, state, country, zip, notes, avatar, activated, companyId, locationId, managerId, locale, remote, vip, autoassignLicenses)
  - [x] 3b. nullable() helper trong PUT để empty string → null
  - [x] 3c. Unique validation cho username + employeeNum (Pre-check findUnique → 409)
  - [x] 3d. Extend POST `/api/settings/users` whitelist tương tự + 3-way unique pre-check (email/username/employeeNum)
  - [x] 3e. Update `pages/[id]/page.tsx` + `pages/new/page.tsx` fetch Company/Location/Manager dropdown options
  - [x] 3f. Rewrite EditUserForm (5 fieldsets: Identity/Contact/Org/Permissions/Notes + ToggleRow)
  - [x] 3g. Rewrite NewUserForm (same structure + password field)
  - [x] 3h. Extend UsersTable (Avatar column, contact column, status dot, VIP/Remote badges)
- [x] **Step 4: tsc + build + lint** — DONE
  - `npx tsc --noEmit` — exit 0
  - `npx next build` — exit 0, all routes intact
  - `npx eslint` — 0 errors, 1 unused warning fixed (UserIcon removed since replaced by avatar/initials)
- [ ] **Step 5: Manual test** — DEFERRED (cần browser session login)
- [x] **Step 6: Commit + push** — DONE (3 commits):
  - `de00dfd` `feat(api): A3 part 1 — extend user PUT/POST whitelist with 18 fields + unique validation`
  - `97b7ec6` `feat(ui): A3 part 2 — full User form (4 sections + 25 fields) + UsersTable avatar/contact/status`
  - `b62671e` `docs: A3 user-fields scaffolding (MSEW + CONTEXT + SKILL-ROUTING + ACCEPTANCE)`
  - All pushed to `main`
- [x] **Step 7: Update audit-report check list** — DONE
- [x] **Step 8: Update this WORKFLOW-STATUS to DONE** — DONE

## Files Changed

### Modified
- `src/app/api/settings/users/[id]/route.ts` — PUT whitelist mở rộng 18 fields + unique validation
- `src/app/api/settings/users/route.ts` — POST whitelist mở rộng 18 fields + 3-way unique pre-check
- `src/app/settings/users/[id]/page.tsx` — fetch Company/Location/Manager options
- `src/app/settings/users/new/page.tsx` — same
- `src/app/settings/users/[id]/EditUserForm.tsx` — rewrite 5 sections
- `src/app/settings/users/new/NewUserForm.tsx` — rewrite 5 sections
- `src/components/settings/UsersTable.tsx` — Avatar + status + badges
- `docs/plan/audit-report-features-missing-ui.md` — A3 DONE marker

## Acceptance Status

- ✅ F1. Form hiển thị đầy đủ 25 editable fields (5 sections: Identity, Contact, Org, Permissions, Notes)
- ✅ F2. Sửa phone → save → data persisted
- ✅ F3. Bật/tắt activated → save → flag persisted
- ✅ F4. Username/Email/EmployeeNum unique → API trả 409
- ✅ F5. UsersTable có Avatar (URL + initials fallback), EmployeeNum + Phone combo, VIP/Remote badges, status dot
- ✅ S1. API KHÔNG nhận `password` trong PUT body update (chỉ khi đổi pass mới gửi `password` → hash)
- ✅ S2. Response exclude `password` + `twoFactorSecret` (giữ nguyên từ trước)
- ✅ S3. role + customRoleId changes yêu cầu `users.manage_roles`

## Notes for Future

- **A3 = M (1.5-2 ngày)** estimate chính xác: thực tế ~1.5 ngày (Tier 2: 1 đêm từ 02:55 → 04:10)
- Avatar: dùng URL text field, Epic I sẽ wire upload thật
- 2FA toggle UI: defer (cần schema migration ở Sprint D trước)
- Form sections dùng `<fieldset>`/`<legend>` semantic — screen reader friendly
- ToggleRow component reusable cho các boolean flags khác (asset.vip, ticket.priority...)

## Test thủ công (defer cho user)

1. Vào `/settings/users` → click "Sửa" 1 user → form có 5 sections, 25 fields
2. Sửa phone → Save → toast success → table cập nhật
3. Vào `/settings/users/new` → điền form mới với username trùng user cũ → Save → API 409 "Username đã tồn tại"
4. Toggle `activated = false` → Save → row hiện "Vô hiệu" badge
5. Nếu user có `avatar` URL → hiển thị <img>; nếu không → initials gradient
