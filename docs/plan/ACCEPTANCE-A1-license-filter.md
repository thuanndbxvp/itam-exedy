# ACCEPTANCE: A1 - License List Filter Button

**Người lập:** Tier 1 (Planner) — scaffold by Tier 2 (2026-07-28 02:35)

## Functional Acceptance

```
[ ] F1. Truy cập /licenses → thấy input Search và dropdown Status (không phải nút Filter giả)
[ ] F2. Gõ "test" vào Search + nhấn Enter → URL = /licenses?search=test → table filter
[ ] F3. Chọn Status = "active" → URL = /licenses?status=active → table filter
[ ] F4. Cả 2: Search + Status → URL = /licenses?search=...&status=... → table filter AND logic
[ ] F5. Refresh page → URL giữ filter state → table re-render với data filter
[ ] F6. Clear search (input rỗng) + chọn status → submit → URL = /licenses?status=...
[ ] F7. Click "Xóa bộ lọc" → URL = /licenses → table show all
[ ] F8. Search không match → table empty state "Không có license nào"
[ ] F9. Search case-insensitive: "OFFICE" match "Microsoft Office"
[ ] F10. Status dropdown có đúng enum values (verified từ schema.prisma)
```

## Non-Functional

```
[ ] NF1. Page render time không tăng > 200ms (Prisma where clause indexed)
[ ] NF2. URL search < 200 chars (giới hạn hợp lý)
[ ] NF3. Không có console error
[ ] NF4. Mobile: input + dropdown stack vertical, button full-width
```

## Security

```
[ ] S1. searchParams.search được sanitize (Prisma `contains` an toàn — không phải raw SQL)
[ ] S2. Không có SQL injection (Prisma parameterize queries)
[ ] S3. Filter áp dụng cho mọi user (không cần auth check riêng — page đã gate)
```

## Integration

```
[ ] I1. LicenseTable nhận filtered data, render đúng
[ ] I2. Pagination (nếu có) giữ filter state
[ ] I3. Export CSV (nếu có) respect filter
```

## Regression

```
[ ] R1. Trang /licenses không có searchParams → render tất cả (giống cũ)
[ ] R2. Click "Thêm license" → navigate to /licenses/new không bị ảnh hưởng
[ ] R3. Detail page /licenses/[id] không bị ảnh hưởng
```

## Verification Steps (Manual)

```bash
# 1. Start dev server
npm run dev

# 2. Visit
http://localhost:3000/licenses

# 3. Test cases
- Type "office" in search → Enter → check URL has ?search=office
- Select status=active → check URL has ?status=active
- Combine: ?search=office&status=active → only matching rows
- Refresh page → state preserved
- Click "Xóa bộ lọc" → URL = /licenses
```

## Auto-test (optional, defer)

- Unit test: `LicenseFilterBar.test.tsx` (mock router.push)
- E2E: Playwright (defer to later sprint)
