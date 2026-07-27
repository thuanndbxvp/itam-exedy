# ACCEPTANCE: C5_C6-search-filters

**Người lập:** Tier 2

## C5. Saved searches
- [x] C5_1. `SavedFilter` model + `SavedFilterScope` enum + SQL migration.
- [x] C5_2. `/api/saved-filters?scope=ASSET` GET list (own + public).
- [x] C5_3. `/api/saved-filters` POST create (name, scope, filters JSON).
- [x] C5_4. `/api/saved-filters/[id]` PATCH rename/update.
- [x] C5_5. `/api/saved-filters/[id]` DELETE.
- [x] C5_6. UI trong `FilterPanel`: dropdown chọn saved filter + nút "Lưu bộ lọc hiện tại".
- [x] C5_7. Permission: chỉ owner mới xóa/sửa; everyone thấy public.

## C6. Advanced filter
- [x] C6_1. Thêm fields trong `FilterPanel`: `modelId`, `supplierId`, `purchaseDateFrom`, `purchaseDateTo`, `warrantyMonthsMin`, `warrantyMonthsMax`, `eolDateFrom`, `eolDateTo`, `byod`, `requestable`.
- [x] C6_2. Update `assets/page.tsx` server query parse các param mới.
- [x] C6_3. Filter hoạt động kết hợp với existing filters.
- [x] C6_4. Pass `models` và `suppliers` từ server → client FilterPanel.