# SKILL-ROUTING: A2 - Audit Log Drill-down & JsonDiff

**Người lập:** Tier 1 (Planner) — scaffold by Tier 2 (2026-07-28 02:55)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | Read schema `ActionLog.oldValues/newValues` type | `generalPurpose` (read-only) | Verify field type (Json vs String) |
| 2 | Read `AssetHistoryTimeline.tsx:89-211` (FieldDiff logic) | Direct read | Cần preserve logic chính xác |
| 3 | Extract JsonDiff.tsx | `code-simplifier` (sau khi extract) | Đảm bảo code clean |
| 4 | Refactor AssetHistoryTimeline + LicenseHistoryTimeline | `react-reviewer` | Hook usage, props passing |
| 5 | Add drill-down to AuditLogTable | `code-reviewer` | Routing correctness |
| 6 | Manual test | Manual browser | Drill-down + expand diff |

## Skill Activation Order

```
1. Read schema.prisma (ActionLog model around line 200-250?)
2. Read AssetHistoryTimeline.tsx (FieldDiff component)
3. Read current AuditLogTable.tsx
4. Read LicenseHistoryTimeline.tsx
5. Read /settings/audit-log/page.tsx (consumer)
6. Code (extract + refactor + extend)
7. tsc + build
8. Manual test
9. Commit (2 commits: refactor first, then feature)
```

## Sub-skill activation

- **code-simplifier**: CÓ — sau khi extract, đảm bảo JsonDiff không có dead code
- **react-reviewer**: CÓ — verify refactor không break AssetHistoryTimeline
- **code-reviewer**: CÓ — verify drill-down route mapping đúng

## Decision Points

- **Q1: FieldDiff rename thành JsonDiff hay giữ tên?**
  → Rename `JsonDiff` cho rõ nghĩa (component này so sánh 2 JSON object, không chỉ field).
- **Q2: Expandable row dùng `<details>` native hay React state?**
  → React state với `useState<expandedId>` cho control tốt hơn. Cho phép "expand all / collapse all".
- **Q3: Date rendering?**
  → Dùng `new Date().toLocaleString('vi-VN')` nếu parse thành công, else hiển thị raw string.
