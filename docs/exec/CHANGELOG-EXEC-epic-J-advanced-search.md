# CHANGELOG EXEC: epic-J-advanced-search

| Step | File | Lines | Status |
|------|------|-------|--------|
| 1 | `src/app/api/search/route.ts` | ~120 | DONE |
| 2 | `src/components/search/GlobalSearchModal.tsx` | ~250 | DONE |
| 3 | `src/components/ui/Pagination.tsx` | ~130 | DONE |
| 4 | `src/components/assets/FilterPanel.tsx` | ~200 | DONE |
| 5 | `src/app/assets/page.tsx` | Refactored | DONE |
| 5 | `src/app/assets/AssetsPageClient.tsx` | Refactored | DONE |
| 6 | `src/components/AppShell.tsx` | Modified | DONE |
| 6 | `src/components/Header.tsx` | Modified | DONE |

**Linter fixes applied:**
- Fixed ESLint error: removed `setResults([])` from inside `useEffect` in GlobalSearchModal (cascading render warning)
- Fixed TypeScript error: `name` made optional in `SearchResult` interface (USER type doesn't have `name`)
- Added `getDisplayName()` helper for USER type display
- Fixed FilterPanel `useSearchParams()` wrapped in Suspense boundary (Next.js 16 requirement)

**Key architectural decisions:**
- Search is server-side: filters applied in Prisma `where` clause via `searchParams`
- Client-side search input kept as visual placeholder (search via filter panel or global search modal)
- GlobalSearchModal mounted globally in AppShell, opens via custom DOM event
- `Suspense` boundary wraps FilterPanel + Pagination (they use `useSearchParams`)

**Total:** ~700 lines added across 8 files.
**Audit:** ESLint + tsc + build all green.
