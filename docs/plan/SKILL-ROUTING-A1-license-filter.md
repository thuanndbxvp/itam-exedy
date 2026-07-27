# SKILL-ROUTING: A1 - License List Filter Button

**Người lập:** Tier 1 (Planner) — scaffold by Tier 2 (2026-07-28 02:35)

## Routing Matrix

| Bước | Task | Recommended Agent/Skill | Reason |
|------|------|-------------------------|--------|
| 1 | Verify License.status enum/string | `generalPurpose` (read-only) | Cần check schema.prisma:498-536 để biết type |
| 2 | Modify `src/app/licenses/page.tsx` | `code-reviewer` (sau khi code) | Server Component refactor, cần verify searchParams handling |
| 3 | Create `LicenseFilterBar.tsx` | `react-reviewer` (sau khi code) | Client Component với hooks, cần verify React idioms |
| 4 | Manual test | Manual browser | Click test |
| 5 | Commit | Tier 2 tự commit | Theo Tier 2 protocol |

## Skill Activation Order

```
1. Read schema.prisma:498-536 (verify License model + status field)
2. Read current src/app/licenses/page.tsx (current implementation)
3. Read src/components/licenses/LicenseTable.tsx (consumer of data)
4. Code
5. tsc + build
6. Manual test
7. Commit
```

## Sub-skill activation

- **ui-styling**: KHÔNG cần — chỉ dùng Tailwind cơ bản (button, input, select)
- **shadcn**: KHÔNG cần — không dùng modal/dropdown shadcn cho MVP
- **react-reviewer**: CÓ — sau khi code xong để verify hooks
- **code-reviewer**: CÓ — sau khi code xong để verify searchParams handling

## Decision Points

- **Q1: Dùng dropdown native hay custom?**
  → Native `<select>` cho MVP. Custom dropdown nếu cần search bên trong (defer).
- **Q2: Debounce search input?**
  → KHÔNG cho MVP. User nhấn Enter hoặc click Search button. Debounce thêm nếu cần sau.
- **Q3: Status enum values?**
  → Cần verify schema. Nếu là enum `LicenseStatus` thì dùng enum values. Nếu là String thì dùng free-form.
