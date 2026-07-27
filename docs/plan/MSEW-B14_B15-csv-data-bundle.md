# MSEW: B14-B15 CSV/Data Bundle

**Người lập:** Tier 1 (Planner) + Tier 2 scaffolded

**Mục tiêu:** Nâng cấp hệ thống CSV (export, parse, helper) cho toàn platform.

## B14. CSV shared helper + Assets export refactor
1. **Tạo** `src/lib/csv.ts` với 3 helper exports:
   - `escapeCsvCell(value)` — escape quotes/newlines/commas cho 1 cell.
   - `buildCsv(headers, rows)` — build full CSV string với UTF-8 BOM + CRLF.
   - `csvResponse(filename, csv)` — NextResponse với Content-Type/Disposition headers.
2. **Refactor** `/api/assets/export/route.ts`:
   - Dùng `buildCsv()` + `csvResponse()`.
   - Thêm fields: `purchaseOrder`, `warrantyMonths`, `createdAt`, `notes`, `eolExplicit`, `requestable`, `byod`.
   - Support `format` query param: `csv` (default) | `xlsx` (placeholder — return CSV với comment "Excel compatible").
3. **Refactor** `/api/licenses/export/route.ts`: dùng helper thay vì inline string concat.
4. **Backward compat**: vẫn trả về cùng Content-Type + filename pattern.

## B15. Users export + Audit Log export
1. **`/api/users/export`** — GET trả CSV danh sách users (filter `activated`, `deletedAt`).
   - Fields: `id`, `username`, `email`, `firstName`, `lastName`, `role`, `department`, `company`, `activated`, `createdAt`.
   - Auth: `users.read`.
2. **`/api/audit-log/export`** — GET trả CSV audit log.
   - Fields: `createdAt`, `actor`, `actionType`, `itemType`, `itemId`, `targetType`, `targetId`, `notes`, `ipAddress`.
   - Query params: `from`, `to`, `actionType`, `itemType`, `actorId`.
   - Auth: `settings.read` (admin-only audit access).
   - Limit: 10000 rows.
3. **CSV parser** — `parseCsv(text)` helper in `lib/csv.ts` để tái sử dụng (handle quoted commas, RFC 4180 minimal).

## Acceptance tổng
- 1 helper module mới `src/lib/csv.ts` (~80 lines, 4 exports).
- 2 export endpoints mới: `/api/users/export`, `/api/audit-log/export`.
- 2 endpoints refactored: assets, licenses dùng helper.