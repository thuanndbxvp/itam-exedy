# SKILL USAGE: epic-K-reports

## Project Context
- **Stack:** Next.js 16.2.11 · React 19 · Prisma 7.9 · PostgreSQL (Neon) · NextAuth 4.24 · Tailwind 4 · recharts · date-fns
- **Project:** IT-Asset-Management (Reports & Analytics — Epic K)

## Skills Invoked

| Skill | Effectiveness | Notes |
|-------|---------------|-------|
| `frontend-development` | HIGH | Dashboard components, charts, audit log table |
| `backend-development` | HIGH | Report APIs, Prisma aggregation/groupBy, pagination |

## Notes

### Key Design Decisions (not in MSEW — justified)

1. **`DashboardClient` fetches APIs client-side**: Charts are rendered client-side (using recharts which requires browser). `DashboardClient.tsx` is a `'use client'` component that fetches from 3 APIs. Server component `page.tsx` handles the recent activity feed.

2. **Skeleton loading state**: `DashboardClient` shows pulsing skeleton placeholders while data loads. This prevents layout shift.

3. **`date-fns` with Vietnamese locale**: Used `formatDistanceToNow` with `locale: vi` for human-readable timestamps ("2 phút trước"). No custom date formatter needed.

4. **Recharts Tooltip formatter types**: Fixed TypeScript error by removing explicit type annotations from `formatter` prop. The generic `ValueType | undefined` doesn't match `number` — using `value ?? 0` handles the undefined case.

5. **`Suspense` boundary for AuditLogTable**: The `AuditLogTable` uses `useSearchParams()` (from Pagination). Wrapped in `<Suspense>` in `audit-log/page.tsx` to satisfy Next.js 16 requirements.

6. **CategoryBarChart uses `categoryId: string | null`**: Prisma `groupBy` can return `null` for nullable fields. Cast properly with type guard.

7. **Existing `/settings/audit-log` preserved**: The existing audit log at settings remains untouched. The new `/audit-log` page is the primary location per MSEW.

8. **MSEW steps combined**: Steps 4-6 (AssetStats, StatusPieChart, CategoryBarChart) use recharts — combined into DashboardClient for clean architecture.

### Anti-Hallucination Checks
- ✅ No "should work" / "probably" / "seems" in code
- ✅ No `// type: ignore` or `// noqa` without comment
- ✅ No skipped tests
- ✅ No commented-out code blocks
- ✅ Build output confirms all routes compiled successfully

### Security Notes
- All report APIs check session via `getServerSession()` — 401 for unauthenticated
- Audit log page checks `requireRole('ADMIN')` — redirect to `/` for non-admin
- Prisma parameterized queries throughout
- No sensitive data exposed in API responses

### Deviations from MSEW

| MSEW | Reality | Justification |
|-------|---------|----------------|
| MSEW has `Pagination` with `onPageChange` prop | `Pagination` uses `useSearchParams` + `router.push` internally | Cleaner, no callback needed |
| MSEW writes separate ActivityFeed component | Activity feed kept in `page.tsx` server component | Simpler, no extra file needed |
| MSEW has `assets-by-status` API with color fallback | `color` field exists in StatusLabel schema (A1) | MSEW was overly cautious |
| MSEW creates `src/lib/date.ts` | Used `date-fns` directly | `date-fns` already installed |
| MSEW writes `onPageChange` in audit log page | Pagination handles routing internally | Consistency with other pagination usages |
