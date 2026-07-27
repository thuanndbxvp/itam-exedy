# CONTEXT: B14-B15 CSV/Data Bundle

**Người lập:** Tier 1 (Planner) + Tier 2 scaffolded

## Scope

Bundle xử lý các thiếu sót kỹ thuật CSV + bổ sung 2 export endpoints mới:

1. **B14**: `/api/assets/export` hiện thiếu UTF-8 BOM (Excel hiển thị tiếng Việt sai) + thiếu field (notes, EOL, etc). Tạo helper chuẩn.
2. **B15**: Admin cần CSV export Users (HR-style roll) + Audit Log (security review/compliance).

## Phụ thuộc

- `/api/licenses/export` đã có BOM + CRLF — pattern để clone.
- `requirePermissionApi('reports.export')` đã có sẵn catalog.
- `ActionLog` schema đã có đủ fields (createdAt, actionType, itemType, itemId, notes, ipAddress).