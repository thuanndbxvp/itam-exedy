# BLOCKERS: ui-overhaul

**Feature slug:** ui-overhaul
**Phát hiện lúc:** Step 0 — Pre-Audit (đọc source code so với MSEW)
**Engineer:** Tầng 2 (Tier 2)

## Blocker #1 — Code hiện tại ĐÃ VƯỢT scope MSEW rất nhiều
- **Type:** Scope Creep / Existing Implementation
- **Description:** Khi pre-audit, tôi phát hiện UI Overhaul đã được implement từ phiên trước với scope **vượt xa** những gì MSEW-ui-overhaul.md liệt kê:
  - `Sidebar.tsx` có 4 nav items (Dashboard, Tài sản, Bản quyền, **Cài đặt**) — MSEW chỉ liệt kê 3 (không có Cài đặt)
  - `Header.tsx` có dynamic page title dựa trên pathname + Bell badge + user menu — MSEW không yêu cầu
  - `page.tsx` (Dashboard) có thêm section "Hoạt động gần đây" với `prisma.actionLog.findMany({ include: { asset, license } })` — MSEW chỉ yêu cầu 3 cards đơn giản
  - `assets/page.tsx` query `orderBy: { createdAt: 'desc' }` — nhưng Asset schema không có field `createdAt`
  - `assets/new/page.tsx` form được styled rất premium với icon cards
- **Decision Tree:**
  - Lựa chọn A: **Ghi đè tất cả theo MSEW gốc** (xóa các cải tiến) → phá vỡ tính năng đang hoạt động
  - Lựa chọn B: **Giữ code hiện tại** (đã có UI đẹp hơn MSEW) → nhưng 3 type errors ở `assets/page.tsx` và `page.tsx` chặn build
- **Suggestion for Planner:**
  1. Nếu Tầng 1 muốn giữ code hiện tại → cần **sửa schema.prisma** thêm `createdAt` cho Asset + thêm relations `asset` và `license` trên `ActionLog`. Hoặc sửa queries trong code để match schema hiện tại.
  2. Nếu Tầng 1 muốn áp dụng đúng MSEW → cho phép tôi ghi đè bằng code MSEW gốc (sẽ mất Dashboard Recent Activity và Settings nav).
- **Awaiting:** Planner review quyết định hướng đi

## Blocker #2 — Type errors ngăn build pass
- **Type:** Wrong Skill / Schema Mismatch
- **Description:** Sau khi chạy `tsc --noEmit`, phát hiện **9 errors** ở `src/app/page.tsx` và `src/app/assets/page.tsx`:
  ```
  src/app/assets/page.tsx(11,16): error TS2353: 'createdAt' does not exist in AssetOrderByWithRelationInput
  src/app/assets/page.tsx(93,95,99,102,104,111): Property 'status'/'assignedTo'/'createdAt' does not exist (Prisma 7 không include relations trên singleton type)
  src/app/page.tsx(14,7): '{ asset: true; license: true; }' not assignable to type 'never' (ActionLog không có relations này)
  src/app/page.tsx(75,65): Property 'assetTag' does not exist on type 'never'
  ```
- **Root cause:** Code tham chiếu schema fields (`Asset.createdAt`, `ActionLog.asset`, `ActionLog.license`) mà Prisma schema không có.
- **Suggestion for Planner:**
  - Quyết định hướng đi trong Blocker #1 trước. Sau đó tôi sẽ áp dụng hướng đó.
- **Awaiting:** Planner review

## Trạng thái thực thi

Tôi **đã dừng lại** theo luật Tier 2 (TIER2_PROMPT.md quy tắc 1 + 4):
- ✅ Đã Pre-Audit (đọc PLAN + MSEW + source code hiện tại)
- ✅ Phát hiện xung đột scope creep
- ✅ Không tự ý sửa/ghi đè code đang chạy (vượt thẩm quyền)
- ✅ Đã chạy `tsc --noEmit` → fail → ghi BLOCKERS
- ✅ Đã chạy `next build` → cũng fail (Type errors) → confirm mức độ

## Các bằng chứng kỹ thuật

### Files đã có sẵn (đã đẹp, KHÔNG đụng):
- `src/components/Sidebar.tsx` (89 dòng, Premium responsive với Menu/X hamburger)
- `src/components/Header.tsx` (55 dòng, dynamic title + bell + user menu)
- `src/app/layout.tsx` (đã wrap AppShell)
- `src/app/page.tsx` (Dashboard 3 cards + Recent Activity)
- `src/app/assets/page.tsx` (Premium data table) — **NHƯNG có TS errors**
- `src/app/assets/new/page.tsx` (Premium form)

### Files CHƯA CÓ (không có theo PLAN):
- Không có (tất cả files PLAN list đều đã tồn tại)

### Schema:
- `lucide-react@^1.26.0` đã cài (cũ, có thể gây icon naming issues nhưng chưa fail trong build)

### Cấu hình project:
- Next 16.2.11
- Prisma 7.9.0 (v7 có thay đổi type generation so với v4-v6)
- TypeScript 5.x

## Hành động đề xuất (tùy thuộc quyết định của Tầng 1)

### Hướng A — Giữ code hiện tại + sửa type errors
1. Tầng 1 ra PLAN bổ sung: thêm `createdAt DateTime @default(now())` vào `Asset` model
2. Tầng 1 ra PLAN: thêm back-relations `actionLogs ActionLog[]` trên Asset và License
3. Chạy `prisma migrate dev --name add-ui-overhaul-fields`
4. Tôi sẽ sửa queries cho khớp schema mới
5. Build sẽ pass

### Hướng B — Ghi đè về đúng MSEW
1. Tầng 1 cho phép tôi xóa Recent Activity trên Dashboard và Settings nav trên Sidebar
2. Tôi sẽ replace `assets/page.tsx` và `assets/new/page.tsx` về version đơn giản (hoặc giữ Premium style)
3. Cập nhật queries để khớp schema hiện tại (bỏ `orderBy: createdAt`)
4. Build sẽ pass sau khi fix queries

### Hướng C (đề xuất) — Tách scope
1. Coi UI Overhaul như đã hoàn thành (đã có code đẹp)
2. Tạo task mới: `fix-schema-relations` để thêm fields mà UI code tham chiếu
3. Sau khi task mới xong, code UI-overhaul hiện tại sẽ pass build
