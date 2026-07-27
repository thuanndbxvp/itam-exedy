# ACCEPTANCE CRITERIA — EPIC J: Advanced Search

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27

---

## 1. Definition of Done

Epic J DONE khi:
1. ✅ Global search hoạt động đúng
2. ✅ Advanced filters hoạt động đúng
3. ✅ Pagination hoạt động đúng
4. ✅ `npx tsc --noEmit` PASS
5. ✅ `npx jest` PASS
6. ✅ `npm run build` PASS

---

## 2. Acceptance Criteria

### J-AC-1: Global Search
| Criteria | Method | Priority |
|----------|--------|----------|
| Nhấn "/" → Search modal mở | Manual | P0 |
| Gõ "dell" → hiển thị assets chứa "dell" | Manual | P0 |
| Keyboard navigation (↑↓) hoạt động | Manual | P0 |
| Enter → navigate đến result | Manual | P0 |

### J-AC-2: Advanced Filters
| Criteria | Method | Priority |
|----------|--------|----------|
| Filter by status → đúng results | Manual | P0 |
| Filter by category → đúng results | Manual | P0 |
| Filter by location → đúng results | Manual | P0 |
| Multiple filters → combined | Manual | P0 |
| URL updated với query params | Manual | P0 |

### J-AC-3: Pagination
| Criteria | Method | Priority |
|----------|--------|----------|
| Page 1 of 8 hiển thị đúng | Manual | P0 |
| Click page 2 → hiển thị đúng | Manual | P0 |
| Items per page = 20 | Manual | P0 |

---

## 3. Test Scenarios

### Scenario 1: Global Search
```
1. Nhấn "/"
2. Expected: Search modal mở
3. Gõ "dell"
4. Expected: Sau 300ms, hiển thị kết quả
5. Nhấn ↓ 2 lần
6. Nhấn Enter
7. Expected: Navigate đến asset detail
```

### Scenario 2: Advanced Filter
```
1. Click "Bộ lọc"
2. Select Status = "Available"
3. Click "Áp dụng"
4. Expected: URL = /assets?statusId=xxx
5. Expected: Chỉ hiển thị assets available
```

---

## 4. Sign-off Checklist

| # | Task | Status |
|---|------|--------|
| 1 | All P0 acceptance criteria pass | ⬜ |
| 2 | tsc clean | ⬜ |
| 3 | Build passes | ⬜ |

---

**HẾT ACCEPTANCE-epic-J-advanced-search.md**
