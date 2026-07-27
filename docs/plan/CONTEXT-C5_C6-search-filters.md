# CONTEXT: C5_C6-search-filters

**Người lập:** Tier 2

## Scope
Nâng cấp asset list filtering với 2 tính năng Sprint C:
- **C5**: Lưu / load bộ lọc (per-user, optional public).
- **C6**: Multi-field advanced filter (model, supplier, dates, BYOD, …).

## Phụ thuộc & reuse

- ✅ `FilterPanel.tsx` đã có sẵn cho asset list.
- ✅ URL-based filtering (`useSearchParams` + Next.js Server Component).
- ✅ `prisma.asset.findMany()` supports tất cả field cần filter.

## Schema delta (C5)
- `SavedFilter` model mới:
  - `id` cuid
  - `userId` FK User ON DELETE CASCADE
  - `name` string
  - `scope` ENUM `SavedFilterScope` (`ASSET`, `LICENSE`, `USER`, `TICKET`)
  - `filters` JSON `Prisma.JsonValue`
  - `isPublic` bool default false
  - `createdAt`, `updatedAt`

UI trong `FilterPanel` không cần restart vì schema pure JSON.