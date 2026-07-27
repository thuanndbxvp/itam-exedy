# CONTEXT — EPIC G: Bulk Operations

**Người lập:** Tier 1 (Planner)
**Ngày lập:** 2026-07-27

---

## 1. Tổng quan

Epic G cung cấp bulk operations cho admin:
- Bulk checkout: cấp phát nhiều assets cùng lúc cho 1 user
- Bulk checkin: thu hồi nhiều assets cùng lúc
- CSV import: import assets từ file CSV
- CSV export: export assets ra file CSV

---

## 2. Domain entities

| Entity | Mô tả |
|--------|--------|
| `Asset` | Tài sản trong hệ thống |
| `StatusLabel` | Trạng thái tài sản |
| `ActionLog` | Nhật ký hành động |

---

## 3. Tech stack đã dùng

| Tech | Vai trò |
|------|---------|
| Next.js | App Router, Server Components |
| Prisma | ORM, raw queries |
| NextAuth | Authentication |
| Tailwind CSS | Styling |
| Lucide React | Icons |

---

## 4. Existing patterns

### Bulk operations pattern
- Mỗi item được xử lý độc lập (không shared transaction)
- Nếu item N fail, item N+1 vẫn tiếp tục
- Return summary với success/fail counts

### CSV format
```csv
assetTag,name,serial,model,category,status,notes
AST001,Laptop Dell,SN123,Dell XPS 13,Computer,Available,Gift
```

---

**HẾT CONTEXT-epic-G-bulk-operations.md**
