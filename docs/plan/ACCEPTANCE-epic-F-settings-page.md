# ACCEPTANCE CRITERIA — EPIC F: Settings Page

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27

---

## 1. Definition of Done (DoD)

Epic F được coi là **DONE** khi và chỉ khi:

1. ✅ Tất cả 10 sub-pages hoạt động đúng chức năng
2. ✅ `npx tsc --noEmit` PASS với 0 errors
3. ✅ `npx jest` PASS — 19+ suites, 109+ tests (không regress Phase 1)
4. ✅ `npm run build` PASS
5. ✅ EMPLOYEE role bị block khỏi `/settings/*`
6. ✅ ADMIN role có full access đến tất cả settings pages

---

## 2. Acceptance Criteria (Detailed)

### Phase 2.1 — MVP Core (Must Have)

| # | Criteria | Test Method | Priority |
|---|---------|------------|----------|
| **F-AC-1** | `/settings/general` hiển thị form với company name, currency, timezone, locale | Manual browser | **P0** |
| **F-AC-2** | Thay đổi company name → Save → Database được update → UI refresh | Manual browser | **P0** |
| **F-AC-3** | EMPLOYEE truy cập `/settings/*` → redirect về `/login` với toast "Không có quyền" | Manual browser | **P0** |
| **F-AC-4** | `/settings/statuses` hiển thị danh sách StatusLabel từ database | Manual browser | **P0** |
| **F-AC-5** | ADMIN có thể CREATE một StatusLabel mới | Manual browser | **P0** |
| **F-AC-6** | ADMIN có thể EDIT một StatusLabel hiện có | Manual browser | **P0** |
| **F-AC-7** | ADMIN có thể DELETE một StatusLabel (với confirmation) | Manual browser | **P0** |
| **F-AC-8** | `/settings/categories` hiển thị danh sách Category từ database | Manual browser | **P0** |
| **F-AC-9** | ADMIN có thể CRUD Category | Manual browser | **P0** |
| **F-AC-10** | `/settings/companies` hiển thị danh sách Company | Manual browser | **P1** |
| **F-AC-11** | ADMIN có thể CRUD Company | Manual browser | **P1** |

### Phase 2.2 — Nice to Have

| # | Criteria | Test Method | Priority |
|---|---------|------------|----------|
| **F-AC-12** | `/settings/branding` cho phép đổi logo URL và primary color | Manual browser | P2 |
| **F-AC-13** | `/settings/security` cho phép đổi password policy | Manual browser | P2 |
| **F-AC-14** | EMPLOYEE vẫn bị block ở `/settings/security` | Manual browser | P2 |
| **F-AC-15** | `/settings/users` hiển thị danh sách User với role badge | Manual browser | P2 |
| **F-AC-16** | ADMIN có thể CREATE/EDIT/DELETE User | Manual browser | P2 |
| **F-AC-17** | ADMIN có thể thay đổi User role (ADMIN ↔ EMPLOYEE) | Manual browser | P2 |
| **F-AC-18** | `/settings/depreciation` hiển thị danh sách Depreciation | Manual browser | P2 |
| **F-AC-19** | `/settings/email` hiển thị SMTP config form | Manual browser | P2 |
| **F-AC-20** | Test email button gửi mock notification | Manual browser | P2 |
| **F-AC-21** | `/settings/audit-log` hiển thị ActionLog với pagination | Manual browser | P2 |
| **F-AC-22** | Audit log filter by actionType hoạt động | Manual browser | P2 |
| **F-AC-23** | Audit log filter by date range hoạt động | Manual browser | P2 |

---

## 3. Non-Functional Requirements

| Category | Requirement | Priority |
|----------|-------------|----------|
| **Performance** | Settings page load < 500ms (không có heavy queries) | P1 |
| **Security** | Không có SQL injection trong raw queries | P0 |
| **Security** | RBAC enforced at middleware + action level | P0 |
| **UX** | Toast notification hiển thị sau mỗi action | P1 |
| **UX** | Form validation với react-hook-form + zod | P1 |
| **Accessibility** | Keyboard navigation trong settings sidebar | P2 |

---

## 4. Regression Testing

### Phải KHÔNG regress

| Test Suite | Current Status | After Epic F |
|------------|----------------|--------------|
| `npx jest` | 19 suites, 109 tests PASS | ≥ 109 tests PASS |
| Login flow | Working | Working |
| Asset checkout | Working | Working |
| Asset checkin | Working | Working |
| RBAC | Working | Working |

---

## 5. Test Scenarios (Manual)

### Scenario 1: ADMIN thay đổi company name
```
1. Login as admin@congty.com
2. Navigate to /settings/general
3. Change "Công ty TNHH IT Manager" → "Công ty TNHH ABC"
4. Click "Lưu thay đổi"
5. Expected: Toast "Cập nhật thành công"
6. Refresh page
7. Expected: Company name vẫn là "Công ty TNHH ABC"
```

### Scenario 2: EMPLOYEE bị block settings
```
1. Login as nhanvien@congty.com (EMPLOYEE role)
2. Navigate to /settings/general
3. Expected: Redirect to /login with toast "Không có quyền"
```

### Scenario 3: ADMIN CRUD StatusLabel
```
1. Login as admin@congty.com
2. Navigate to /settings/statuses
3. Click "+ Thêm trạng thái"
4. Fill: Name="Đang bảo hành", Type="Không sẵn sàng"
5. Click "Tạo mới"
6. Expected: Toast "Tạo thành công"
7. Expected: New row appears in table
8. Click edit icon on new row
9. Change Name to "Bảo hành hoàn tất"
10. Click "Lưu"
11. Expected: Toast "Cập nhật thành công"
12. Click delete icon
13. Confirm in modal
14. Expected: Toast "Xóa thành công"
15. Expected: Row removed from table
```

### Scenario 4: Audit log viewer
```
1. Login as admin@congty.com
2. Navigate to /settings/audit-log
3. Expected: Table shows recent action logs
4. Filter by actionType = "CHECKOUT"
5. Click "Tìm kiếm"
6. Expected: Only CHECKOUT logs shown
```

---

## 6. Edge Cases

| Edge Case | Expected Behavior |
|-----------|-------------------|
| Setting record không tồn tại | Auto-seed default record on first access |
| Xóa StatusLabel đang được dùng | Block với lỗi "Đang được sử dụng bởi X assets" |
| Xóa Category đang được dùng | Block với lỗi "Đang được sử dụng bởi X assets" |
| Xóa Company đang được dùng | Block với lỗi "Đang được sử dụng" |
| Tạo duplicate Company name | Block với lỗi validation |
| Empty company name submit | Show validation error |
| EMPLOYEE gọi settings action via API | Return FORBIDDEN error |

---

## 7. Sign-off Checklist

| # | Task | Status |
|---|------|--------|
| 1 | All P0 acceptance criteria pass | ⬜ |
| 2 | All P1 acceptance criteria pass | ⬜ |
| 3 | No regression in Jest tests | ⬜ |
| 4 | No regression in E2E tests | ⬜ |
| 5 | tsc clean | ⬜ |
| 6 | Build passes | ⬜ |
| 7 | Security review (SQL injection check) | ⬜ |
| 8 | Code review by Tier 1 (optional) | ⬜ |

---

**HẾT ACCEPTANCE-epic-F-settings-page.md**
