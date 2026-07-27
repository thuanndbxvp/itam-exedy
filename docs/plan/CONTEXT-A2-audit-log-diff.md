# CONTEXT: A2 - Audit Log Drill-down & JsonDiff

**Người lập:** Tier 1 (Planner) — scaffold by Tier 2 (2026-07-28 02:55)
**Assignee:** Tier 2 (Coder)
**Liên kết:** MSEW-A2-audit-log-diff.md, ACCEPTANCE-A2-audit-log-diff.md

## Background

Audit Log hiện chỉ là bảng text. Tier 1 muốn 2 cải tiến:
1. **Drill-down**: click itemId trong bảng → navigate đến entity detail page
2. **Inline diff**: expand row → thấy oldValues vs newValues với color highlight

Audit report conflict analysis (Section 7) đã verify: `FieldDiff` component đã có sẵn trong `src/components/assets/AssetHistoryTimeline.tsx:89-211`. Plan A2 chỉ là **extract** + **reuse** + extend cho `AuditLogTable` (root audit log).

## Scope (MVP 0.5 ngày)

**Bao gồm:**
1. **Extract** `FieldDiff` từ `AssetHistoryTimeline.tsx:89-211` ra file mới `src/components/audit/JsonDiff.tsx`
   - Default export
   - Props: `{ oldValues: any, newValues: any }`
2. **Refactor** `AssetHistoryTimeline.tsx` import JsonDiff (không duplicate code)
3. **Move** `src/components/reports/AuditLogTable.tsx` → `src/components/audit/AuditLogTable.tsx` (sửa import ở page.tsx)
4. **Add** "Đối tượng" column với drill-down Link (entity route mapping)
5. **Add** expandable row → render `<JsonDiff>` với oldValues/newValues
6. **Update** `LicenseHistoryTimeline.tsx` dùng JsonDiff (consistency)

**Không bao gồm (deferred):**
- JSON syntax highlighting (advanced)
- Field name i18n mapping (chỉ raw key)
- Per-entity diff filters (chỉ show all fields)
- Time-travel diff (chỉ show latest)
- Search/filter theo field value (Epic J territory)

## Impact & Risks

**Impact:**
- Touches 4 files: 2 modify, 1 extract, 1 move
- No DB migration
- No API route mới (existing `/api/assets/[id]/history` đã trả về oldValues/newValues)
- Backward compatible: expand row optional, default collapsed

**Risks:**
- **R1:** JsonDiff parse JSON nếu stored as string (verify ActionLog schema field type)
- **R2:** Expand row có thể tăng DOM size nếu JSON lớn → cap ở 50 fields per row
- **R3:** Date comparison cần careful (Date vs string vs ISO)

## Effort estimate

XS — 0.5 ngày (theo audit-report A2, đã verify chính xác).
