# ACCEPTANCE: B14-B15 CSV/Data Bundle

**Người lập:** Tier 2 (Coder, scaffolded)

## B14. CSV helper + Assets refactor
- [x] B14_1. `src/lib/csv.ts` có `escapeCsvCell`, `buildCsv`, `csvResponse`, `parseCsv` exports.
- [x] B14_2. `/api/assets/export` dùng helper + BOM + CRLF + đầy đủ fields (notes, eolExplicit, requestable, byod, warrantyMonths, purchaseOrder, createdAt).
- [x] B14_3. `/api/licenses/export` refactor dùng helper (giữ backward compat — same filename pattern).

## B15. Users + Audit Log export
- [x] B15_1. `/api/users/export` GET trả CSV: id, username, email, firstName, lastName, role, department, company, activated, createdAt. Auth `users.read`.
- [x] B15_2. `/api/audit-log/export` GET với filter `from/to/actionType/itemType/actorId`. Auth `settings.read`. Limit 10000 rows.
- [x] B15_3. Parser `parseCsv(text)` handle quoted commas + escape quotes đúng RFC 4180 minimal.