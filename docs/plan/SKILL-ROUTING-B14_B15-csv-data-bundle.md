# SKILL-ROUTING: B14-B15 CSV/Data Bundle

**Người lập:** Tier 2 (Coder, scaffolded)

| Bước | Task | Skill | Lý do |
|------|------|-------|--------|
| 1 | Tạo `lib/csv.ts` | `code-architect` | Pure functions, dễ test |
| 2 | Refactor assets/export | `backend-engineer` | Thay inline → helper |
| 3 | Refactor licenses/export | `backend-engineer` | Cùng pattern |
| 4 | Build users/export | `backend-engineer` | Server-side role/company resolve |
| 5 | Build audit-log/export | `backend-engineer` | Filter logic + RBAC |

## Verification

- `npx tsc --noEmit`
- Manual:
  - Download `/api/assets/export` → mở Excel → tiếng Việt OK
  - Download `/api/users/export?role=EMPLOYEE` → chỉ EMPLOYEE rows
  - Download `/api/audit-log/export?actionType=LOGIN` → chỉ login rows