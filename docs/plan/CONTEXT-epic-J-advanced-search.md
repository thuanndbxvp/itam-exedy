# CONTEXT — EPIC J: Advanced Search & Filters

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27

---

## 1. Tổng quan

Epic J cung cấp search và filter nâng cao cho IT Management system:
- Global search: tìm kiếm mọi thứ từ 1 chỗ
- Advanced filters: lọc theo nhiều tiêu chí
- Saved filters: lưu filter để dùng lại (Phase 2)
- Pagination: phân trang cho danh sách

---

## 2. Tech stack

| Tech | Vai trò |
|------|---------|
| Next.js | App Router, Server Components |
| Prisma | ORM, pagination, search |
| React | UI components |

---

## 3. Existing patterns

- Search API: `/api/search` với `q` query param
- Filter: URL query params
- Pagination: `page` + `limit` params

---

**HẾT CONTEXT-epic-J-advanced-search.md**
