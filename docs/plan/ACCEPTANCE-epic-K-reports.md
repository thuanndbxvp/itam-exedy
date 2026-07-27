# ACCEPTANCE CRITERIA — EPIC K: Reports & Analytics

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27

---

## 1. Definition of Done

Epic K DONE khi:
1. ✅ Dashboard hiển thị stats + charts
2. ✅ Audit log viewer hoạt động đúng
3. ✅ Reports page hiển thị đúng data
4. ✅ `npx tsc --noEmit` PASS
5. ✅ `npx jest` PASS
6. ✅ `npm run build` PASS

---

## 2. Acceptance Criteria

### K-AC-1: Dashboard Stats
| Criteria | Method | Priority |
|----------|--------|----------|
| Hiển thị Total Assets | Manual | P0 |
| Hiển thị Checked Out count | Manual | P0 |
| Hiển thị Available count | Manual | P0 |
| Hiển thị Pending count | Manual | P0 |

### K-AC-2: Dashboard Charts
| Criteria | Method | Priority |
|----------|--------|----------|
| Pie chart hiển thị assets by status | Manual | P0 |
| Bar chart hiển thị assets by category | Manual | P0 |
| Charts responsive trên mobile | Manual | P1 |

### K-AC-3: Audit Log
| Criteria | Method | Priority |
|----------|--------|----------|
| Hiển thị danh sách logs | Manual | P0 |
| Filter by action type | Manual | P0 |
| Filter by date range | Manual | P0 |
| Pagination hoạt động | Manual | P0 |

---

## 3. Sign-off Checklist

| # | Task | Status |
|---|------|--------|
| 1 | All P0 acceptance criteria pass | ⬜ |
| 2 | tsc clean | ⬜ |
| 3 | Build passes | ⬜ |

---

**HẾT ACCEPTANCE-epic-K-reports.md**
