# WORKFLOW-STATUS: C5_C6-search-filters

**Người lập:** Tier 2

## Trạng thái: `[x] DONE` — 2026-07-28

## Effort
- C5: ~2h (model + CRUD + UI)
- C6: ~2h (6 field mới + page integration)

## Notes
- SavedFilter dùng JSON `filters` để tránh lock-in spec; deserialization loose.
- Dropdown Model phụ thuộc Category — Phase 1 hiển thị tất cả Model, filter kết hợp với Category (drill-down). Phase 2 có thể AJAX-load Model theo Category.