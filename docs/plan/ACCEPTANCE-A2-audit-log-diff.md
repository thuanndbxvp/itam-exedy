# ACCEPTANCE: A2 - Audit Log Drill-down & JsonDiff

**Người lập:** Tier 1 (Planner) — scaffold by Tier 2 (2026-07-28 02:55)

## Functional Acceptance

### F1. JsonDiff component (extracted)
```
[ ] F1.1. File `src/components/audit/JsonDiff.tsx` tồn tại, default export
[ ] F1.2. Nhận props `{ oldValues: any, newValues: any }`
[ ] F1.3. Render 2 cases: Created (oldValues null), Updated, Deleted (newValues null)
[ ] F1.4. Color coding: green=added, red=removed, yellow=modified
[ ] F1.5. Date values: parse và format vi-VN nếu possible
[ ] F1.6. Nested objects: render JSON.stringify với indent 2
[ ] F1.7. Empty cả 2 → render "Không có dữ liệu thay đổi"
```

### F2. AssetHistoryTimeline refactor
```
[ ] F2.1. Không còn inline FieldDiff trong file (đã extract)
[ ] F2.2. Import JsonDiff từ '@/components/audit/JsonDiff'
[ ] F2.3. Render behavior giống hệt cũ (regression check)
[ ] F2.4. tsc không có error
```

### F3. AuditLogTable drill-down
```
[ ] F3.1. File move: src/components/reports/AuditLogTable.tsx → src/components/audit/AuditLogTable.tsx
[ ] F3.2. Import path updated ở consumer (page.tsx)
[ ] F3.3. Thêm cột "Đối tượng" — hiển thị itemType + itemId.slice(0,8)
[ ] F3.4. Cột này là <Link> với route từ getEntityLink helper
[ ] F3.5. USER → /settings/users/[id]
[ ] F3.6. ASSET → /assets/[id]
[ ] F3.7. LICENSE → /licenses/[id]
[ ] F3.8. CATEGORY → /settings/categories/[id]
[ ] F3.9. LOCATION → /settings/locations/[id]
[ ] F3.10. DEPARTMENT → /settings/departments/[id]
[ ] F3.11. STATUS → /settings/statuses/[id]
[ ] F3.12. ROLE → /settings/permissions/[id]
[ ] F3.13. Unknown type → render "-" (no link)
```

### F4. AuditLogTable expandable row
```
[ ] F4.1. Mỗi row có nút expand/collapse (icon chevron)
[ ] F4.2. Click expand → hiện JsonDiff dưới row
[ ] F4.3. oldValues/newValues parse JSON nếu stored as string
[ ] F4.4. Click collapse → ẩn diff
[ ] F4.5. Multiple rows có thể expand đồng thời
[ ] F4.6. Loading state nếu parse JSON chậm (sync OK, no loading needed)
```

### F5. LicenseHistoryTimeline consistency
```
[ ] F5.1. Import JsonDiff
[ ] F5.2. Render oldValues/newValues tương tự Asset
[ ] F5.3. Không break existing display
```

## Non-Functional

```
[ ] NF1. JsonDiff render < 100ms cho JSON < 50 fields
[ ] NF2. Expandable row không rerender toàn table (React key stable)
[ ] NF3. Không có console error
[ ] NF4. Mobile: expand row stack vertical, scroll horizontal cho diff table
```

## Security

```
[ ] S1. JsonDiff KHÔNG render raw HTML (chỉ text + JSON.stringify)
[ ] S2. oldValues/newValues parse JSON trong try/catch (handle malformed)
[ ] S3. Drill-down link chỉ navigate (no data leak)
[ ] S4. Permission: audit log page đã gate (không cần check thêm)
```

## Integration

```
[ ] I1. AssetHistoryTimeline regression: tất cả entry vẫn render đúng
[ ] I2. LicenseHistoryTimeline regression: tương tự
[ ] I3. /settings/audit-log page render đúng table
[ ] I4. /audit-log page (root) nếu còn tồn tại → update import path
```

## Regression

```
[ ] R1. Không có file nào import từ path cũ (src/components/reports/AuditLogTable)
[ ] R2. Build pass (tsc + next build)
[ ] R3. Asset detail page → History tab vẫn render timeline đúng
[ ] R4. License detail page → History tab vẫn render timeline đúng
```

## Verification Steps (Manual)

```bash
# 1. Start dev server
npm run dev

# 2. Test JsonDiff
- Visit /assets/[id] → click History tab → expand entry → see diff colors
- Visit /licenses/[id] → click History tab → expand entry → see diff colors

# 3. Test drill-down
- Visit /settings/audit-log (admin only)
- Click "Đối tượng" cell của 1 row ASSET
- → Navigate đến /assets/[id] đúng

# 4. Test expand row
- Click chevron expand ở 1 row
- → JsonDiff hiện dưới row
- Click collapse → ẩn

# 5. Test edge cases
- Row với oldValues=null (Create) → show "Tạo mới" với green
- Row với newValues=null (Delete) → show "Xóa" với red
- Row với empty object → "Không có dữ liệu thay đổi"
```

## Auto-test (optional, defer)

- Unit test: `JsonDiff.test.tsx` (snapshot for Created/Updated/Deleted)
- E2E: Playwright (defer to later sprint)
