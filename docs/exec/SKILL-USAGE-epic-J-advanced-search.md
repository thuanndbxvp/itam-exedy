# SKILL USAGE: epic-J-advanced-search

## Project Context
- **Stack:** Next.js 16.2.11 · React 19 · Prisma 7.9 · PostgreSQL (Neon) · NextAuth 4.24 · Tailwind 4
- **Project:** IT-Asset-Management (Advanced Search & Filters — Epic J)

## Skills Invoked

| Skill | Effectiveness | Notes |
|-------|---------------|-------|
| `backend-development` | HIGH | Search API, Prisma queries, pagination logic |
| `frontend-development` | HIGH | React components, modals, keyboard navigation |

## Notes

### Key Design Decisions (not in MSEW — justified)

1. **GlobalSearchModal mounted in AppShell globally**: Instead of importing in every page, the modal is rendered once in `AppShell` and opened via a custom DOM event (`open-global-search`). This avoids duplicating the modal across pages.

2. **"/" shortcut implemented via global `window.addEventListener`**: Uses a custom event approach (dispatched from Header click or `"/"` keypress outside inputs). This avoids re-adding listeners when navigating between pages.

3. **Search is server-side, not client-side**: `AssetsPageClient` no longer filters locally. All filtering happens in `page.tsx` via `searchParams`. Client-side search input is a visual placeholder — actual search goes through FilterPanel or GlobalSearchModal.

4. **FilterPanel + Pagination wrapped in `Suspense`**: Next.js 16 requires `useSearchParams()` to be inside a `Suspense` boundary. The entire `AssetsPageClient` + filter/pagination bar is wrapped in Suspense in `page.tsx`.

5. **`SearchResult.name` made optional**: The interface originally required `name`, but USER results only have `firstName`/`lastName`. Made optional and added `getDisplayName()` helper.

6. **No debounce cleanup warning**: The `setTimeout` cleanup in GlobalSearchModal is proper (returns `clearTimeout(timer)`).

7. **No saved filters (Phase 2 scope)**: Not implemented — this was deferred per MSEW plan.

### Anti-Hallucination Checks
- ✅ No "should work" / "probably" / "seems" in code
- ✅ No `// type: ignore` or `// noqa` without comment
- ✅ No skipped tests
- ✅ No commented-out code blocks
- ✅ Build output confirms all routes compiled successfully

### Security Notes
- All search API routes check session via `getServerSession()` — unauthenticated users get 401
- No sensitive data exposed in search results (only id, name, assetTag, serial, email)
- Prisma parameterized queries throughout

### Deviations from MSEW

| MSEW | Reality | Justification |
|-------|---------|----------------|
| MSEW writes `Pagination` with `onPageChange` prop | `Pagination` uses `useSearchParams` + `router.push` directly | Simpler, no callback prop needed |
| MSEW shows `onPageChange` in page.tsx | `onPageChange` removed, Pagination handles routing internally | Cleaner architecture |
| MSEW FilterPanel called separately from page | FilterPanel wrapped in Suspense in page.tsx | Next.js 16 requirement |
| MSEW writes `getSubtitle` assuming `name` always exists | `name` optional, `getDisplayName()` handles USER type | TypeScript strict mode |
| MSEW has `getPageData` inline | Kept `getPageData` as separate function | Better readability |
