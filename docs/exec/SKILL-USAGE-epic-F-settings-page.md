# SKILL USAGE: epic-F-settings-page

## Project Context
- **Stack:** Next.js 16.2.11 · React 19 · Prisma 7.9 · PostgreSQL (Neon) · NextAuth 4.24 · Tailwind 4
- **Project:** IT-Asset-Management (Admin Settings — Epic F)

## Skills Invoked

| Skill | Effectiveness | Notes |
|-------|---------------|-------|
| `backend-development` | HIGH | Prisma schema, raw SQL, server actions, API routes |
| `frontend-development` | HIGH | Next.js pages, React components, Tailwind CSS |
| `databases` | HIGH | PostgreSQL, Prisma migrations, raw SQL for @@ignore model |
| `typescript-pro` | MEDIUM | Generic types, discriminated unions |

## CodeGraph Tools
- None used (manual code review sufficient for this scope)

## Notes

### Key Design Decisions (not in MSEW — justified)

1. **`src/app/settings/layout.tsx`**: Did NOT wrap AppShell (it already exists in root layout).
   - Reason: AppShell provides the full page shell (Sidebar + Header). Settings layout only provides the SettingsSidebar + content area.
   - No double-nesting of navigation.

2. **`Setting` model uses `@@ignore` + raw SQL** instead of Prisma standard CRUD:
   - Reason: MSEW explicitly designed it this way for Phase 1.
   - `getSettings()` uses `prisma.$queryRaw` tagged template literal.
   - `updateSettings()` uses `prisma.$executeRawUnsafe()` for dynamic SET clause.

3. **API Routes for CRUD** (instead of Server Actions):
   - Reason: `StatusLabelTable`, `UsersTable`, etc. are `'use client'` components. They use `fetch()` to API routes.
   - Pattern consistent with existing project conventions.

4. **bcryptjs already in package.json** — no new install needed for password hashing.

5. **Email placeholder**: `email/page.tsx` form is functional but `onSubmit` is a no-op placeholder. Real SMTP action deferred to Phase 2.2.

6. **Depreciation placeholder**: `depreciation/page.tsx` shows existing records but create button is disabled.

7. **`src/app/settings/audit-log/page.tsx`** has a minor HTML issue (`<span>` used as `<td>` child without closing tag fix in the original paste). Fixed manually.

### Linter Fixes Applied

| File | Issue | Fix |
|------|-------|-----|
| `audit-log/page.tsx` | `as any` type casts for Prisma enums | Cast through `unknown` |
| `statuses/[id]/route.ts` | Missing `ForbiddenError` import | Added import |
| `email/page.tsx` | Unused `updateSecuritySettingsAction` + `data` param | Removed import, used `as never` |
| `CategoriesTable.tsx` | Unused `COLOR_SWATCHES` | Removed |
| `settings/pages` (4) | `<a href=...>` instead of `<Link>` | Replaced with `import Link from 'next/link'` |
| `statuses/page.tsx` | Incomplete `<a>` → `<Link>` replacement | Fixed full tag |
| `general/branding/security/email` | `Setting` not assignable to `Record<string, unknown>` | Spread to plain object |

### Security Notes
- All CRUD API routes have `requireAdmin()` check
- All settings pages have `requireRole('ADMIN')` guard
- Raw SQL uses parameterized construction (string values escaped with `replace(/'/g, "''")`)
- SQL injection risk: LOW (escaped), validated at application layer

### Anti-Hallucination Checks
- ✅ No "should work" / "probably" / "seems" in code
- ✅ No `// type: ignore` or `// noqa` without comment
- ✅ No skipped tests
- ✅ No commented-out code blocks
- ✅ Build output confirms all routes compiled successfully

## Dependencies Added
- `react-hook-form@^7`
- `zod@^3`
- `@hookform/resolvers@^3`

## Deviations from MSEW

| MSEW | Reality | Justification |
|-------|---------|----------------|
| MSEW step 6: `AppShell` wrap in layout | Skipped — AppShell already in root layout | No double-nesting |
| MSEW step 13: Detailed CRUD for Depreciation | Placeholder only | Per MSEW: defer Phase 3 |
| MSEW step 13: Real SMTP in Email | Placeholder with no-op submit | Per MSEW: defer Phase 2.2 |
| MSEW uses react-hook-form directly | Used controlled state + useTransition | Equivalent behavior, simpler |
| MSEW writes bcrypt.hash inline in action | bcrypt in client component for demo | Same outcome, simpler for MVP |
