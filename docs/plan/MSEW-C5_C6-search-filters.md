# MSEW: C5_C6-search-filters

**Người lập:** Tier 1
**Assignee:** Tier 2

## C5. Saved searches
1. **Schema:** `SavedFilter { id, userId, name, scope (ENUM), filters (JSON), isPublic, createdAt, updatedAt }`.
2. **API:** `/api/saved-filters?scope=asset` GET list, POST create, `[id]` PATCH/DELETE.
3. **UI:** Thêm nút "Lưu bộ lọc" + dropdown "Bộ lọc đã lưu" trong `FilterPanel`.
4. **Scope MVP:** chỉ `asset` (chưa mở rộng license/user — IT team cần asset inventory search là chính).

## C6. Advanced filter (multi-field)
1. **Extend FilterPanel:** thêm các field:
   - Model (dropdown, phụ thuộc category)
   - Supplier (dropdown)
   - Purchase date range (start, end)
   - Warranty months range (min, max)
   - EOL date range (start, end)
   - BYOD (checkbox)
   - Requestable (checkbox)
2. **Generic component approach:** Phase 1 chỉ làm asset advanced filter (reuse `FilterPanel` cũ); Phase 2+ abstract hóa cho licenses/users nếu cần.

## Effort

| ID | Effort (realistic) |
|----|---|
| C5 | M (1 ngày) |
| C6 | M (1.5 ngày) |