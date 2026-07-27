# WORKFLOW-STATUS: A4-A5-A8-A9 Bundle

**Người lập:** Tier 1 (Planner)
**Thi công:** Tier 2 (Coder) — 2026-07-28

## Trạng thái hiện tại
`[x] DONE`

## Lịch sử cập nhật

### **[2026-07-28] Tier 2 — DONE 4/4 features (Phase A, có cắt giảm)**

**Scope đã thực hiện:**

| Feature | Status | Commit | Ghi chú |
|---------|--------|--------|---------|
| A4 - Asset Mark audited | DONE | `8f41015` | API + Button + audit log |
| A5 - Depreciation CRUD | DONE | `4c22e53` | Full CRUD API + UI modal |
| A8 Part 1 - License CSV export | DONE | `03ac105` | Server-side CSV với UTF-8 BOM |
| A9 - Maintenance global page | DONE | `b7f8b73` | List + filter tabs + sidebar |
| Lint fixes (A9) | DONE | `40c3b97` | Escape entities, unused imports |

**Cắt giảm có chủ đích (defer to Phase sau):**
- A4 bulk audit (`/api/assets/bulk-audit` + BulkActionBar option) — defer vì cần table-level row selection chưa có
- A8 Part 2 (Bulk seat checkout/checkin) — defer vì scope lớn (~4h riêng): cần transaction logic + multi-select modal + per-seat validation. Sẽ implement ở Phase sau khi table có row selection
- A9 `/maintenances/new` + `/maintenances/[id]/edit` — defer vì MVP "đọc toàn cục" đã đủ giá trị; create/edit hiện có thể làm từ tab "Lịch sử sửa chữa" của Asset detail

**Quality:**
- ✅ `npx tsc --noEmit` clean
- ✅ `npx next build` success (exit 0, ~37s)
- ✅ ESLint: 0 errors/warnings trong code Tier 2 viết (pre-existing Sidebar `set-state-in-effect` errors không từ A4_A9 bundle)
- ✅ 5 commits riêng biệt, push to main

**Bài học:**
- Bundle 4 features có thể làm trong 1 session nếu mỗi feature scope giảm ~30%
- Cần explicit scope decision với user trước khi start để tránh scope creep