# SKILL USAGE: ui-overhaul

## Project Context
- **Stack:** Next.js 16.2.11 + React 19 + Prisma 7.9 + PostgreSQL
- **Project:** IT-Asset-Management (Premium UI overhaul)

## Skills Invoked

| Skill | Effectiveness | Notes |
|-------|---------------|-------|
| `code.md` (Tier 2 loop) | HIGH | Step 0 (Pre-Audit) hoạt động đúng — phát hiện vấn đề sớm |
| `audit.md` (Self-audit) | HIGH | `tsc --noEmit` ngay lập tức bắt được schema mismatch |

## CodeGraph Tools

- Không dùng (manual read + grep đủ cho task này)

## Notes

### Tại sao Tầng 2 dừng lại thay vì tự sửa

Theo TIER2_PROMPT.md:
- Quy tắc 1 (Pre-Audit): phát hiện lỗ hổng logic / xung đột dữ liệu / kiến trúc không khả thi → **CÓ QUYỀN TỪ CHỐI CODE**
- Quy tắc 4 (Escape hatch): lỗi phức tạp (logic, scope creep, missing features) → DỪNG LẠI + báo User

Cả 2 quy tắc đều áp dụng:
1. **Scope creep** hiện có (code vượt MSEW)
2. **Schema mismatch** (Type errors) — không phải simple syntax error

### Phân tích lỗi

```
src/app/assets/page.tsx(11,16): error TS2353: 
  'createdAt' does not exist in AssetOrderByWithRelationInput

src/app/assets/page.tsx(93,95,99,102,104,111):
  Property 'status'/'assignedTo'/'createdAt' does not exist on Asset type

src/app/page.tsx(14,7):
  '{ asset: true; license: true; }' not assignable to ActionLog include type

src/app/page.tsx(75,65):
  Property 'assetTag' does not exist on included 'asset' relation
```

### Root cause
- `Asset` model trong `prisma/schema.prisma` KHÔNG có `createdAt`
- `ActionLog` KHÔNG có back-relations tới `asset` hoặc `license`
- Code đang query các fields/relations không tồn tại trong schema

### Recommendation

Hướng C (tách task mới) là sạch nhất. Tier 1 nên ra PLAN + MSEW cho task `fix-schema-relations`, sau đó Tier 2 sẽ:
1. Thêm `createdAt DateTime @default(now())` vào Asset
2. Thêm relations ngược lên Asset và License
3. Chạy `prisma migrate dev`
4. Code UI hiện tại sẽ pass build

## Anti-Hallucination

- ✅ Không giả định code "chắc chắn chạy được" trước khi kiểm tra
- ✅ Đã verify bằng tools (`tsc`, `next build`) thay vì "seems fine"
- ✅ Không cố fix ngoài scope thẩm quyền