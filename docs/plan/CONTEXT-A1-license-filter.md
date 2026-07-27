# CONTEXT: A1 - License List Filter Button

**Người lập:** Tier 1 (Planner) — scaffold by Tier 2 (2026-07-28 02:35)
**Assignee:** Tier 2 (Coder)
**Liên kết:** MSEW-A1-license-filter.md, ACCEPTANCE-A1-license-filter.md
**Mục tiêu:** Cho phép user lọc danh sách License theo search keyword + status từ URL searchParams.

## Background

Trang `/licenses` hiện có nút Filter giả (cosmetic) không có `onClick`. MSEW gốc định nghĩa pattern Server Component + URL searchParams, đồng thời cần một Client Component nhỏ (`LicenseFilterBar`) để trigger URL update.

## Scope (MVP 0.5 giờ)

**Bao gồm:**
- Sửa `src/app/licenses/page.tsx` (Server Component) để:
  - Đọc `searchParams.search` + `searchParams.status`
  - Build `where` clause cho Prisma: `name: { contains: search, mode: 'insensitive' }` + `status: equals`
  - Render `<LicenseFilterBar />` thay cho nút giả
- Tạo `src/components/licenses/LicenseFilterBar.tsx` (Client Component):
  - Input Search (controlled, debounced 300ms hoặc Enter)
  - Dropdown Status (các trạng thái: `active`, `expired`, `expiring_soon`, `archived`)
  - Submit form → `router.push('/licenses?search=...&status=...')` (replace, không push history)

**Không bao gồm (deferred):**
- Multi-select category/manufacturer
- Date range picker
- Saved filters
- Server-side pagination (giữ client-side hoặc default limit 100)

## Impact & Risks

**Impact:**
- Touches 2 files: 1 page + 1 component (NEW)
- No DB migration
- No API route mới (dùng Prisma trực tiếp trong Server Component)
- Backward compatible: nếu không có searchParams, hiển thị tất cả (giống hiện tại)

**Risks:**
- **R1:** `status` field ở DB là enum hay string? Cần verify schema.
- **R2:** `name: { contains, mode: 'insensitive' }` chỉ work với PostgreSQL (mode insensitive hỗ trợ case-insensitive). OK vì stack dùng PostgreSQL.
- **R3:** URL quá dài nếu có nhiều filter → OK vì chỉ có search + status.

## Effort estimate

XS — 0.5 giờ (theo audit-report-features-missing-ui.md A1).
