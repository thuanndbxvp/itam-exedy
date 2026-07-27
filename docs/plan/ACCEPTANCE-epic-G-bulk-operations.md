# ACCEPTANCE CRITERIA — EPIC G: Bulk Operations

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27

---

## 1. Definition of Done

Epic G DONE khi:
1. ✅ Bulk checkout hoạt động đúng
2. ✅ Bulk checkin hoạt động đúng
3. ✅ CSV import hoạt động đúng
4. ✅ CSV export hoạt động đúng
5. ✅ `npx tsc --noEmit` PASS
6. ✅ `npx jest` PASS
7. ✅ `npm run build` PASS

---

## 2. Acceptance Criteria

### G-AC-1: Bulk Checkout
| Criteria | Method | Priority |
|----------|--------|----------|
| Chọn 10 assets → Bulk Checkout → All success | Manual | P0 |
| Chọn 10 assets (5 valid + 5 invalid) → Bulk Checkout → Summary đúng | Manual | P0 |
| EMPLOYEE không thấy bulk checkout | Manual | P0 |

### G-AC-2: Bulk Checkin
| Criteria | Method | Priority |
|----------|--------|----------|
| Chọn 10 assets đang deployed → Bulk Checkin → All success | Manual | P0 |
| Chọn 10 assets (5 valid + 5 invalid) → Bulk Checkin → Summary đúng | Manual | P0 |

### G-AC-3: CSV Import
| Criteria | Method | Priority |
|----------|--------|----------|
| Upload CSV 100 rows → Import → X success, Y fail | Manual | P1 |
| Upload CSV thiếu required columns → Error message | Manual | P1 |
| Upload non-CSV file → Error message | Manual | P1 |

### G-AC-4: CSV Export
| Criteria | Method | Priority |
|----------|--------|----------|
| Click Export → Download file CSV | Manual | P1 |
| Export với filters → CSV đúng data | Manual | P1 |

---

## 3. Test Scenarios

### Scenario 1: Bulk Checkout 10 assets
```
1. Login as admin
2. Go to /assets
3. Check 10 assets
4. Click "Cấp phát hàng loạt"
5. Select target user
6. Click "Xác nhận"
7. Expected: Toast "Đã cấp phát 10/10 tài sản"
8. Verify: 10 assets assigned to user
```

### Scenario 2: Bulk Checkout với partial failure
```
1. Login as admin
2. Go to /assets
3. Check 5 deployable + 5 already-assigned assets
4. Click "Cấp phát hàng loạt"
5. Select target user
6. Click "Xác nhận"
7. Expected: Toast "Đã cấp phát 5/10 tài sản. 5 thất bại."
8. Verify: 5 assets assigned, 5 unchanged
```

### Scenario 3: CSV Import
```
1. Login as admin
2. Go to /assets
3. Click "Import CSV"
4. Upload file.csv (100 rows)
5. Expected: Preview shows 100 rows
6. Click "Import"
7. Expected: Toast "Đã import 95/100. 5 thất bại."
8. Verify: 95 new assets created
```

---

## 4. Sign-off Checklist

| # | Task | Status |
|---|------|--------|
| 1 | All P0 acceptance criteria pass | ⬜ |
| 2 | All P1 acceptance criteria pass | ⬜ |
| 3 | No regression in Jest tests | ⬜ |
| 4 | tsc clean | ⬜ |
| 5 | Build passes | ⬜ |

---

**HẾT ACCEPTANCE-epic-G-bulk-operations.md**
