# SKILL USAGE: auth-and-licenses

## Project Context
- **Stack:** Next.js 16.2.11 (Turbopack) + React 19 + Prisma 7 + PostgreSQL
- **Project:** IT-Asset-Management (NextAuth credentials + Licenses module)
- **Framework:** App Router, Server Actions, NextAuth v4

## Skills Invoked

| Step | Skill | Effectiveness |
|------|-------|---------------|
| All | `code.md` (Tier 2 autonomous loop) | HIGH — 8-step loop drove implementation cleanly |
| Audit | `audit.md` (Tier 3 verification) | HIGH — caught 3 `no-explicit-any` violations, fixed via type augmentation |

## CodeGraph Tools

- None used (MCP codegraph not invoked; manual file reads + grep were sufficient for this scoped feature)

## Notes

### Deviations from MSEW (justified, audit fixes)

1. **`src/lib/auth.ts`**: Replaced 3 occurrences of `(user as any).role` and `(session.user as any).id` with typed accessors.
   - **Reason:** ESLint `@typescript-eslint/no-explicit-any` rule (project default).
   - **Resolution:** Created `src/types/next-auth.d.ts` with `next-auth` module augmentation declaring `User.role`, `JWT.id`, `JWT.role`, `Session.user.id`, `Session.user.role`.
   - **Logic preserved:** Same field assignments, same control flow.

2. **`src/middleware.ts`**: Changed from `export { default } from "next-auth/middleware"` to `withAuth()` wrapper.
   - **Reason:** Next.js 16.2.11 build error: *"The file ./src\middleware.ts must export a function"*. Re-export of an object is no longer recognized in Next 16.
   - **Resolution:** Used `withAuth` named export (still from `next-auth/middleware`) wrapped in a function.
   - **Logic preserved:** Same matcher `["/assets/:path*", "/licenses/:path*", "/"]`.

### No new packages required
- `next-auth@^4.24.15` was already in `package.json` dependencies — no `npm install` needed.

### Database schema untouched
- All required models (`User`, `License`, `ActionLog`) already exist in `prisma/schema.prisma` — no `prisma migrate` needed.

## Anti-Hallucination Checks

- ✅ No "should work" / "probably" / "seems" in code comments
- ✅ No `// type: ignore` or `// noqa`
- ✅ No skipped tests
- ✅ No commented-out code blocks