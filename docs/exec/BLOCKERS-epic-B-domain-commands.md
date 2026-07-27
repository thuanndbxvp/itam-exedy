# Báo cáo Điểm nghẽn (BLOCKERS) — epic-B-domain-commands

**Người lập:** Tier 2 (Coder / Auditor)
**Ngày lập:** 2026-07-26
**Mục đích:** Ghi nhận các ambiguity Tier 2 gặp phải trong quá trình thi công + cách giải quyết.

---

## Blocker #1 — `LockedError` extends `ConflictError` không thể override `code` (readonly)

- **Phát hiện tại Workflow Step:** BƯỚC 1 (tạo `src/lib/errors.ts`)
- **Loại Blocker (Type):** [ TypeScript readonly field conflict — fix được trong cùng step ]
- **Mô tả chi tiết (Description):**

  Initial design: `LockedError extends ConflictError` để tận dụng `code = 'CONFLICT'` default. Sau đó muốn override `code = 'LOCKED'` để UI render message khác cho race-condition.

  TypeScript báo lỗi:
  ```
  src/lib/errors.ts(69,10): error TS2540: Cannot assign to 'code' because it is a read-only property.
  ```

  Lý do: `DomainError.code` được khai báo `readonly` để ép type safety. `LockedError` extend `ConflictError` (cũng readonly) → không thể override.

- **Decision Tier 2 đưa ra:**

  Thay vì `extends ConflictError`, đổi sang `extends DomainError` trực tiếp. Vẫn giữ `code = 'LOCKED'` (override qua constructor). UI discriminate dựa trên `code` string, không cần `instanceof ConflictError`.

- **Tại sao KHÔNG escalate lên Tier 1:**

  - Đây là TypeScript edge case, không phải design decision.
  - Tier 1 đã decide `LockedError` trong MSEW nhưng chưa specify exact class hierarchy.
  - Sửa trong cùng step, không ảnh hưởng API.

- **Tier 2 đã làm gì:**

  - Edit `src/lib/errors.ts`: `class LockedError extends DomainError` (thay vì `extends ConflictError`).
  - Constructor gọi `super('LOCKED', ...)` thay vì `super(message, ...)` rồi override.
  - Verify: `npx tsc --noEmit` → 0 errors.

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT — không cần CSV thêm.

---

## Blocker #2 — `createAsset` export bị mất sau rewrite `actions/asset.ts`

- **Phát hiện tại Workflow Step:** BƯỚC 5 (rewrite `src/app/actions/asset.ts`)
- **Loại Blocker (Type):** [ Missing export sau rewrite — fix được trong cùng step ]
- **Mô tả chi tiết (Description):**

  Sau khi rewrite `src/app/actions/asset.ts` thành 4 command wrappers (`createAsset`, `checkoutAssetCmd`, `checkinAssetCmd`, `checkoutAssetToLocationCmd`), Tier 2 vô tình đặt `createAsset` SAU phần `runCommand` helper. Tưởng đã có 4 wrappers nhưng thực tế chỉ có 3 (`checkoutAssetCmd`, `checkinAssetCmd`, `checkoutAssetToLocationCmd`) — `createAsset` bị miss.

  TypeScript báo lỗi:
  ```
  src/app/assets/new/page.tsx(1,10): error TS2305: Module '"@/app/actions/asset"' has no exported member 'createAsset'.
  ```

- **Decision Tier 2 đưa ra:**

  Thêm `createAsset` ngay. Logic: vẫn gọi `prisma.asset.create` trực tiếp (không cần lock vì luôn là row mới), wrap trong `runCommand` helper để consistent error contract.

- **Tier 2 đã làm gì:**

  - Edit `src/app/actions/asset.ts`: thêm `createAsset` function (signature cũ từ A2), dùng `runCommand` wrapper.
  - Verify: `npx tsc --noEmit` → 0 errors.

- **Trạng thái:** ✅ ĐÃ GIẢI QUYẾT — không cần escalate.

---

## Blocker #3 — Next.js 16 vẫn cảnh báo `middleware.ts` deprecated (PHÁT HIỆN NGOÀI SCOPE)

- **Phát hiện tại Workflow Step:** BƯỚC 8 (verify dev server)
- **Loại Blocker (Type):** [ Pre-existing deprecation warning — KHÔNG thuộc Epic B scope ]
- **Mô tả chi tiết (Description):**

  `dev-server.err` chứa warning:
  ```
  The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/docs/messages/middleware-to-proxy
  ```

  File `src/middleware.ts` đã có sẵn từ A2 (auth middleware với `withAuth(callbacks.authorized: () => true)`). Tier 2 Phase 1 CHƯA rename vì:
  1. KHÔNG thuộc scope Epic B (theo MSEW Phụ lục A).
  2. Tier 1 cam kết xử lý ở Epic C.
  3. KHÔNG có breaking change — middleware vẫn hoạt động bình thường.

- **Tier 2 đã làm gì:**

  - Ghi nhận trong EVIDENCE §8.6.
  - Đề xuất ở WORKFLOW-STATUS §"Tiếp theo" — Epic C sẽ rename `middleware.ts` → `proxy.ts`.

- **Trạng thái:** ⏸️ CHƯA GIẢI — chờ Epic C xử lý.

---

## Tổng kết tình trạng

| # | Blocker | Phát hiện tại Step | Trạng thái |
|---|---------|---------------------|-----------|
| 1 | `LockedError` readonly code | Step 1 | ✅ ĐÃ GIẢI — đổi extends DomainError trực tiếp |
| 2 | `createAsset` missing export | Step 5 | ✅ ĐÃ GIẢI — khôi phục trong cùng step |
| 3 | `middleware.ts` deprecated | Step 8 (ngoài scope) | ⏸️ CHƯA GIẢI — đề xuất xử lý ở Epic C |

→ **0 blockers chặn** thi công Epic B. 2 blockers nhỏ đã giải trong cùng step. 1 blocker ngoài scope (Next.js deprecation) đã ghi nhận để Epic C xử lý.
