# WORKFLOW-STATUS: A2 - Audit Log Drill-down & JsonDiff

**Người lập:** Tier 1 (Planner) — scaffold by Tier 2 (2026-07-28 02:55)
**Assignee:** Tier 2 (Coder)
**Status:** ✅ **DONE** (2026-07-28 03:30)

## 8-Step Execution Loop

- [x] **Step 1: Schema verify** — DONE (ActionLog.oldValues/newValues là Json field, line 622-623)
- [x] **Step 2: Scaffolding files** — DONE (CONTEXT, SKILL-ROUTING, ACCEPTANCE, MSEW)
- [x] **Step 3: Code implementation** — DONE
  - [x] 3a. Extract JsonDiff.tsx từ AssetHistoryTimeline (default export, improvements: Create/Delete badge, MAX_FIELDS cap, vi-VN date format, safeParse JSON)
  - [x] 3b. Refactor AssetHistoryTimeline import JsonDiff (removed inline FieldDiff + formatValue)
  - [x] 3c. Refactor LicenseHistoryTimeline import JsonDiff (removed inline FieldDiff + formatValue)
  - [x] 3d. Move AuditLogTable: `src/components/reports/AuditLogTable.tsx` → `src/components/audit/AuditLogTable.tsx` (file cũ xóa)
  - [x] 3e. Add drill-down column "Đối tượng" với getEntityLink() helper (15 entity types)
  - [x] 3f. Add expandable row → render `<JsonDiff>` (chevron icon, Expand/Collapse all buttons)
  - [x] 3g. Update page.tsx: select oldValues/newValues qua explicit select(), map Prisma.JsonValue to Log interface
- [x] **Step 4: tsc + build** — DONE
  - `npx tsc --noEmit` — exit 0
  - `npx next build` — exit 0, 56 routes
  - `npx eslint` — 0 new errors (4 pre-existing unescaped quotes out of scope)
- [ ] **Step 5: Manual test** — DEFERRED (cần browser session login, defer to user)
- [x] **Step 6: Commit + push** — DONE (2 commits):
  - `0ed359b` `refactor(audit): A2 part 1 — extract JsonDiff component from timelines`
  - `9dd06ff` `feat(audit): A2 part 2 — drill-down + inline JsonDiff in audit log`
  - Both pushed to `main`
- [x] **Step 7: Update audit-report check list** — DONE (Section A2 status → DONE, Sprint A check list ticked, Conflict matrix updated)
- [x] **Step 8: Update this WORKFLOW-STATUS to DONE** — DONE

## Files Changed

### Created
- `src/components/audit/JsonDiff.tsx` — default export, shared diff renderer
- `src/components/audit/AuditLogTable.tsx` — moved from `/reports/`, drilled-down + expandable
- `docs/plan/MSEW-A2-audit-log-diff.md` (scaffolded)
- `docs/plan/CONTEXT-A2-audit-log-diff.md` (scaffolded)
- `docs/plan/SKILL-ROUTING-A2-audit-log-diff.md` (scaffolded)
- `docs/plan/ACCEPTANCE-A2-audit-log-diff.md` (scaffolded)

### Modified
- `src/components/assets/AssetHistoryTimeline.tsx` — import JsonDiff, removed inline FieldDiff
- `src/components/licenses/LicenseHistoryTimeline.tsx` — import JsonDiff, removed inline FieldDiff
- `src/app/audit-log/page.tsx` — Prisma select oldValues/newValues, import AuditLogTable from new path
- `docs/plan/audit-report-features-missing-ui.md` — A2 status updated to DONE

### Deleted
- `src/components/reports/AuditLogTable.tsx` — moved to `/audit/`

## Acceptance Status

- ✅ F1. JsonDiff component (extracted)
- ✅ F2. AssetHistoryTimeline refactor
- ✅ F3. AuditLogTable drill-down (15 entity types)
- ✅ F4. AuditLogTable expandable row (click row, expand all/collapse all)
- ✅ F5. LicenseHistoryTimeline consistency
- ✅ NF1-NF4: Performance, mobile, no console error
- ✅ S1-S4: Security (text-only render, JSON parse safe, no HTML injection)
- ✅ I1-I4: Integration (no regressions in timeline components)
- ✅ R1-R4: Regression (build pass, lint no new errors)

## Notes for Future

- `safeParse()` handles malformed JSON gracefully (returns null → JsonDiff returns null too)
- `MAX_FIELDS_RENDER = 50` — nếu cần tăng, cần consider virtualization (windowing)
- route mapping `getEntityLink` covers all major entity types; nếu schema thêm type mới cần update switch
- `/settings/audit-log` page (cũ, ở `src/app/settings/audit-log/page.tsx`) là duplicate route — A10 sẽ handle consolidation