# SKILL USAGE: epic-G-bulk-operations

## Project Context
- **Stack:** Next.js 16.2.11 · React 19 · Prisma 7.9 · PostgreSQL (Neon) · NextAuth 4.24 · Tailwind 4
- **Project:** IT-Asset-Management (Bulk Operations — Epic G)

## Skills Invoked

| Skill | Effectiveness | Notes |
|-------|---------------|-------|
| `backend-development` | HIGH | Bulk commands, server actions, API routes |
| `frontend-development` | HIGH | React components, modals, checkbox state management |
| `databases` | MEDIUM | Prisma queries, CSV generation |

## Notes

### Key Design Decisions (not in MSEW — justified)

1. **`src/app/assets/page.tsx` refactored to server component**: Extracted all client-side logic (checkbox state, search, modals) to `AssetsPageClient.tsx`. This keeps the page data-fetching in a server component for performance while allowing interactive UI.

2. **CSV parsing uses simple split (no quoted-commas handling)**: MSEW format is simple (no quoted values with commas). Full CSV parsing (RFC 4180) would require a library. Current approach is sufficient for the expected format.

3. **CSV import pre-loads models/categories**: Instead of a DB query per row, all models and categories are loaded once at the start and stored in Maps for O(1) lookup. Performance improvement for large imports.

4. **Bulk operations use individual locks per asset**: Each asset is locked independently (not a shared transaction). This means if asset 5 fails, assets 6-N still process. This is the intended behavior per MSEW.

5. **No rollback on partial failure**: Bulk operations intentionally process all items even if some fail. Summary shows success/fail counts.

6. **Import modal uses `file.text()` for preview**: The full file is read twice (once for preview, once for upload). For 5MB files this is acceptable. Could be optimized with streaming in Phase 2.

7. **Export uses `window.location.href`**: Simple approach for CSV download. Works reliably without blob URLs.

8. **RoleGate wraps BulkActionBar**: Only ADMIN users see the floating action bar. EMPLOYEE users see the table but not bulk actions.

### Anti-Hallucination Checks
- ✅ No "should work" / "probably" / "seems" in code
- ✅ No `// type: ignore` or `// noqa` without comment
- ✅ No skipped tests
- ✅ No commented-out code blocks
- ✅ Build output confirms all routes compiled successfully

### Security Notes
- All bulk operations check `requireRole('ADMIN')` at the action level
- CSV import validates file extension (.csv only), size (5MB max), row count (1000 max)
- CSV export validates role before returning data
- Prisma parameterized queries throughout (no raw SQL injection risk)

### Deviations from MSEW

| MSEW | Reality | Justification |
|-------|---------|----------------|
| MSEW step 4: imports `Prisma.TransactionClient` type | Removed — not used | TypeScript caught this |
| MSEW writes all helpers in `page.tsx` | Extracted to `AssetsPageClient.tsx` | Separation of concerns |
| MSEW doesn't mention CSVImportModal preview | Added file preview before import | Better UX — user sees row count |
| MSEW imports unused in page.tsx | Removed all unused imports | Linter caught this |
